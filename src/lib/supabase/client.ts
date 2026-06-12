"use client";

import { createBrowserClient } from "@supabase/ssr";

// Harmless fallbacks so client construction never throws when env vars are
// missing (e.g. a Vercel build before env is configured). Real auth/data only
// works once NEXT_PUBLIC_SUPABASE_URL / ANON_KEY are set; until then the app
// runs in demo mode (see lib/demo-data.ts).
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

/** Supabase client for use in Client Components (browser). */
export function createClient() {
  return createBrowserClient(URL, ANON);
}
