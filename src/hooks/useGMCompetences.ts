import { useCallback, useEffect, useState } from 'react';
import { isMockMode, supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

/**
 * Hook to load the authorized game IDs for the current GM based on RH Compétences.
 * Returns:
 * - `authorizedGameIds`: array of gh_games.id the GM is authorized for, or null if formateur/admin (no filter)
 * - `isLoading`: loading state
 * - `error`: error if any
 * - `reload`: function to reload the competences
 */
export function useGMCompetences() {
  const { user, isFormateur } = useAuth();
  const [authorizedGameIds, setAuthorizedGameIds] = useState<string[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
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
      console.log('[useGMCompetences] Loading authorized games for user', user.id);
      
      // Call the helper function to get authorized game IDs
      const { data, error: rpcError } = await supabase.rpc('gh_get_authorized_game_ids', {
        p_gm_id: user.id,
      });

      if (rpcError) {
        console.error('[useGMCompetences] RPC error:', rpcError);
        throw rpcError;
      }

      // data is uuid[] or null
      const gameIds = data as string[] | null;
      console.log('[useGMCompetences] Authorized game IDs:', gameIds);
      setAuthorizedGameIds(gameIds);
      setError(null);
    } catch (err) {
      console.error('[useGMCompetences] Error loading competences:', err);
      setError(err as Error);
      // On error, default to no filter (show all) to avoid breaking the app
      setAuthorizedGameIds(null);
    } finally {
      setIsLoading(false);
    }
  }, [user, isFormateur]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { authorizedGameIds, isLoading, error, reload };
}
