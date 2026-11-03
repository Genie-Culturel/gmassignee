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
      const [locRes, gameRes] = await Promise.all([
        supabase.from('locations').select('id, slug, name, short_name, kind, sort_index').order('sort_index'),
        supabase.from('games').select('id, location_id, slug, name, sort_index').order('sort_index'),
      ]);
      if (cancelled) return;
      if (locRes.error || gameRes.error || !locRes.data?.length) {
        setCatalog(EMPTY_CATALOG);
      } else {
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
