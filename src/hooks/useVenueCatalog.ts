import { useEffect, useState } from 'react';
import { isMockMode, supabase } from '@/lib/supabase';
import { DEMO_CATALOG, VenueCatalog } from '@/lib/venues';

const EMPTY_CATALOG: VenueCatalog = { locations: [], games: [] };

export function useVenueCatalog() {
  const [catalog, setCatalog] = useState<VenueCatalog>(isMockMode ? DEMO_CATALOG : EMPTY_CATALOG);
  const [isLoading, setIsLoading] = useState(!isMockMode);

  useEffect(() => {
    if (isMockMode || !supabase) {
      setCatalog(DEMO_CATALOG);
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      console.log('[useVenueCatalog] Fetching locations and games...');
      const [locRes, gameRes] = await Promise.all([
        supabase.from('gh_locations').select('id, slug, name, short_name, kind, sort_index').order('sort_index'),
        supabase.from('gh_games').select('id, location_id, slug, name, sort_index').order('sort_index'),
      ]);
      if (cancelled) return;
      if (locRes.error || gameRes.error) {
        console.error('[useVenueCatalog] Errors:', { locError: locRes.error, gameError: gameRes.error });
        setCatalog(EMPTY_CATALOG);
      } else if (!locRes.data?.length) {
        console.warn('[useVenueCatalog] No locations found');
        setCatalog(EMPTY_CATALOG);
      } else {
        console.log('[useVenueCatalog] Loaded', locRes.data.length, 'locations,', gameRes.data?.length || 0, 'games');
        setCatalog({
          locations: locRes.data as VenueCatalog['locations'],
          games: (gameRes.data || []) as VenueCatalog['games'],
        });
      }
      setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { catalog, isLoading };
}
