import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Singleton instance
export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);

// Factory function for hooks
export function createClient() {
  return supabase;
}
