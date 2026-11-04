/** Default Lovable project (shared with GMassignee planning). Overridable via VITE_SUPABASE_* env vars. */
export const DEFAULT_SUPABASE_URL = 'https://dnxyidnkmtrmkxucqrry.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRueHlpZG5rbXRybWt4dWNxcnJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NTM4NTUsImV4cCI6MjA2NjMyOTg1NX0.CQNSkJFpA1y_p2tpwzvavV0Ee4Cn1WrBcEx1IhIOdJo';

/** Public base URL of the deployed app (GitHub Pages). Used for client souvenirs links. */
export const PUBLIC_APP_URL = (
  import.meta.env.VITE_PUBLIC_APP_URL || 'https://genie-culturel.github.io/gmassignee'
).replace(/\/+$/, '');

/** Public page where the client downloads the session videos (no PIN, no login). */
export function souvenirsPageUrl(token: string): string {
  return `${PUBLIC_APP_URL}/souvenirs/?token=${encodeURIComponent(token)}`;
}

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

/** Storage bucket name for session media (videos, photos). */
export const STORAGE_BUCKET_SESSION_MEDIA = 'session-media';

/** Edge function names (deployed in Lovable project with gh- prefix). */
export const EDGE_FUNCTION_SEND_SESSION_VIDEOS = 'gh-send-session-videos';
export const EDGE_FUNCTION_SESSION_MEDIA_DOWNLOAD = 'gh-session-media-download';
export const EDGE_FUNCTION_CLEANUP_SESSION_MEDIA = 'gh-cleanup-session-media';
