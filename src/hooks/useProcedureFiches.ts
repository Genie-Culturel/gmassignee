import { useCallback, useEffect, useState } from 'react';
import { supabase, isMockMode } from '@/lib/supabase';
import { ProcedureFiche } from '@/lib/database.types';
import { hydrateTrainingFiche, loadDemoFiches } from '@/lib/trainingRepository';
import { isFicheDeleted, sortFichesByOrder } from '@/lib/training';
import { useGMCompetences } from './useGMCompetences';
import { useAuth } from './useAuth';
import { useVenueCatalog } from './useVenueCatalog';
import { filterFichesByCompetences } from '@/lib/competenceFilter';

export function useProcedureFiches(opts?: { includeInactive?: boolean }) {
  const { isFormateur } = useAuth();
  const { authorizedGameIds, isLoading: competencesLoading } = useGMCompetences();
  const { catalog, isLoading: catalogLoading } = useVenueCatalog();
  const [fiches, setFiches] = useState<ProcedureFiche[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [tick, setTick] = useState(0);
  const includeInactive = Boolean(opts?.includeInactive);

  const reload = useCallback(() => setTick((value) => value + 1), []);

  useEffect(() => {
    async function fetchFiches() {
      // Wait for competences + catalogue (slugs lieux/jeux) before filtering
      if (competencesLoading || catalogLoading) {
        return;
      }

      if (isMockMode) {
        const rows = sortFichesByOrder(
          loadDemoFiches()
            .map(hydrateTrainingFiche)
            .filter((fiche) => !isFicheDeleted(fiche))
        );
        setFiches(includeInactive ? rows : rows.filter((fiche) => fiche.is_active));
        setIsLoading(false);
        return;
      }

      try {
        console.log('[useProcedureFiches] Fetching fiches from gh_procedure_fiches...');
        console.log('[useProcedureFiches] Authorized game IDs:', authorizedGameIds);
        
        let query = supabase!
          .from('gh_procedure_fiches')
          .select('*, gh_fiche_scope_locations(location_id), gh_fiche_scope_games(game_id)')
          .is('deleted_at', null)
          .order('sort_order', { ascending: true })
          .order('title', { ascending: true });
        if (!includeInactive) query = query.eq('is_active', true);
        const { data, error: fetchError } = await query;

        if (fetchError) {
          console.error('[useProcedureFiches] Query error:', fetchError);
          throw fetchError;
        }
        console.log('[useProcedureFiches] Loaded', data?.length || 0, 'fiches before filtering');
        
        const allFiches = (data || []).map((row) => {
          const record = row as ProcedureFiche & {
            gh_fiche_scope_locations?: { location_id: string }[];
            gh_fiche_scope_games?: { game_id: string }[];
          };
          return hydrateTrainingFiche({
            ...record,
            scope_kind: record.scope_kind || 'all',
            scope_location_ids: (record.gh_fiche_scope_locations || []).map((item) => item.location_id),
            scope_game_ids: (record.gh_fiche_scope_games || []).map((item) => item.game_id),
          });
        });

        // null = formateur/admin (pas de filtre). [] = 0 compétence → 0 fiche.
        const idsForFilter = isFormateur ? null : authorizedGameIds;
        const filtered = filterFichesByCompetences(allFiches, idsForFilter, catalog);
        console.log('[useProcedureFiches] Filtered to', filtered.length, 'fiches based on competences');

        setFiches(sortFichesByOrder(filtered));
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchFiches();
  }, [tick, includeInactive, authorizedGameIds, competencesLoading, catalogLoading, catalog, isFormateur]);

  return { fiches, isLoading, error, reload, authorizedGameIds: isFormateur ? null : authorizedGameIds };
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
