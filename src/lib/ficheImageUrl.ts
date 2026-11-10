export const FICHE_IMAGES_BUCKET = 'fiche-images';

const STORAGE_KEY_MARKERS = [
  `/object/public/${FICHE_IMAGES_BUCKET}/`,
  `/object/sign/${FICHE_IMAGES_BUCKET}/`,
  `/object/authenticated/${FICHE_IMAGES_BUCKET}/`,
  `/render/image/public/${FICHE_IMAGES_BUCKET}/`,
];

function stripQueryAndHash(value: string): string {
  return value.split('#')[0].split('?')[0];
}

export function isInlineImageValue(value: string): boolean {
  return value.startsWith('data:') || value.startsWith('blob:');
}

export function isAbsoluteHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value) || value.startsWith('//');
}

/**
 * Extract the bucket object key from a stored step image value.
 * Accepts a raw key (`ficheId/uuid.jpg`), a public/signed Supabase URL, or null if the
 * value is an inline data/blob URL or an unrelated absolute URL.
 */
export function storageKeyFromFicheImage(value: string): string | null {
  const trimmed = (value || '').trim();
  if (!trimmed || isInlineImageValue(trimmed)) return null;

  const withoutQuery = stripQueryAndHash(trimmed);
  for (const marker of STORAGE_KEY_MARKERS) {
    const idx = withoutQuery.indexOf(marker);
    if (idx >= 0) {
      const raw = withoutQuery.slice(idx + marker.length);
      if (!raw) return null;
      try {
        return decodeURIComponent(raw);
      } catch {
        return raw;
      }
    }
  }

  if (isAbsoluteHttpUrl(trimmed) || /^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return null;
  if (trimmed.startsWith('/') || trimmed.startsWith('.') || withoutQuery.includes('..')) return null;
  return withoutQuery.replace(/^\/+/, '') || null;
}

export function ficheImagePublicUrl(key: string, supabaseUrl: string): string {
  const base = supabaseUrl.replace(/\/+$/, '');
  const encoded = key
    .split('/')
    .filter((segment) => segment.length > 0)
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  return `${base}/storage/v1/object/public/${FICHE_IMAGES_BUCKET}/${encoded}`;
}

/**
 * Resolve a stored step image (key, public URL, signed URL, or data URL) to an
 * `<img src>` value. Never returns a site-relative path (those 404 on GitHub Pages).
 */
export function resolveFicheImageSrc(
  value: string,
  publicUrlForKey: (key: string) => string
): string {
  const trimmed = (value || '').trim();
  if (!trimmed) return '';
  if (isInlineImageValue(trimmed)) return trimmed;
  const key = storageKeyFromFicheImage(trimmed);
  if (key) return publicUrlForKey(key);
  if (isAbsoluteHttpUrl(trimmed)) return trimmed;
  return '';
}

/** Persist the bucket key (or data URL in demo). Drop unusable relative leftovers. */
export function normalizeFicheImageForStorage(value: string): string | null {
  const trimmed = (value || '').trim();
  if (!trimmed) return null;
  if (isInlineImageValue(trimmed)) return trimmed;
  const key = storageKeyFromFicheImage(trimmed);
  if (key) return key;
  if (isAbsoluteHttpUrl(trimmed)) return trimmed;
  return null;
}

export function normalizeFicheStepImages(images: string[] | undefined): string[] {
  if (!images?.length) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const img of images) {
    const normalized = normalizeFicheImageForStorage(img);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
  }
  return out;
}
