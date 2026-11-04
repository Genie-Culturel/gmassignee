import { useCallback, useEffect, useMemo, useState } from 'react';
import { ProcedureFiche } from '@/lib/database.types';
import { StepFicheLinks, listStepFicheLinks } from '@/lib/parcoursRepository';
import { isMockMode, supabase } from '@/lib/supabase';
import { loadDemoFiches } from '@/lib/trainingRepository';
import { isFicheDeleted } from '@/lib/training';

/** Fiches linked to each step of one parcours (« Voir la procédure »). */
export function useStepFiches(parcoursId: string | undefined) {
  const [links, setLinks] = useState<StepFicheLinks>({});
  const [fichesById, setFichesById] = useState<Map<string, ProcedureFiche>>(new Map());
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((value) => value + 1), []);

  useEffect(() => {
    if (!parcoursId) return;
    let cancelled = false;
    (async () => {
      try {
        const nextLinks = await listStepFicheLinks(parcoursId);
        const ids = Array.from(new Set(Object.values(nextLinks).flat()));
        let fiches: ProcedureFiche[] = [];
        if (isMockMode || !supabase) {
          fiches = loadDemoFiches().filter((fiche) => ids.includes(fiche.id));
        } else if (ids.length) {
          const { data, error } = await supabase.from('procedure_fiches').select('*').in('id', ids);
          if (error) throw error;
          fiches = (data || []) as ProcedureFiche[];
        }
        if (cancelled) return;
        setLinks(nextLinks);
        setFichesById(
          new Map(
            fiches
              .filter((fiche) => fiche.is_active && !isFicheDeleted(fiche))
              .map((fiche) => [fiche.id, fiche])
          )
        );
      } catch (err) {
        console.error('Fiches des étapes :', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [parcoursId, tick]);

  const byStep = useMemo(() => {
    const result: Record<string, ProcedureFiche[]> = {};
    for (const [step, ids] of Object.entries(links)) {
      result[step] = ids.map((id) => fichesById.get(id)).filter((fiche): fiche is ProcedureFiche => Boolean(fiche));
    }
    return result;
  }, [links, fichesById]);

  return { links, byStep, reload };
}
