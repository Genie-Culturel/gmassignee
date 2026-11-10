import { DEFAULT_SUPABASE_URL } from './config';
import {
  FICHE_IMAGES_BUCKET,
  ficheImagePublicUrl,
  resolveFicheImageSrc as resolveFicheImageSrcPure,
  storageKeyFromFicheImage,
} from './ficheImageUrl';
import { isMockMode, supabase } from './supabase';

export { FICHE_IMAGES_BUCKET } from './ficheImageUrl';
export {
  normalizeFicheImageForStorage,
  normalizeFicheStepImages,
  storageKeyFromFicheImage,
} from './ficheImageUrl';

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

function publicUrlForKey(key: string): string {
  if (supabase) {
    const { data } = supabase.storage.from(FICHE_IMAGES_BUCKET).getPublicUrl(key);
    if (data?.publicUrl) return data.publicUrl;
  }
  return ficheImagePublicUrl(key, DEFAULT_SUPABASE_URL);
}

/** Resolve a stored step image to an absolute `<img src>` (public bucket URL, or as-is for data/http). */
export function resolveFicheImageSrc(value: string): string {
  return resolveFicheImageSrcPure(value, publicUrlForKey);
}

/** Upload one image for a fiche step; returns the storage object key (not a URL). */
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
  const path = storageKeyFromFicheImage(pathOrUrl);
  if (!path) return;
  await supabase.storage.from(FICHE_IMAGES_BUCKET).remove([path]);
}

/**
 * Map stored step image values to display URLs.
 * The fiche-images bucket is public (migration 045), so keys resolve via getPublicUrl.
 * Signed URLs remain accepted as input and are converted back to a public URL via the key.
 */
export async function getSignedImageUrls(paths: string[]): Promise<Record<string, string>> {
  return Object.fromEntries((paths || []).map((path) => [path, resolveFicheImageSrc(path)]));
}

export function mapFicheImageUrls(paths: string[]): Record<string, string> {
  return Object.fromEntries((paths || []).map((path) => [path, resolveFicheImageSrc(path)]));
}

export function displayFicheImageSrc(stored: string, urls: Record<string, string>): string {
  return urls[stored] || resolveFicheImageSrc(stored);
}
