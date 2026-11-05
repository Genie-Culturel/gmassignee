import { isMockMode, supabase } from './supabase';

export const FICHE_IMAGES_BUCKET = 'fiche-images';
const MAX_SIDE = 1600;
const QUALITY = 0.8;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image illisible')); };
    img.src = url;
  });
}

/** Resize to max 1600px and re-encode as JPEG (~0.8). GIFs are kept as is. */
export async function compressImage(file: File): Promise<Blob> {
  if (file.type === 'image/gif') return file;
  const img = await loadImage(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.round(img.naturalWidth * scale);
  const h = Math.round(img.naturalHeight * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', QUALITY));
  if (!blob) return file;
  return blob.size < file.size || scale < 1 ? blob : file;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/** Upload one image for a fiche step; returns the storage path (for private bucket). */
export async function uploadFicheImage(ficheId: string, file: File): Promise<string> {
  const blob = await compressImage(file);
  if (isMockMode || !supabase) return blobToDataUrl(blob);
  const ext = blob.type === 'image/gif' ? 'gif' : blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg';
  const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`;
  const path = `${ficheId}/${id}.${ext}`;
  const { error } = await supabase.storage
    .from(FICHE_IMAGES_BUCKET)
    .upload(path, blob, { contentType: blob.type || 'image/jpeg', upsert: false });
  if (error) throw new Error(error.message);
  return path;
}

/** Best-effort removal of an uploaded image (ignored for data URLs / foreign URLs). */
export async function deleteFicheImage(pathOrUrl: string): Promise<void> {
  if (isMockMode || !supabase) return;
  let path: string;
  if (pathOrUrl.startsWith('data:')) return;
  if (pathOrUrl.includes('://')) {
    const publicMarker = `/object/public/${FICHE_IMAGES_BUCKET}/`;
    const authMarker = `/storage/v1/object/sign/${FICHE_IMAGES_BUCKET}/`;
    const pubIdx = pathOrUrl.indexOf(publicMarker);
    const authIdx = pathOrUrl.indexOf(authMarker);
    if (pubIdx >= 0) {
      path = decodeURIComponent(pathOrUrl.slice(pubIdx + publicMarker.length).split('?')[0]);
    } else if (authIdx >= 0) {
      path = decodeURIComponent(pathOrUrl.slice(authIdx + authMarker.length).split('?')[0]);
    } else {
      return;
    }
  } else {
    path = pathOrUrl;
  }
  await supabase.storage.from(FICHE_IMAGES_BUCKET).remove([path]);
}

/** Generate signed URLs for fiche image paths (1h expiry). Returns map path→URL. */
export async function getSignedImageUrls(paths: string[]): Promise<Record<string, string>> {
  if (isMockMode || !supabase) return Object.fromEntries(paths.map((p) => [p, p]));
  const storagePaths = paths.filter((p) => !p.startsWith('data:') && !p.includes('://'));
  if (storagePaths.length === 0) {
    return Object.fromEntries(paths.map((p) => [p, p]));
  }
  const { data, error } = await supabase.storage
    .from(FICHE_IMAGES_BUCKET)
    .createSignedUrls(storagePaths, 3600);
  if (error) throw new Error(error.message);
  const result: Record<string, string> = {};
  paths.forEach((p) => {
    if (p.startsWith('data:') || p.includes('://')) {
      result[p] = p;
    }
  });
  data?.forEach((item) => {
    if (item.signedUrl && item.path) result[item.path] = item.signedUrl;
  });
  return result;
}
