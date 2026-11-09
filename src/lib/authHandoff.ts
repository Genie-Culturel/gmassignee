/** Query params used by Lovable to hand the current GM account to GitHub Pages. */

export const HANDOFF_FLAG = 'handoff';
export const HANDOFF_EMAIL = 'email';
export const HANDOFF_STORAGE_KEY = 'gmassignee_auth_handoff';

export interface AuthHandoff {
  active: boolean;
  email: string;
}

export type HandoffDecision = 'passthrough' | 'accept' | 'kick';

function paramsFromHash(hash: string): URLSearchParams {
  const q = hash.indexOf('?');
  if (q < 0) return new URLSearchParams();
  return new URLSearchParams(hash.slice(q + 1));
}

function isHandoffFlagOn(value: string | null): boolean {
  if (!value) return false;
  const v = value.trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

export function emailsMatch(a?: string | null, b?: string | null): boolean {
  return (a || '').trim().toLowerCase() === (b || '').trim().toLowerCase();
}

function mergeHandoffParams(a: URLSearchParams, b: URLSearchParams): AuthHandoff {
  const active = isHandoffFlagOn(a.get(HANDOFF_FLAG)) || isHandoffFlagOn(b.get(HANDOFF_FLAG));
  const email = (a.get(HANDOFF_EMAIL) || b.get(HANDOFF_EMAIL) || '').trim();
  return { active, email };
}

/**
 * Read `handoff=1` + optional `email` from the document search and/or the
 * HashRouter query (`#/formation?handoff=1&email=`).
 */
export function parseAuthHandoff(href?: string): AuthHandoff {
  const raw =
    href ??
    (typeof window !== 'undefined' ? window.location.href : '');
  if (!raw) return { active: false, email: '' };

  let url: URL;
  try {
    url = new URL(raw, 'https://genie-culturel.github.io');
  } catch {
    return { active: false, email: '' };
  }

  return mergeHandoffParams(paramsFromHash(url.hash), url.searchParams);
}

/** Keep the Pages session only when it already is the Lovable account. */
export function shouldKeepHandoffSession(
  sessionEmail: string | null | undefined,
  hintEmail: string
): boolean {
  return Boolean(sessionEmail && hintEmail && emailsMatch(sessionEmail, hintEmail));
}

/**
 * Decide what to do with a restored / incoming Supabase session during a Lovable handoff.
 *
 * Supabase auth-js emits `SIGNED_IN` on session *recovery* (localStorage) as well as
 * after a password login. Treating restore as "the GM typed a password" used to keep
 * the wrong Pages account (e.g. julien.quinodoz@gmail.com) and strip `handoff`.
 *
 * - no handoff → passthrough (direct visit keeps whoever is logged in)
 * - same e-mail as the hint → accept
 * - after the login form calls signIn(), a later SIGNED_IN is a real login → accept
 *   (do not use "we already kicked" as the signal: restore SIGNED_IN can still be queued)
 * - anything else (restore of another account, missing session) → kick
 */
export function decideHandoffSession(args: {
  pending: boolean;
  passwordLoginRequested: boolean;
  event: string | null;
  sessionEmail?: string | null;
  hintEmail: string;
}): HandoffDecision {
  if (!args.pending) return 'passthrough';

  if (args.passwordLoginRequested && args.event === 'SIGNED_IN' && args.sessionEmail) {
    return 'accept';
  }

  if (shouldKeepHandoffSession(args.sessionEmail, args.hintEmail)) {
    return 'accept';
  }

  return 'kick';
}

function getSessionStorage(): Storage | null {
  try {
    if (typeof sessionStorage === 'undefined') return null;
    return sessionStorage;
  } catch {
    return null;
  }
}

export function persistHandoff(handoff: AuthHandoff, storage?: Storage | null): void {
  const store = storage === undefined ? getSessionStorage() : storage;
  if (!store || !handoff.active) return;
  try {
    store.setItem(HANDOFF_STORAGE_KEY, JSON.stringify({ email: handoff.email }));
  } catch {
    /* private mode / quota */
  }
}

export function readStoredHandoff(storage?: Storage | null): AuthHandoff {
  const store = storage === undefined ? getSessionStorage() : storage;
  if (!store) return { active: false, email: '' };
  try {
    const raw = store.getItem(HANDOFF_STORAGE_KEY);
    if (!raw) return { active: false, email: '' };
    const parsed = JSON.parse(raw) as { email?: unknown };
    const email = typeof parsed.email === 'string' ? parsed.email.trim() : '';
    return { active: true, email };
  } catch {
    return { active: false, email: '' };
  }
}

export function clearStoredHandoff(storage?: Storage | null): void {
  const store = storage === undefined ? getSessionStorage() : storage;
  if (!store) return;
  try {
    store.removeItem(HANDOFF_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

let captured: AuthHandoff | null = null;

/**
 * Snapshot handoff params as soon as the module loads — before HashRouter /
 * replaceState can drop them — and remember them in sessionStorage until
 * the matching account is accepted.
 */
export function captureAuthHandoff(href?: string, storage?: Storage | null): AuthHandoff {
  const fromUrl = parseAuthHandoff(href);
  if (fromUrl.active) {
    persistHandoff(fromUrl, storage);
    captured = fromUrl;
    return fromUrl;
  }
  if (captured?.active) return captured;
  const stored = readStoredHandoff(storage);
  if (stored.active) {
    captured = stored;
    return stored;
  }
  return { active: false, email: '' };
}

export function peekCapturedHandoff(): AuthHandoff {
  return captured ?? { active: false, email: '' };
}

export function resolveCapturedHandoff(storage?: Storage | null): void {
  captured = { active: false, email: '' };
  clearStoredHandoff(storage);
}

/** Test helper: forget in-memory capture between cases. */
export function resetCapturedHandoffForTests(): void {
  captured = null;
}

/**
 * Drop `handoff` / `email` from search and hash, keep the route and other params.
 * Returns origin-relative path + search + hash.
 */
export function stripAuthHandoffHref(href: string): string {
  const url = new URL(href, 'https://genie-culturel.github.io');
  url.searchParams.delete(HANDOFF_FLAG);
  url.searchParams.delete(HANDOFF_EMAIL);

  const hash = url.hash;
  const q = hash.indexOf('?');
  if (q >= 0) {
    const path = hash.slice(0, q);
    const params = new URLSearchParams(hash.slice(q + 1));
    params.delete(HANDOFF_FLAG);
    params.delete(HANDOFF_EMAIL);
    const rest = params.toString();
    url.hash = rest ? `${path}?${rest}` : path;
  }

  return `${url.pathname}${url.search}${url.hash}`;
}

export function stripAuthHandoffFromWindow(): void {
  if (typeof window === 'undefined') return;
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const next = stripAuthHandoffHref(window.location.href);
  if (next === current) return;
  window.history.replaceState(null, '', next);
  // HashRouter listens to hashchange, not replaceState.
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

if (typeof window !== 'undefined') {
  captureAuthHandoff();
}
