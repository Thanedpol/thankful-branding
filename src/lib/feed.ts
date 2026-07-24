import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured, demoBlogPreviews } from "@/lib/demo-data";
import type { BlogPreview } from "@/lib/types";
import { SITE_URL } from "@/lib/seo";

/**
 * Recent published posts for the syndication feeds (RSS / Atom / JSON).
 * Uses the cookie-free anon client so the feed routes stay statically
 * renderable / ISR-cacheable — the same reason the sitemap uses it — which is
 * what keeps them reliably fetchable by crawlers. `blog_previews` never exposes
 * the body or member content, so feeds can only ever contain public excerpts.
 */
export async function getFeedPosts(limit = 30): Promise<BlogPreview[]> {
  if (!isSupabaseConfigured()) return demoBlogPreviews.slice(0, limit);
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("blog_previews")
    .select("*")
    .order("published_at", { ascending: false })
    .limit(limit);
  return (data as BlogPreview[]) ?? [];
}

/** Escape text for safe inclusion in XML element content / attributes. */
export function xmlEscape(s: string | null | undefined): string {
  return (s ?? "").replace(/[&<>"']/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === '"' ? "&quot;" : "&apos;"
  );
}

export function postUrl(slug: string): string {
  return `${SITE_URL}/blog/${slug}`;
}
