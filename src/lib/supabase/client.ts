/**
 * Supabase client placeholder for future auth + leaderboards.
 * Wire up when NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.
 */
export function createSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  // import { createClient } from "@supabase/supabase-js";
  // return createClient(url, anonKey);
  return null;
}
