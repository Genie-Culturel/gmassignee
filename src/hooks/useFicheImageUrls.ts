import { mapFicheImageUrls } from '@/lib/ficheImages';

/**
 * Resolves fiche image storage keys / URLs to absolute display URLs.
 * Public bucket → getPublicUrl (sync). Data URLs and foreign http(s) URLs pass through.
 */
export function useFicheImageUrls(paths: string[] | undefined): Record<string, string> {
  return mapFicheImageUrls(paths || []);
}
