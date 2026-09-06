import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_KEY as string | undefined;

export const supabase = url && key ? createClient(url, key) : null;

export function requireSupabase() {
  if (!supabase) {
    throw new Error("Supabase authentication is not configured.");
  }
  return supabase;
}
