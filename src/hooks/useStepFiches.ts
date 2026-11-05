import { useCallback, useEffect, useMemo, useState } from 'react';
import { ProcedureFiche } from '@/lib/database.types';
import { StepFicheLinks, listStepFicheLinks } from '@/lib/parcoursRepository';
import { isMockMode, supabase } from '@/lib/supabase';
import { loadDemoFiches } from '@/lib/trainingRepository';
import { isFicheDeleted } from '@/lib/training';
import { useGMCompetences } from './useGMCompetences';
import { useAuth } from './useAuth';

/** Fiches linked to each step of one parcours (« Voir la procédure »). */
export function useStepFiches(parcoursId: string | undefined) {
  const { isFormateur } = useAuth();
  const { authorizedGameIds, isLoading: competencesLoading } = useGMCompetences();
  const [links, setLinks] = useState<StepFicheLinks>({});
  const [fichesById, setFichesById] = useState<Map<string, ProcedureFiche>>(new Map());
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((value) => value + 1), []);

  useEffect(() => {
    if (!parcoursId || competencesLoading) return;
    let cancelled = false;
    (async () => {
      try {
        const nextLinks = await listStepFicheLinks(parcoursId);
        const ids = Array.from(new Set(Object.values(nextLinks).flat()));
        let fiches: ProcedureFiche[] = [];
        if (isMockMode || !supabase) {
          fiches = loadDemoFiches().filter((fiche) => ids.includes(fiche.id));
        } else if (ids.length) {
          console.log('[useStepFiches] Fetching', ids.length, 'fiches from gh_procedure_fiches');
          const { data, error } = await supabase
            .from('gh_procedure_fiches')
            .select('*, gh_fiche_scope_locations(location_id), gh_fiche_scope_games(game_id)')
            .in('id', ids);
          if (error) {
            console.error('[useStepFiches] Query error:', error);
            throw error;
          }
          fiches = (data || []).map((row) => {
            const record = row as ProcedureFiche & {
              gh_fiche_scope_locations?: { location_id: string }[];
              gh_fiche_scope_games?: { game_id: string }[];
            };
            return {
              ...record,
              scope_kind: record.scope_kind || 'all',
              scope_location_ids: (record.gh_fiche_scope_locations || []).map((item) => item.location_id),
              scope_game_ids: (record.gh_fiche_scope_games || []).map((item) => item.game_id),
            } as ProcedureFiche;
          });
          console.log('[useStepFiches] Loaded', fiches.length, 'fiches before filtering');
        }

        // Apply competence-based filtering (same logic as useProcedureFiches)
        let filtered = fiches.filter((fiche) => fiche.is_active && !isFicheDeleted(fiche));
        if (!isFormateur && authorizedGameIds !== null) {
          filtered = filtered.filter((fiche) => {
            if (fiche.scope_kind === 'all' || fiche.scope_kind === 'locations') {
              return true;
            }
            if (fiche.scope_kind === 'games' && fiche.scope_game_ids && fiche.scope_game_ids.length > 0) {
              return fiche.scope_game_ids.some((gameId) => authorizedGameIds.includes(gameId));
            }
            return false;
          });
          console.log('[useStepFiches] Filtered to', filtered.length, 'fiches based on competences');
        }

        if (cancelled) return;
        setLinks(nextLinks);
        setFichesById(new Map(filtered.map((fiche) => [fiche.id, fiche])));
      } catch (err) {
        console.error('Fiches des étapes :', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [parcoursId, tick, authorizedGameIds, competencesLoading, isFormateur]);

  const byStep = useMemo(() => {
    const result: Record<string, ProcedureFiche[]> = {};
    for (const [step, ids] of Object.entries(links)) {
      result[step] = ids.map((id) => fichesById.get(id)).filter((fiche): fiche is ProcedureFiche => Boolean(fiche))
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.title.localeCompare(b.title));
    }
    return result;
  }, [links, fichesById]);

  return { links, byStep, reload };
}
