import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/demo-data";

/**
 * Records one blog view. Called as a fire-and-forget beacon from
 * <BlogViewTracker/>. Writes to `blog_views` with the SERVICE ROLE only, so the
 * public can never inflate counts directly. A daily-salted visitor hash lets us
 * estimate unique readers without storing any PII, and a 30-minute dedup keeps
 * refreshes / rapid re-hits from padding the numbers ("real measurement").
 */
export async function POST(request: Request) {
  // Demo mode (no backend) — accept but don't persist.
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, demo: true });
  }

  let slug = "";
  let referrer = "";
  try {
    const payload = (await request.json()) as { slug?: unknown; referrer?: unknown };
    slug = String(payload.slug ?? "").trim();
    referrer = String(payload.referrer ?? "").trim().slice(0, 255);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });

  try {
    const admin = createAdminClient();

    // Only real, published posts get a view recorded.
    const { data: post } = await admin
      .from("blog_posts")
      .select("id")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    if (!post) return NextResponse.json({ ok: true, skipped: "not-found" });

    const postId = (post as { id: string }).id;

    // Privacy-preserving visitor fingerprint: ip + ua, salted by the day so the
    // same reader on the same day maps to one hash (good enough for uniques).
    const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "0.0.0.0";
    const ua = request.headers.get("user-agent") ?? "";
    const daySalt = new Date().toISOString().slice(0, 10);
    const visitorHash = createHash("sha256").update(`${ip}|${ua}|${daySalt}`).digest("hex").slice(0, 32);
    const country = request.headers.get("x-vercel-ip-country") ?? "";

    // Server-side dedup: same visitor + same post within 30 minutes → don't recount.
    const since = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data: recent } = await admin
      .from("blog_views")
      .select("id")
      .eq("post_id", postId)
      .eq("visitor_hash", visitorHash)
      .gte("viewed_at", since)
      .limit(1);
    if (recent && recent.length > 0) {
      return NextResponse.json({ ok: true, deduped: true });
    }

    const { error } = await admin.from("blog_views").insert({
      post_id: postId,
      slug,
      visitor_hash: visitorHash,
      referrer,
      country,
    });
    if (error) {
      // Most likely the analytics migration hasn't been run yet — don't 500,
      // just no-op so the public site keeps working.
      console.error("[blog-view] insert failed", error.message);
      return NextResponse.json({ ok: false, skipped: "not-migrated" });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[blog-view] error", e);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
