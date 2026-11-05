import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { useAuth } from './useAuth';
import {
  DEFAULT_GM_OPTIONS,
  GmOptionKey,
  GmOptions,
  fetchGmOptions,
  updateGmOption,
} from '@/lib/gmOptions';

interface GmOptionsContextValue {
  options: GmOptions;
  loading: boolean;
  showSuiviParties: boolean;
  showFormations: boolean;
  canConfigure: boolean;
  setOption: (key: GmOptionKey, value: boolean) => Promise<void>;
  reload: () => Promise<void>;
}

const GmOptionsContext = createContext<GmOptionsContextValue | null>(null);

export function GmOptionsProvider({ children }: { children: ReactNode }) {
  const { user, isAdmin, isFormateur, loading: authLoading } = useAuth();
  const [options, setOptions] = useState<GmOptions>(DEFAULT_GM_OPTIONS);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const next = await fetchGmOptions();
    setOptions(next);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    setLoading(true);
    fetchGmOptions()
      .then((next) => {
        if (!cancelled) setOptions(next);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [authLoading, user?.id, reload]);

  const canConfigure = isAdmin || isFormateur;
  const showSuiviParties = canConfigure || options.showSuiviParties;
  const showFormations = canConfigure || options.showFormations;

  const setOption = useCallback(async (key: GmOptionKey, value: boolean) => {
    setOptions((current) => ({ ...current, [key]: value }));
    try {
      const next = await updateGmOption(key, value);
      setOptions(next);
    } catch (err) {
      setOptions(await fetchGmOptions());
      throw err;
    }
  }, []);

  const value = useMemo<GmOptionsContextValue>(
    () => ({
      options,
      loading,
      showSuiviParties,
      showFormations,
      canConfigure,
      setOption,
      reload,
    }),
    [options, loading, showSuiviParties, showFormations, canConfigure, setOption, reload]
  );

  return <GmOptionsContext.Provider value={value}>{children}</GmOptionsContext.Provider>;
}

export function useGmOptions() {
  const ctx = useContext(GmOptionsContext);
  if (!ctx) throw new Error('useGmOptions must be used within GmOptionsProvider');
  return ctx;
}
