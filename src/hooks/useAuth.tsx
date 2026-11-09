import { createContext, useContext, useEffect, useMemo, useRef, useState, ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { isMockMode, supabase } from '@/lib/supabase';
import {
  captureAuthHandoff,
  decideHandoffSession,
  resolveCapturedHandoff,
  stripAuthHandoffFromWindow,
} from '@/lib/authHandoff';
import { staffFlagsFromRoles } from '@/lib/roles';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isFormateur: boolean;
  displayName: string;
  handoffEmail: string;
  handoffActive: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string, displayName: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  switchAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchRoleFlags(user: User | null): Promise<{ isAdmin: boolean; isFormateur: boolean }> {
  if (!user || !supabase) return { isAdmin: false, isFormateur: false };

  const { data, error } = await supabase.from('user_roles').select('role').eq('user_id', user.id);
  if (!error) {
    return staffFlagsFromRoles((data || []).map((row) => row.role));
  }

  console.warn('[Auth] user_roles query failed, falling back to has_formateur_role:', error.message);
  const { data: isStaff, error: rpcError } = await supabase.rpc('has_formateur_role');
  if (rpcError) {
    console.warn('[Auth] has_formateur_role RPC failed:', rpcError.message);
    return { isAdmin: false, isFormateur: false };
  }
  // RPC does not distinguish admin vs formateur_suivi; both get Éditeur.
  return { isAdmin: isStaff === true, isFormateur: isStaff === true };
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
  const [isAdmin, setIsAdmin] = useState(isMockMode);
  const [isFormateur, setIsFormateur] = useState(isMockMode);
  const [handoff] = useState(() => captureAuthHandoff());
  const passwordLoginRef = useRef(false);

  useEffect(() => {
    if (isMockMode || !supabase) {
      setLoading(false);
      setIsAdmin(true);
      setIsFormateur(true);
      return;
    }

    let cancelled = false;
    const client = supabase;
    const initialHandoff = captureAuthHandoff();
    let pendingHandoff = initialHandoff.active;

    const applyRoles = async (sessionUser: User | null) => {
      if (!sessionUser) {
        if (!cancelled) {
          setIsAdmin(false);
          setIsFormateur(false);
        }
        return;
      }
      const flags = await fetchRoleFlags(sessionUser);
      if (!cancelled) {
        setIsAdmin(flags.isAdmin);
        setIsFormateur(flags.isFormateur);
      }
    };

    const acceptSession = async (sessionUser: User | null) => {
      if (cancelled) return;
      setUser(sessionUser);
      await applyRoles(sessionUser);
    };

    const finishHandoff = async (sessionUser: User | null) => {
      pendingHandoff = false;
      passwordLoginRef.current = false;
      resolveCapturedHandoff();
      stripAuthHandoffFromWindow();
      await acceptSession(sessionUser);
    };

    /**
     * Lovable and Pages share Supabase but not origin/localStorage.
     * `handoff=1` means: do not silently keep whoever last logged in on Pages.
     * Same e-mail as the hint → keep. Other/missing session → local sign-out + login.
     * `SIGNED_IN` from localStorage recovery is NOT a password login (auth-js emits it
     * on restore / tab focus). Only SIGNED_IN after the login form called signIn() counts.
     */
    const resolveHandoff = async (
      sessionUser: User | null,
      event: string | null
    ): Promise<void> => {
      const decision = decideHandoffSession({
        pending: pendingHandoff,
        passwordLoginRequested: passwordLoginRef.current,
        event,
        sessionEmail: sessionUser?.email,
        hintEmail: initialHandoff.email,
      });

      if (decision === 'passthrough') {
        await acceptSession(sessionUser);
        return;
      }

      if (decision === 'accept') {
        await finishHandoff(sessionUser);
        return;
      }

      if (sessionUser) {
        try {
          await client.auth.signOut({ scope: 'local' });
        } catch {
          // Never keep account B even if local sign-out errors.
        }
      }
      if (!cancelled) await acceptSession(null);
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
      handoffEmail: handoff.email,
      handoffActive: handoff.active,
      signIn: async (email, password) => {
        if (!supabase) return 'Supabase non configuré';
        passwordLoginRef.current = true;
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) passwordLoginRef.current = false;
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
        await supabase?.auth.signOut({ scope: 'local' });
      },
      switchAccount: async () => {
        await supabase?.auth.signOut({ scope: 'local' });
      },
    }),
    [user, loading, isAdmin, isFormateur, handoff]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
