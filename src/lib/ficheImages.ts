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

/** Upload one image for a fiche step; returns its public URL. */
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
  return supabase.storage.from(FICHE_IMAGES_BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Best-effort removal of an uploaded image (ignored for data URLs / foreign URLs). */
export async function deleteFicheImage(url: string): Promise<void> {
  if (isMockMode || !supabase) return;
  const marker = `/object/public/${FICHE_IMAGES_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx < 0) return;
  const path = decodeURIComponent(url.slice(idx + marker.length).split('?')[0]);
  await supabase.storage.from(FICHE_IMAGES_BUCKET).remove([path]);
}
