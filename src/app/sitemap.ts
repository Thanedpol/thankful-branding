import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured, demoBlogPreviews } from "@/lib/demo-data";
import { COLLECTION_SLUGS, fetchCollection } from "@/lib/portfolio-collections";
import { eventHasContent } from "@/lib/portfolio-sessions";
import type { BlogPreview } from "@/lib/types";

export const revalidate = 3600;

// Cookie-free anon reads → this route stays statically renderable / ISR-cached,
// so crawlers (Googlebot) get a fast, always-available sitemap instead of a
// per-request dynamic render that can time out and report "Couldn't fetch".
async function getPosts(): Promise<BlogPreview[]> {
  if (!isSupabaseConfigured()) return demoBlogPreviews;
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("blog_previews")
    .select("*")
    .order("published_at", { ascending: false });
  return (data as BlogPreview[]) ?? [];
}

/** Every portfolio event sub-page that has content (e.g. /portfolio/insightist/<slug>). */
async function getPortfolioEventRoutes(): Promise<MetadataRoute.Sitemap> {
  const routes: MetadataRoute.Sitemap = [];
  for (const slug of COLLECTION_SLUGS) {
    const c = await fetchCollection(slug);
    for (const g of c?.data.groups ?? []) {
      for (const e of g.events) {
        if (e.slug && eventHasContent(e)) {
          routes.push({
            url: `${SITE_URL}/portfolio/${slug}/${e.slug}`,
            changeFrequency: "monthly",
            priority: 0.5,
          });
        }
      }
    }
  }
  return routes;
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

  const eventRoutes = await getPortfolioEventRoutes();

  return [...staticRoutes, ...postRoutes, ...eventRoutes];
}
