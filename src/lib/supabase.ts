import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabaseBaseUrl = import.meta.env.DEV && typeof window !== 'undefined'
  ? new URL('/supabase', window.location.origin).toString()
  : supabaseUrl;

export const supabase = createClient(supabaseBaseUrl, supabaseKey);
export const publicSupabase = createClient(supabaseUrl, supabaseKey);
