import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// For local/mock mode when no Supabase credentials
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl, supabaseAnonKey)
  : null;

// Mock mode flag - when true, the app uses local state instead of Supabase
export const isMockMode = !isSupabaseConfigured;

if (isMockMode) {
  console.warn(
    '⚠️ Running in MOCK MODE - no Supabase connection. ' +
    'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to connect to a real database.'
  );
}
