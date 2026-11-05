/** Query params used by Lovable to hand the current GM account to GitHub Pages. */

export const HANDOFF_FLAG = 'handoff';
export const HANDOFF_EMAIL = 'email';

export interface AuthHandoff {
  active: boolean;
  email: string;
}

function paramsFromHash(hash: string): URLSearchParams {
  const q = hash.indexOf('?');
  if (q < 0) return new URLSearchParams();
  return new URLSearchParams(hash.slice(q + 1));
}

export function emailsMatch(a?: string | null, b?: string | null): boolean {
  return (a || '').trim().toLowerCase() === (b || '').trim().toLowerCase();
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

  const fromSearch = url.searchParams;
  const fromHash = paramsFromHash(url.hash);
  const active = fromSearch.get(HANDOFF_FLAG) === '1' || fromHash.get(HANDOFF_FLAG) === '1';
  const email = (fromHash.get(HANDOFF_EMAIL) || fromSearch.get(HANDOFF_EMAIL) || '').trim();
  return { active, email };
}

/** Keep the Pages session only when it already is the Lovable account. */
export function shouldKeepHandoffSession(
  sessionEmail: string | null | undefined,
  hintEmail: string
): boolean {
  return Boolean(sessionEmail && hintEmail && emailsMatch(sessionEmail, hintEmail));
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
