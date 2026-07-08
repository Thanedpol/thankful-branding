import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { revalidatePath } from "next/cache";
import { isAdminAuthed } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/demo-data";
import {
  isTranslationConfigured,
  translateFields,
  type TranslatableFields,
} from "@/lib/translate";

// Translation of a long post into two languages can take a while.
export const maxDuration = 60;

/**
 * Translate one blog post's title/excerpt/body into EN + Simplified Chinese and
 * store the result on the post. Admin-only. Triggered automatically after a
 * save (fire-and-forget) and available as a manual "re-translate" button.
 * Skips when the source content is unchanged (hash match) unless `force`.
 */
export async function POST(request: Request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let id = "";
  let force = false;
  try {
    const body = (await request.json()) as { id?: unknown; force?: unknown };
    id = String(body.id ?? "").trim();
    force = body.force === true;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  if (!isSupabaseConfigured() || !isTranslationConfigured()) {
    return NextResponse.json({ ok: false, skipped: "not-configured" });
  }

  try {
    const admin = createAdminClient();
    const { data: post, error: readErr } = await admin
      .from("blog_posts")
      .select("id, slug, title, excerpt, body, translations, translated_hash")
      .eq("id", id)
      .maybeSingle();

    if (readErr) {
      // translations/translated_hash columns missing → migration not applied.
      console.error("[translate-post] read failed", readErr.message);
      return NextResponse.json({ ok: false, skipped: "not-migrated" });
    }
    if (!post) return NextResponse.json({ ok: true, skipped: "not-found" });

    const src: TranslatableFields = {
      title: (post as { title?: string }).title ?? "",
      excerpt: (post as { excerpt?: string }).excerpt ?? "",
      body: (post as { body?: string }).body ?? "",
    };
    const hash = createHash("sha256").update(JSON.stringify(src)).digest("hex");

    const existing = (post as { translations?: Record<string, unknown> }).translations ?? {};
    const alreadyDone =
      (post as { translated_hash?: string }).translated_hash === hash &&
      Object.keys(existing).length > 0;
    if (!force && alreadyDone) {
      return NextResponse.json({ ok: true, cached: true });
    }

    const [en, zh] = await Promise.all([
      translateFields(src, "en"),
      translateFields(src, "zh"),
    ]);

    const { error: writeErr } = await admin
      .from("blog_posts")
      .update({ translations: { en, zh }, translated_hash: hash })
      .eq("id", id);
    if (writeErr) {
      console.error("[translate-post] write failed", writeErr.message);
      return NextResponse.json({ ok: false, skipped: "not-migrated" });
    }

    // Refresh the public pages so the new translations are served.
    revalidatePath("/");
    revalidatePath("/blog");
    revalidatePath(`/blog/${(post as { slug?: string }).slug ?? ""}`);

    return NextResponse.json({ ok: true, translated: true });
  } catch (e) {
    console.error("[translate-post] error", e);
    return NextResponse.json({ ok: false, error: "translate-failed" }, { status: 200 });
  }
}
