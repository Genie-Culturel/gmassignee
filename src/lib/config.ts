/** Default gm-vrcenter project. Overridable via VITE_SUPABASE_* env vars. */
export const DEFAULT_SUPABASE_URL = 'https://vxeprhyswkqugyewpwfm.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY =
  'sb_publishable_COByzOZPOYT1_9zELSfo4w_EpEhOc5u';

export const DEMO_STORAGE_KEY = 'gmassignee_demo';
export const ACTIVE_SESSION_STORAGE_KEY = 'gmassignee_active_session_id';

export function readDemoFlag(): boolean {
  if (import.meta.env.VITE_FORCE_DEMO === 'true') return true;
  if (typeof window === 'undefined') return false;
  try {
    if (window.localStorage.getItem(DEMO_STORAGE_KEY) === '1') return true;
  } catch {
    /* ignore */
  }
  const search = new URLSearchParams(window.location.search);
  if (search.get('demo') === '1') return true;
  const hash = window.location.hash;
  const qIndex = hash.indexOf('?');
  if (qIndex >= 0) {
    const hashQuery = new URLSearchParams(hash.slice(qIndex));
    if (hashQuery.get('demo') === '1') return true;
  }
  return false;
}

export function setDemoFlag(enabled: boolean) {
  try {
    if (enabled) window.localStorage.setItem(DEMO_STORAGE_KEY, '1');
    else window.localStorage.removeItem(DEMO_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
