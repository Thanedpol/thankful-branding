import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client — SERVER ONLY. Bypasses RLS.
 * Used by API routes for: inserting contact messages, looking up the admin
 * email for notifications, and issuing signed press-asset download URLs.
 * Never import this from a Client Component.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
