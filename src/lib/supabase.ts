import { createClient } from '@supabase/supabase-js';
import {
  DEFAULT_SUPABASE_ANON_KEY,
  DEFAULT_SUPABASE_URL,
  readDemoFlag,
} from './config';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/** Snapshot at module load. Toggle demo via localStorage/`?demo=1` then reload. */
export const isMockMode = readDemoFlag() || !isSupabaseConfigured;

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

// Log mode clearly at startup
console.log('[Supabase]', isMockMode ? '⚠️ MODE DÉMO' : '✅ MODE PRODUCTION');
console.log('[Supabase] URL:', supabaseUrl);
console.log('[Supabase] Configured:', isSupabaseConfigured);
console.log('[Supabase] Demo flag:', readDemoFlag());

if (isMockMode) {
  console.warn(
    '⚠️ Mode démo — données locales. Enlève ?demo=1 / le toggle, ou configure VITE_SUPABASE_* pour la vraie base.'
  );
}
