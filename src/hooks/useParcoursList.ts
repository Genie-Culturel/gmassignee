import { useCallback, useEffect, useState } from 'react';
import { DEMO_PARCOURS, ParcoursDefinition } from '@/lib/parcours';
import { fetchParcoursList } from '@/lib/parcoursRepository';

export function useParcoursList() {
  const [parcoursList, setParcoursList] = useState<ParcoursDefinition[]>(DEMO_PARCOURS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((value) => value + 1), []);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    fetchParcoursList()
      .then((list) => {
        if (!cancelled) {
          setParcoursList(list);
          console.log('[useParcoursList] Loaded', list.length, 'parcours');
        }
      })
      .catch((err) => {
        console.error('[useParcoursList] Error:', err);
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tick]);

  return { parcoursList, isLoading, error, reload };
}
