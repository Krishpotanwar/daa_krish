import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase URL or Anon Key is missing. Check your .env file.');
}

const DEFAULT_URL = 'http://localhost:54321';
const isValidUrl = (url: string) => url && (url.startsWith('http://') || url.startsWith('https://'));

export const supabase = createClient(
    isValidUrl(supabaseUrl) ? supabaseUrl : DEFAULT_URL,
    supabaseAnonKey || 'placeholder'
);
