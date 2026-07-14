import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cookie-free anonymous Supabase client for PUBLIC reads only.
 *
 * Unlike server.ts's `createClient()`, this never touches `cookies()`, so any
 * page that uses it stays statically renderable / ISR-cacheable — which lets
 * Next.js prefetch it and makes navigation feel instant. If a page reads
 * cookies (even just to create the SSR client) it is forced to render
 * dynamically on every request, which is the slow path we want to avoid here.
 *
 * RLS still applies as the `anon` role, so this can only ever see what an
 * anonymous visitor is allowed to see. NEVER use it for anything that depends
 * on the logged-in user (member gating, per-user data) — use server.ts there.
 */
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key",
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
