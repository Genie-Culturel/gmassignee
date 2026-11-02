import { useEffect, useState } from 'react';
import { supabase, isMockMode } from '@/lib/supabase';
import { ProcedureFiche } from '@/lib/database.types';
import { mockFiches } from '@/lib/mockData';

export function useProcedureFiches() {
  const [fiches, setFiches] = useState<ProcedureFiche[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchFiches() {
      if (isMockMode) {
        // Mock mode: use local data
        setTimeout(() => {
          setFiches(mockFiches);
          setIsLoading(false);
        }, 300);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase!
          .from('procedure_fiches')
          .select('*')
          .eq('is_active', true)
          .order('category', { ascending: true })
          .order('title', { ascending: true });

        if (fetchError) throw fetchError;
        setFiches(data || []);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchFiches();
  }, []);

  return { fiches, isLoading, error };
}

export function useFichesByStep(step: string) {
  const [fiches, setFiches] = useState<ProcedureFiche[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStepFiches() {
      if (isMockMode) {
        // Mock mode: filter mock data
        setTimeout(() => {
          // For now, return empty in mock mode
          // In a real implementation, we'd store step-fiche links in mock data too
          setFiches([]);
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
          .filter(Boolean) || [];
        
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
