import { createBrowserClient, createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_KEY as string | undefined;

function readAllCookies(): Record<string, string> {
  if (typeof document === "undefined") return {};
  const map: Record<string, string> = {};
  document.cookie.split(";").forEach((part) => {
    const idx = part.indexOf("=");
    if (idx > 0) {
      map[part.slice(0, idx).trim()] = part.slice(idx + 1).trim();
    }
  });
  return map;
}

function writeAllCookies(items: { name: string; value: string; options: Record<string, unknown> }[]) {
  if (typeof document === "undefined") return;
  for (const { name, value, options } of items) {
    if (!value) {
      document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax; Secure`;
      continue;
    }
    const parts = [`${name}=${value}`, "path=/", "SameSite=Lax"];
    if ((options?.secure as boolean | undefined) !== false) parts.push("Secure");
    document.cookie = parts.join("; ");
  }
}

export function createSupabaseClient(): SupabaseClient {
  if (!url || !key) {
    throw new Error(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_KEY."
    );
  }

  if (typeof window === "undefined") {
    // Server-side (SSR) — use createServerClient with getAll/setAll.
    return createServerClient(url, key, {
      cookies: {
        getAll() {
          return Object.entries(readAllCookies()).map(
            ([name, value]) => ({ name, value, options: {} })
          );
        },
        setAll: writeAllCookies,
      },
    });
  }

  // Browser — use createBrowserClient.
  return createBrowserClient(url, key);
}

/** Exported for legacy code paths that expect a synchronous client. */
export const supabase: SupabaseClient | null =
  url && key ? createBrowserClient(url, key) : null;

export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error("Supabase authentication is not configured.");
  }
  return supabase;
}
