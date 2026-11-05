import { useCallback, useEffect, useState } from 'react';
import { isMockMode, supabase } from '@/lib/supabase';
import { parseAuthorizedGameIds } from '@/lib/competenceFilter';
import { useAuth } from './useAuth';

/**
 * Hook to load the authorized gh_games IDs for the current GM based on LIVE Lovable RH compétences.
 * 
 * Flow: auth.uid() → profiles.gm_id → gm_game_competencies → games → gh_game_rh_map → gh_games.id[]
 * Le filtre Formations élargit ces IDs au circuit (lieu) du jeu + fiches générales.
 *
 * Returns:
 * - `authorizedGameIds`: gh_games.id[] mappés (le client élargit au circuit), `null` si formateur/admin, `[]` si 0 compétence
 * - `isLoading`: loading state
 * - `error`: error if any
 * - `reload`: function to reload the competences
 */
export function useGMCompetences() {
  const { user, isFormateur, loading: authLoading } = useAuth();
  // Fail closed tant que le RPC n'a pas répondu : un GM ne doit jamais voir le circuit VR par défaut.
  const [authorizedGameIds, setAuthorizedGameIds] = useState<string[] | null>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    if (authLoading) {
      setIsLoading(true);
      return;
    }

    if (isMockMode || !supabase || !user) {
      // In mock mode or not logged in, allow all games (no filter)
      setAuthorizedGameIds(null);
      setIsLoading(false);
      return;
    }

    // Formateurs and admins see everything
    if (isFormateur) {
      setAuthorizedGameIds(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      console.log('[useGMCompetences] Loading authorized games for auth user', user.id);
      
      // Call the helper function to get authorized game IDs
      // Pass auth.users.id (user.id); function resolves to profiles.gm_id internally
      const { data, error: rpcError } = await supabase.rpc('gh_get_authorized_game_ids', {
        p_user_id: user.id,
      });

      if (rpcError) {
        console.error('[useGMCompetences] RPC error:', rpcError);
        throw rpcError;
      }

      // GM : null / valeur inattendue → [] (0 fiche). Jamais null (= tout afficher).
      const gameIds = parseAuthorizedGameIds(data);
      console.log('[useGMCompetences] Authorized gh_games IDs:', gameIds);
      setAuthorizedGameIds(gameIds);
      setError(null);
    } catch (err) {
      console.error('[useGMCompetences] Error loading competences:', err);
      setError(err as Error);
      // Fail closed: un GM sans RPC ne doit pas voir le circuit VR Center par défaut
      setAuthorizedGameIds([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, isFormateur, authLoading]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { authorizedGameIds, isLoading, error, reload };
}
