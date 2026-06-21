import { NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Admin asset upload via the service-role key (bypasses Storage RLS, which
 * otherwise requires a Supabase admin session we no longer have under the
 * passcode model). Gated by the admin passcode cookie.
 *
 * Body: multipart/form-data { file, bucket }
 * Returns: { path, publicUrl } — publicUrl is null for private buckets.
 */
export async function POST(request: Request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("file");
  const bucket = String(form.get("bucket") ?? "");

  if (!(file instanceof File) || !bucket) {
    return NextResponse.json({ error: "Missing file or bucket" }, { status: 400 });
  }

  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${crypto.randomUUID()}-${safe}`;

  const admin = createAdminClient();
  const { error } = await admin.storage
    .from(bucket)
    .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Public buckets return a usable URL; private (press-assets) returns null.
  const isPublic = ["portfolio-images", "blog-images", "avatars"].includes(bucket);
  const publicUrl = isPublic
    ? admin.storage.from(bucket).getPublicUrl(path).data.publicUrl
    : null;

  return NextResponse.json({ path, publicUrl });
}
