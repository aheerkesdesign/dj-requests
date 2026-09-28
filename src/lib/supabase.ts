import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const missingEnv = !supabaseUrl || !supabaseAnonKey;

if (missingEnv) {
  const message =
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.example to .env.local and fill in your Supabase project values.';
  if (import.meta.env.PROD) {
    throw new Error(message);
  }
  console.warn(message);
}

export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);

export function getLogoPublicUrl(logoPath?: string | null): string | undefined {
  if (!logoPath) return undefined;
  if (logoPath.startsWith('http://') || logoPath.startsWith('https://') || logoPath.startsWith('data:')) {
    return logoPath;
  }
  const { data } = supabase.storage.from('logos').getPublicUrl(logoPath);
  return data.publicUrl;
}
