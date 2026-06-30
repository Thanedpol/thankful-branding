import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, demoBlogPreviews } from "@/lib/demo-data";
import type { BlogPreview } from "@/lib/types";

export const revalidate = 3600;

async function getPosts(): Promise<BlogPreview[]> {
  if (!isSupabaseConfigured()) return demoBlogPreviews;
  const supabase = await createClient();
  const { data } = await supabase
    .from("blog_previews")
    .select("*")
    .order("published_at", { ascending: false });
  return (data as BlogPreview[]) ?? [];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/blog`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/press-kit`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/portfolio/snobby-story`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/portfolio/insightist`, changeFrequency: "monthly", priority: 0.6 },
  ];

  const posts = await getPosts();
  const postRoutes: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${SITE_URL}/blog/${p.slug}`,
    lastModified: p.published_at ? new Date(p.published_at) : undefined,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...postRoutes];
}
