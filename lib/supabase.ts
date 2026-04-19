// =====================================================================
// Paise — Supabase client
// =====================================================================
// Two clients:
//   - `supabase`         : browser client, uses anon key + RLS
//   - `supabaseAdmin()`  : server-only, uses service role key, bypasses RLS
//                         (only call from app/api/* routes, never from client)
//
// The app currently uses lib/store.ts (localStorage). To migrate to
// Supabase, swap out the store methods one feature at a time — the
// schema in supabase/schema.sql matches the types in lib/types.ts 1:1.
// =====================================================================

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Only treat Supabase as configured when URL is a valid http(s) URL.
// (Placeholders like "sb_publishable_..." or empty strings fall back to
// localStorage so the app still builds + runs without real Supabase.)
function isValidUrl(s: string | undefined): boolean {
  if (!s) return false;
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export const isSupabaseConfigured =
  isValidUrl(SUPABASE_URL) && Boolean(SUPABASE_ANON_KEY);

// ---- Browser / client-component usage --------------------------------
// Safe to import anywhere. Returns null if env vars missing so the app
// can gracefully fall back to localStorage.
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null;

// ---- Server-only admin client ----------------------------------------
// Uses SUPABASE_SERVICE_ROLE_KEY which bypasses Row Level Security.
// NEVER import this from a client component. Only from app/api/* routes.
export function supabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Supabase admin client requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY"
    );
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
