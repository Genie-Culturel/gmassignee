import { useCallback, useEffect, useState } from 'react';
import { supabase, isMockMode } from '@/lib/supabase';
import { ProcedureFiche, SessionStep } from '@/lib/database.types';
import { mockStepFichesMapping } from '@/lib/mockData';
import { hydrateTrainingFiche, loadDemoFiches } from '@/lib/trainingRepository';
import { isFicheDeleted } from '@/lib/training';

export function useProcedureFiches(opts?: { includeInactive?: boolean }) {
  const [fiches, setFiches] = useState<ProcedureFiche[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [tick, setTick] = useState(0);
  const includeInactive = Boolean(opts?.includeInactive);

  const reload = useCallback(() => setTick((value) => value + 1), []);

  useEffect(() => {
    async function fetchFiches() {
      if (isMockMode) {
        const rows = loadDemoFiches()
          .map(hydrateTrainingFiche)
          .filter((fiche) => !isFicheDeleted(fiche));
        setFiches(includeInactive ? rows : rows.filter((fiche) => fiche.is_active));
        setIsLoading(false);
        return;
      }

      try {
        let query = supabase!
          .from('procedure_fiches')
          .select('*, fiche_scope_locations(location_id), fiche_scope_games(game_id)')
          .is('deleted_at', null)
          .order('category', { ascending: true })
          .order('title', { ascending: true });
        if (!includeInactive) query = query.eq('is_active', true);
        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;
        setFiches(
          (data || []).map((row) => {
            const record = row as ProcedureFiche & {
              fiche_scope_locations?: { location_id: string }[];
              fiche_scope_games?: { game_id: string }[];
            };
            return hydrateTrainingFiche({
              ...record,
              scope_kind: record.scope_kind || 'all',
              scope_location_ids: (record.fiche_scope_locations || []).map((item) => item.location_id),
              scope_game_ids: (record.fiche_scope_games || []).map((item) => item.game_id),
            });
          })
        );
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchFiches();
  }, [tick, includeInactive]);

  return { fiches, isLoading, error, reload };
}

export function useFichesByStep(step: SessionStep) {
  const [fiches, setFiches] = useState<ProcedureFiche[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStepFiches() {
      if (isMockMode) {
        // Mock mode: use mapping
        setTimeout(() => {
          const ficheIds = mockStepFichesMapping[step] || [];
          const matchedFiches = loadDemoFiches().filter(
            (f) => ficheIds.includes(f.id) && !isFicheDeleted(f) && f.is_active
          );
          setFiches(matchedFiches);
          setIsLoading(false);
        }, 200);
        return;
      }

      try {
        const { data, error } = await supabase!
          .from('session_step_fiches')
          .select('fiche_id, procedure_fiches(*)')
          .eq('step', step);

        if (error) throw error;
        
        const ficheData = data
          ?.map((item: any) => item.procedure_fiches)
          .filter((fiche: ProcedureFiche | null) => fiche && !isFicheDeleted(fiche)) || [];
        
        setFiches(ficheData);
      } catch (err) {
        console.error('Error fetching step fiches:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStepFiches();
  }, [step]);

  return { fiches, isLoading };
}

export function useFichesByIncidentType(incidentType: string) {
  const { fiches } = useProcedureFiches();
  
  // Map incident types to fiche titles
  const relevantTitles: Record<string, string[]> = {
    bug: ['🚧 Dépannage : Bug ou freeze en jeu'],
    malaise: ['Dépannage : Malaise client'],
    casse: ['🚧 Dépannage : Manette ou casque cassé'],
  };

  const titles = relevantTitles[incidentType] || [];
  return fiches.filter(f => titles.includes(f.title));
}
