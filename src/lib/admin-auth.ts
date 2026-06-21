import { cookies } from "next/headers";

export const ADMIN_COOKIE = "admin_session";

/**
 * Passcode-based admin gate (replaces Supabase email/password for admin).
 * The admin area is unlocked by a single shared passcode stored server-side
 * in ADMIN_PASSCODE. On success an httpOnly cookie holding that passcode is
 * set; this helper verifies it. Members still use Supabase auth separately.
 */
export async function isAdminAuthed() {
  const expected = process.env.ADMIN_PASSCODE;
  if (!expected) return false; // not configured → locked (safe default)
  const store = await cookies();
  return store.get(ADMIN_COOKIE)?.value === expected;
}
