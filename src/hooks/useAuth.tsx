import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { isMockMode, supabase } from '@/lib/supabase';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  displayName: string;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string, displayName: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function checkIsAdmin(user: User | null): Promise<boolean> {
  if (!user || !supabase) return false;
  try {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();
    return Boolean(data);
  } catch {
    return false;
  }
}

function readDisplayName(user: User | null): string {
  if (!user) return 'GM Demo';
  const meta = user.user_metadata || {};
  return (
    (typeof meta.full_name === 'string' && meta.full_name) ||
    (typeof meta.name === 'string' && meta.name) ||
    user.email ||
    'GM'
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(!isMockMode);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (isMockMode || !supabase) {
      setLoading(false);
      setIsAdmin(true);
      return;
    }

    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) {
        const sessionUser = data.session?.user ?? null;
        setUser(sessionUser);
        if (sessionUser) {
          checkIsAdmin(sessionUser).then((admin) => {
            if (!cancelled) setIsAdmin(admin);
          });
        }
        setLoading(false);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);
      if (sessionUser) {
        checkIsAdmin(sessionUser).then(setIsAdmin);
      } else {
        setIsAdmin(false);
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      // En mode démo, isAdmin est forcé à true (ligne 51).
      // Les données sont locales (localStorage) et ne touchent pas la vraie base.
      isAdmin,
      displayName: isMockMode ? 'GM Demo' : readDisplayName(user),
      signIn: async (email, password) => {
        if (!supabase) return 'Supabase non configuré';
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return error ? error.message : null;
      },
      signUp: async (email, password, displayName) => {
        if (!supabase) return 'Supabase non configuré';
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: displayName } },
        });
        if (error) return error.message;
        if (data.user && !data.session) {
          return 'Compte créé. Confirme ton e-mail (si demandé), puis reconnecte-toi.';
        }
        return null;
      },
      signOut: async () => {
        await supabase?.auth.signOut();
      },
    }),
    [user, loading, isAdmin]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
