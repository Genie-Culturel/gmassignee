import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { isMockMode, supabase } from '@/lib/supabase';
import {
  parseAuthHandoff,
  shouldKeepHandoffSession,
  stripAuthHandoffFromWindow,
} from '@/lib/authHandoff';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isFormateur: boolean;
  displayName: string;
  handoffEmail: string;
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

async function checkIsFormateur(user: User | null): Promise<boolean> {
  if (!user || !supabase) return false;
  try {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'formateur_suivi'])
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
  const [isFormateur, setIsFormateur] = useState(false);
  const [handoffEmail] = useState(() => parseAuthHandoff().email);

  useEffect(() => {
    if (isMockMode || !supabase) {
      setLoading(false);
      setIsAdmin(true);
      setIsFormateur(true);
      return;
    }

    let cancelled = false;
    const client = supabase;
    const initialHandoff = parseAuthHandoff();
    let pendingHandoff = initialHandoff.active;

    const applyRoles = (sessionUser: User | null) => {
      if (sessionUser) {
        checkIsAdmin(sessionUser).then((admin) => {
          if (!cancelled) setIsAdmin(admin);
        });
        checkIsFormateur(sessionUser).then((formateur) => {
          if (!cancelled) setIsFormateur(formateur);
        });
      } else {
        setIsAdmin(false);
        setIsFormateur(false);
      }
    };

    const acceptSession = (sessionUser: User | null) => {
      if (cancelled) return;
      setUser(sessionUser);
      applyRoles(sessionUser);
    };

    const finishHandoff = (sessionUser: User | null) => {
      pendingHandoff = false;
      stripAuthHandoffFromWindow();
      acceptSession(sessionUser);
    };

    /**
     * Lovable and Pages share Supabase but not origin/localStorage.
     * `handoff=1` means: do not silently keep whoever last logged in on Pages.
     * Same e-mail as the hint → keep. Other/missing session → local sign-out + login.
     * Explicit SIGNED_IN (the GM typed a password) always wins, then params are stripped.
     */
    const resolveHandoff = async (
      sessionUser: User | null,
      event: string | null
    ): Promise<void> => {
      if (!pendingHandoff) {
        acceptSession(sessionUser);
        return;
      }

      if (event === 'SIGNED_IN' && sessionUser) {
        finishHandoff(sessionUser);
        return;
      }

      if (shouldKeepHandoffSession(sessionUser?.email, initialHandoff.email)) {
        finishHandoff(sessionUser);
        return;
      }

      if (sessionUser) {
        try {
          await client.auth.signOut({ scope: 'local' });
        } catch {
          // Never keep account B even if local sign-out errors.
        }
      }
      if (!cancelled) acceptSession(null);
    };

    let sawAuthChange = false;
    let queue: Promise<void> = Promise.resolve();
    const enqueue = (sessionUser: User | null, event: string | null) => {
      queue = queue.then(
        () => resolveHandoff(sessionUser, event),
        () => resolveHandoff(sessionUser, event)
      );
      return queue;
    };

    client.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      // onAuthStateChange already applied the restored session (avoids a stale getSession).
      if (sawAuthChange) {
        setLoading(false);
        return;
      }
      void enqueue(data.session?.user ?? null, 'INITIAL_SESSION').finally(() => {
        if (!cancelled) setLoading(false);
      });
    });

    const { data: sub } = client.auth.onAuthStateChange((event, session) => {
      sawAuthChange = true;
      void enqueue(session?.user ?? null, event).then(() => {
        if (!cancelled) setLoading(false);
      });
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
      // En mode démo, isAdmin et isFormateur sont forcés à true.
      // Les données sont locales (localStorage) et ne touchent pas la vraie base.
      isAdmin,
      isFormateur,
      displayName: isMockMode ? 'GM Demo' : readDisplayName(user),
      handoffEmail,
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
    [user, loading, isAdmin, isFormateur, handoffEmail]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
