"use server";

import { revalidatePath } from "next/cache";
import { isAdminAuthed } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasContent } from "@/lib/portfolio-sessions";
import { buildEventRows, buildGroupMeta } from "@/lib/portfolio-events";
import type { PortfolioCategory, PortfolioCollection } from "@/lib/types";

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

  // Preserve the FIRST-published timestamp: stamp it once (the first time the
  // post becomes published) and keep it stable on later edits — so re-editing a
  // published post doesn't jump it to the top of the blog or change its date.
  let existingPublishedAt: string | null = null;
  if (id) {
    const { data: existing } = await supabase
      .from("blog_posts")
      .select("published_at")
      .eq("id", id)
      .maybeSingle();
    existingPublishedAt =
      (existing as { published_at: string | null } | null)?.published_at ?? null;
  }
  // An explicit publish time from the editor lets the admin SCHEDULE a future
  // post (goes live automatically at that time) or back-date one. The client
  // sends it already normalized to a UTC ISO string.
  const rawPublishAt = String(formData.get("published_at") ?? "").trim();
  const explicitPublishAt =
    rawPublishAt && !Number.isNaN(Date.parse(rawPublishAt))
      ? new Date(rawPublishAt).toISOString()
      : "";

  const publishedAt =
    status !== "published"
      ? existingPublishedAt
      : explicitPublishAt || existingPublishedAt || new Date().toISOString();

  const row = {
    title,
    slug,
    excerpt: String(formData.get("excerpt") ?? "") || null,
    body: String(formData.get("body") ?? "") || null,
    cover_image_url: String(formData.get("cover_image_url") ?? "") || null,
    tags: tagsFromString(formData.get("tags")),
    is_public: formData.get("is_public") === "on",
    status,
    published_at: publishedAt,
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

/**
 * Mirror a grouped collection's events into the per-event `portfolio_events`
 * rows that the public site reads. Upserts every current event first (so the
 * read model never has a gap), then deletes rows for events that were removed.
 * Returns an error message on failure (the blob save already succeeded, so the
 * admin can just retry to reconcile). No-op shape reuse via buildEventRows keeps
 * the slugs identical to the original migration.
 */
async function syncPortfolioEvents(
  supabase: ReturnType<typeof createAdminClient>,
  slug: string,
  groups: NonNullable<PortfolioCollection["data"]["groups"]>
): Promise<string | null> {
  const rows = buildEventRows(slug, groups);
  const keep = new Set(rows.map((r) => r.slug));
  const BATCH = 50;
  for (let i = 0; i < rows.length; i += BATCH) {
    const { error } = await supabase
      .from("portfolio_events")
      .upsert(rows.slice(i, i + BATCH), { onConflict: "collection_slug,slug" });
    if (error) return error.message;
  }
  const { data: existing, error: exErr } = await supabase
    .from("portfolio_events")
    .select("slug")
    .eq("collection_slug", slug);
  if (exErr) return exErr.message;
  const stale = ((existing as { slug: string }[] | null) ?? [])
    .map((r) => r.slug)
    .filter((s) => !keep.has(s));
  if (stale.length) {
    const { error } = await supabase
      .from("portfolio_events")
      .delete()
      .eq("collection_slug", slug)
      .in("slug", stale);
    if (error) return error.message;
  }
  return null;
}

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

  // The admin editor strips body HTML from large collections to keep its
  // payload small; those sessions come back empty. Restore each empty body from
  // the stored row so a structure/header edit never wipes imported content.
  // Primary match is the Facebook url; a positional fallback (parent event +
  // session index) covers sessions that have no url of their own.
  type Sess = { url?: string; body?: string; _stripped?: boolean };
  type Ev = { url?: string; body?: string; _stripped?: boolean; sessions?: Sess[] };
  type Grp = { name?: string; events?: Ev[] };
  const { data: existingRow } = await supabase
    .from("portfolio_collections")
    .select("data")
    .eq("slug", slug)
    .maybeSingle();
  const stored = (existingRow?.data as { groups?: Grp[] } | undefined)?.groups;
  const incoming = (p.data as { groups?: Grp[] } | undefined)?.groups;
  if (incoming) {
    // A stable-ish key for an event: prefer its url, else its position.
    const evKey = (g: Grp, e: Ev, ei: number) =>
      e.url ? "u|" + e.url : "p|" + (g.name ?? "") + "|" + ei;
    const evBody = new Map<string, string>(); // event url → event body
    const sByUrl = new Map<string, string>(); // session url → body
    const sByPos = new Map<string, string>(); // evKey|index → session body
    for (const g of stored ?? [])
      (g.events ?? []).forEach((e, ei) => {
        if (e.body && e.url) evBody.set(e.url, e.body);
        const ek = evKey(g, e, ei);
        (e.sessions ?? []).forEach((s, si) => {
          if (!s.body) return;
          if (s.url) sByUrl.set(s.url, s.body);
          sByPos.set(ek + "|" + si, s.body);
        });
      });
    incoming.forEach((g) =>
      (g.events ?? []).forEach((e, ei) => {
        if (!hasContent(e.body) && e.url && evBody.has(e.url)) e.body = evBody.get(e.url);
        delete e._stripped; // internal marker — never persist
        const ek = evKey(g, e, ei);
        (e.sessions ?? []).forEach((s, si) => {
          if (!hasContent(s.body)) {
            const restored = (s.url && sByUrl.get(s.url)) || sByPos.get(ek + "|" + si);
            if (restored) s.body = restored;
          }
          delete s._stripped; // internal marker — never persist
        });
      })
    );
  }

  // Keep a light copy of group metadata inline (data->groups_meta) so the public
  // listing can read group order + the ★popular flag without ever loading the
  // multi-MB blob. The heavy `data.groups` stays for the admin editor.
  const syncGroups = (p.data as Pick<PortfolioCollection["data"], "groups">)
    ?.groups;
  const dataToStore: Record<string, unknown> = { ...(p.data ?? {}) };
  if (syncGroups) dataToStore.groups_meta = buildGroupMeta(syncGroups);

  const { error } = await supabase.from("portfolio_collections").upsert({
    slug,
    title: p.title || slug,
    tagline: p.tagline || null,
    intro: p.intro || null,
    category: p.category || null,
    tags: p.tags ?? [],
    data: dataToStore,
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

  // Mirror events into the per-event rows the public site reads. If this fails
  // the blob is still saved, so surface the error and let the admin retry (a
  // retry reconciles both). Only grouped collections have event rows.
  if (syncGroups) {
    const syncErr = await syncPortfolioEvents(supabase, slug, syncGroups);
    if (syncErr)
      return {
        error: `บันทึกหลักสำเร็จ แต่ซิงก์รายการงานไม่สำเร็จ (${syncErr}) — กด Save อีกครั้งเพื่อซิงก์ให้ครบ`,
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
  // Also revalidate the event detail routes so a newly-added event page (or one
  // whose content just changed) doesn't keep serving a cached 404 from a click
  // made before the data was live.
  revalidatePath("/portfolio/insightist/[event]", "page");
  revalidatePath("/portfolio/[collection]/[event]", "page");
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

/**
 * Session bodies for ONE event, addressed by its position (group + order) in the
 * stored structure.
 *
 * The editor used to hydrate every body at once, which meant shipping the whole
 * collection blob — now several MB — through a single response, right at
 * Vercel's ~4.5 MB ceiling. Fetching one event at a time keeps every response
 * small no matter how large the collection grows.
 *
 * Reads the per-event row (indexed on collection_slug, group_name, event_order),
 * which savePortfolioCollection keeps in lockstep with the blob the editor's
 * structure came from — so `sessions[i]` here is `sessions[i]` there. Falls back
 * to the blob for a pre-sync collection that has no rows yet.
 */
export async function getEventBodies(
  collectionSlug: string,
  groupName: string,
  eventOrder: number
): Promise<{ sessions?: { body?: string }[]; error?: string }> {
  const supabase = await assertAdmin();
  const { data, error } = await supabase
    .from("portfolio_events")
    .select("sessions")
    .eq("collection_slug", collectionSlug)
    .eq("group_name", groupName)
    .eq("event_order", eventOrder)
    .maybeSingle();
  if (error) return { error: error.message };
  if (data) return { sessions: (data.sessions as { body?: string }[]) ?? [] };

  // No row (collection never synced): read just this event out of the blob.
  const { data: coll, error: blobErr } = await supabase
    .from("portfolio_collections")
    .select("data")
    .eq("slug", collectionSlug)
    .maybeSingle();
  if (blobErr) return { error: blobErr.message };
  const groups = (coll?.data as PortfolioCollection["data"] | undefined)?.groups ?? [];
  const event = groups.find((g) => g.name === groupName)?.events?.[eventOrder];
  if (!event) return { error: "ไม่พบงานนี้ในข้อมูลที่บันทึกไว้" };
  const sessions = event.sessions?.length
    ? event.sessions
    : event.body
    ? [{ body: event.body }]
    : [];
  return { sessions: sessions.map((s) => ({ body: s.body })) };
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
