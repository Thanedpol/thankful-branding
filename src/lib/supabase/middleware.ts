import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/demo-data";

// Inlined (not imported from admin-auth) so middleware stays edge-safe —
// admin-auth imports next/headers, which isn't allowed in middleware.
const ADMIN_COOKIE = "admin_session";

/**
 * Two concerns:
 *   1. Admin gate — /admin/* requires the admin passcode cookie (set by
 *      /api/admin-login). Independent of Supabase. /admin/login is exempt.
 *   2. Member sessions — refresh the Supabase auth session (members only),
 *      when Supabase is configured.
 */
export async function updateSession(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // 1. Admin passcode gate.
  if (path.startsWith("/admin") && path !== "/admin/login") {
    const expected = process.env.ADMIN_PASSCODE;
    const cookie = request.cookies.get(ADMIN_COOKIE)?.value;
    if (!expected || cookie !== expected) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("redirect", path);
      return NextResponse.redirect(url);
    }
  }

  // 2. Member session refresh (skip entirely if Supabase isn't configured).
  let supabaseResponse = NextResponse.next({ request });
  if (!isSupabaseConfigured()) return supabaseResponse;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  await supabase.auth.getUser();
  return supabaseResponse;
}
