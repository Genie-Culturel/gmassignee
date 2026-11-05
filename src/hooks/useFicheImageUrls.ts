import { useEffect, useState } from 'react';
import { getSignedImageUrls } from '@/lib/ficheImages';

/**
 * Resolves fiche image paths to signed URLs (1h expiry).
 * Handles data URLs and already-signed URLs as-is.
 */
export function useFicheImageUrls(paths: string[] | undefined): Record<string, string> {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const key = (paths || []).join('|');

  useEffect(() => {
    if (!paths || paths.length === 0) {
      setUrls({});
      return;
    }
    let cancelled = false;
    getSignedImageUrls(paths)
      .then((result) => {
        if (!cancelled) setUrls(result);
      })
      .catch((err) => {
        console.error('[useFicheImageUrls] Failed to sign URLs:', err);
        if (!cancelled) {
          setUrls(Object.fromEntries(paths.map((p) => [p, p])));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  return urls;
}
