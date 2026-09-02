import { NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Hand the browser a one-shot signed upload URL so it can send a file DIRECTLY
 * to Supabase Storage. Videos routinely exceed Vercel's ~4.5 MB request-body
 * limit, which /api/admin-upload (the proxied path) can't carry — this route
 * only passes a short-lived token, so the bytes never touch Vercel.
 *
 * Body: { bucket, filename }
 * Returns: { path, token, publicUrl }
 */
export async function POST(request: Request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { bucket?: string; filename?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const bucket = String(body.bucket ?? "");
  const PUBLIC_BUCKETS = ["portfolio-images", "blog-images", "avatars", "shop-images"];
  // shop-files holds paid downloads, so it stays private: the upload token is
  // fine to hand out (this route is admin-gated), but there is no public URL to
  // return — the caller stores the object path and reads it back through a
  // short-lived signed URL.
  const PRIVATE_BUCKETS = ["shop-files"];
  if (![...PUBLIC_BUCKETS, ...PRIVATE_BUCKETS].includes(bucket)) {
    return NextResponse.json({ error: "Invalid bucket" }, { status: 400 });
  }

  const safe = String(body.filename ?? "file").replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${crypto.randomUUID()}-${safe}`;

  const admin = createAdminClient();
  const { data, error } = await admin.storage.from(bucket).createSignedUploadUrl(path);
  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Could not create upload URL" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    path: data.path,
    token: data.token,
    publicUrl: PUBLIC_BUCKETS.includes(bucket)
      ? admin.storage.from(bucket).getPublicUrl(path).data.publicUrl
      : null,
  });
}
