import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.example to .env.local and fill in your Supabase project values.'
  );
}

export const supabase = createClient(
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
