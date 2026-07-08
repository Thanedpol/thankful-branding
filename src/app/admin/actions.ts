"use server";

import { revalidatePath } from "next/cache";
import { isAdminAuthed } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PortfolioCategory } from "@/lib/types";

/**
 * Verify the admin passcode and return a service-role client. Writes go
 * through service-role because there's no Supabase auth session under the
 * passcode model (RLS would otherwise block them).
 */
async function assertAdmin() {
  if (!(await isAdminAuthed())) throw new Error("Unauthorized");
  return createAdminClient();
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, ""); // no leading/trailing dashes
}

/**
 * Guarantee a non-empty, unique blog slug. Thai-only titles slugify to ""
 * (all non-ASCII stripped); the `slug` column is UNIQUE + NOT NULL, so without
 * this a second empty slug collided and the insert failed silently. Falls back
 * to "post" and appends -2, -3… until the slug is free.
 */
async function uniqueBlogSlug(
  supabase: ReturnType<typeof createAdminClient>,
  base: string,
  excludeId: string | null
): Promise<string> {
  const root = base || "post";
  for (let i = 1; i <= 100; i++) {
    const candidate = i === 1 ? root : `${root}-${i}`;
    const { data } = await supabase
      .from("blog_posts")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    const taken = !!data && (!excludeId || (data as { id: string }).id !== excludeId);
    if (!taken) return candidate;
  }
  return `${root}-${Date.now().toString(36)}`;
}

function tagsFromString(s: FormDataEntryValue | null): string[] {
  return String(s ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function refreshPublic() {
  revalidatePath("/");
  revalidatePath("/blog");
  revalidatePath("/press-kit");
}

// ─── Portfolio ──────────────────────────────────────────────────────────────
export async function savePortfolio(formData: FormData) {
  const supabase = await assertAdmin();
  const id = formData.get("id") as string | null;

  const row = {
    title: String(formData.get("title")),
    description: String(formData.get("description") ?? ""),
    thumbnail_url: String(formData.get("thumbnail_url") ?? "") || null,
    project_url: String(formData.get("project_url") ?? "") || null,
    category: (formData.get("category") as PortfolioCategory) ?? "Other",
    tech_tags: tagsFromString(formData.get("tech_tags")),
    featured: formData.get("featured") === "on",
    display_order: Number(formData.get("display_order") ?? 0),
  };

  if (id) await supabase.from("portfolio").update(row).eq("id", id);
  else await supabase.from("portfolio").insert(row);

  refreshPublic();
  revalidatePath("/admin/portfolio");
}

export async function deletePortfolio(formData: FormData) {
  const supabase = await assertAdmin();
  await supabase.from("portfolio").delete().eq("id", String(formData.get("id")));
  refreshPublic();
  revalidatePath("/admin/portfolio");
}

// ─── Blog ─────────────────────────────────────────────────────────────────
export async function saveBlog(
  formData: FormData
): Promise<{ id: string | null; error?: string }> {
  const supabase = await assertAdmin();
  const id = formData.get("id") as string | null;
  const title = String(formData.get("title"));
  const status = String(formData.get("status")) === "published" ? "published" : "draft";

  const memberBody = String(formData.get("member_body") ?? "") || null;

  // Non-empty, unique slug — Thai-only titles otherwise slugify to "" and collide.
  const baseSlug = slugify(String(formData.get("slug") ?? "")) || slugify(title);
  const slug = await uniqueBlogSlug(supabase, baseSlug, id);

  const row = {
    title,
    slug,
    excerpt: String(formData.get("excerpt") ?? "") || null,
    body: String(formData.get("body") ?? "") || null,
    cover_image_url: String(formData.get("cover_image_url") ?? "") || null,
    tags: tagsFromString(formData.get("tags")),
    is_public: formData.get("is_public") === "on",
    status,
    published_at:
      status === "published"
        ? (String(formData.get("published_at") || "") || new Date().toISOString())
        : null,
  };

  let postId = id;
  if (id) {
    const { error } = await supabase.from("blog_posts").update(row).eq("id", id);
    if (error) return { id: null, error: `บันทึกไม่สำเร็จ: ${error.message}` };
  } else {
    const { data, error } = await supabase
      .from("blog_posts")
      .insert(row)
      .select("id")
      .single();
    if (error) return { id: null, error: `บันทึกไม่สำเร็จ: ${error.message}` };
    postId = (data as { id: string } | null)?.id ?? null;
  }

  // Members-only content lives in its own table + a world-readable flag. Kept
  // separate and error-tolerant so a pre-migration DB still saves the core post.
  if (postId) {
    await supabase
      .from("blog_posts")
      .update({ has_member_content: !!memberBody })
      .eq("id", postId);
    if (memberBody) {
      await supabase
        .from("blog_member_content")
        .upsert({ post_id: postId, member_body: memberBody });
    } else {
      await supabase.from("blog_member_content").delete().eq("post_id", postId);
    }
  }

  refreshPublic();
  revalidatePath("/admin/blog");
  return { id: postId };
}

export async function deleteBlog(formData: FormData) {
  const supabase = await assertAdmin();
  await supabase.from("blog_posts").delete().eq("id", String(formData.get("id")));
  refreshPublic();
  revalidatePath("/admin/blog");
}

// ─── Portfolio collections (Snobby Story, Insightist) ────────────────────────
export async function savePortfolioCollection(
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = await assertAdmin();
  const slug = String(formData.get("slug"));
  if (!slug) return { error: "Missing slug" };

  let p: {
    title?: string;
    tagline?: string | null;
    intro?: string | null;
    category?: string | null;
    tags?: string[];
    data?: Record<string, unknown>;
  };
  try {
    p = JSON.parse(String(formData.get("payload") ?? "{}"));
  } catch {
    return { error: "Invalid payload" };
  }

  const { error } = await supabase.from("portfolio_collections").upsert({
    slug,
    title: p.title || slug,
    tagline: p.tagline || null,
    intro: p.intro || null,
    category: p.category || null,
    tags: p.tags ?? [],
    data: p.data ?? {},
    updated_at: new Date().toISOString(),
  });
  if (error) {
    const missing = /schema cache|does not exist|find the table|relation/i.test(
      error.message
    );
    return {
      error: missing
        ? "ยังไม่ได้สร้างตาราง portfolio_collections — โปรดรัน migration add-portfolio-collections.sql ใน Supabase SQL Editor ก่อน แล้วลองอีกครั้ง"
        : `บันทึกไม่สำเร็จ: ${error.message}`,
    };
  }

  // Optionally point a Portfolio card's "view" link at this collection.
  const linkId = String(formData.get("link_portfolio_id") ?? "");
  if (linkId) {
    await supabase
      .from("portfolio")
      .update({ project_url: `/portfolio/${slug}` })
      .eq("id", linkId);
  }

  refreshPublic();
  revalidatePath(`/portfolio/${slug}`);
  revalidatePath("/admin/collections");
  revalidatePath("/admin/portfolio");
  return {};
}

export async function deletePortfolioCollection(formData: FormData) {
  const supabase = await assertAdmin();
  const slug = String(formData.get("slug"));
  if (!slug) return;
  await supabase.from("portfolio_collections").delete().eq("slug", slug);
  refreshPublic();
  revalidatePath("/admin/collections");
}

// ─── Site profile ───────────────────────────────────────────────────────────
export async function saveProfile(formData: FormData) {
  const supabase = await assertAdmin();
  await supabase
    .from("site_profile")
    .update({
      name: String(formData.get("name")),
      headline: String(formData.get("headline") ?? "") || null,
      long_bio: String(formData.get("long_bio") ?? "") || null,
      avatar_url: String(formData.get("avatar_url") ?? "") || null,
      background_reel_url: String(formData.get("background_reel_url") ?? "") || null,
      social_links: {
        github: String(formData.get("github") ?? ""),
        linkedin: String(formData.get("linkedin") ?? ""),
        x: String(formData.get("x") ?? ""),
        tiktok: String(formData.get("tiktok") ?? ""),
        facebook: String(formData.get("facebook") ?? ""),
        email: String(formData.get("email") ?? ""),
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  // CV columns — separate + tolerant so the core save still works if the
  // add-cv-links.sql migration hasn't been applied yet.
  const { error: cvErr } = await supabase
    .from("site_profile")
    .update({
      cv_th_url: String(formData.get("cv_th_url") ?? "") || null,
      cv_en_url: String(formData.get("cv_en_url") ?? "") || null,
    })
    .eq("id", 1);
  if (cvErr) console.error("[saveProfile] CV columns not migrated?", cvErr.message);

  refreshPublic();
  revalidatePath("/admin/profile");
}

// ─── Press kit ──────────────────────────────────────────────────────────────
export async function savePressKit(formData: FormData) {
  const supabase = await assertAdmin();

  // logo_files arrive as parallel arrays of labels + urls.
  const labels = formData.getAll("logo_label").map(String);
  const urls = formData.getAll("logo_url").map(String);
  const logo_files = labels
    .map((label, i) => ({ label, file_url: urls[i] ?? "" }))
    .filter((l) => l.label && l.file_url);

  await supabase
    .from("press_kit")
    .update({
      short_bio: String(formData.get("short_bio") ?? "") || null,
      long_bio: String(formData.get("long_bio") ?? "") || null,
      headshot_url: String(formData.get("headshot_url") ?? "") || null,
      media_contact_email: String(formData.get("media_contact_email") ?? "") || null,
      downloadable_kit_pdf_url: String(formData.get("downloadable_kit_pdf_url") ?? "") || null,
      awards: tagsFromString(formData.get("awards")),
      logo_files,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);
  refreshPublic();
  revalidatePath("/admin/press-kit");
}

// ─── Messages ───────────────────────────────────────────────────────────────
export async function toggleMessageRead(formData: FormData) {
  const supabase = await assertAdmin();
  await supabase
    .from("contact_messages")
    .update({ is_read: formData.get("is_read") === "true" })
    .eq("id", String(formData.get("id")));
  revalidatePath("/admin/messages");
  revalidatePath("/admin");
}

export async function deleteMessage(formData: FormData) {
  const supabase = await assertAdmin();
  await supabase.from("contact_messages").delete().eq("id", String(formData.get("id")));
  revalidatePath("/admin/messages");
  revalidatePath("/admin");
}
