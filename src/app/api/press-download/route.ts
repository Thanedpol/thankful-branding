import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Issues a short-lived signed URL for a press asset — but ONLY for an
 * authenticated user (member or admin). This enforces the rule:
 * "Press Kit downloads require login."
 *
 * Query: /api/press-download?path=<object-path-in-press-assets-bucket>
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path");
  if (!path) {
    return NextResponse.json({ error: "Missing path" }, { status: 400 });
  }

  // Use the service role to sign — the session check above is the gate.
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from("press-assets")
    .createSignedUrl(path, 60); // valid 60s

  if (error || !data) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  return NextResponse.redirect(data.signedUrl);
}
