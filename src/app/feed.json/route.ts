import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/seo";
import { getFeedPosts, postUrl } from "@/lib/feed";

export const revalidate = 3600;

// JSON Feed 1.1 (https://jsonfeed.org) of the latest blog posts.
export async function GET() {
  const posts = await getFeedPosts(30);

  const feed = {
    version: "https://jsonfeed.org/version/1.1",
    title: `${SITE_NAME} — Blog`,
    home_page_url: `${SITE_URL}/blog`,
    feed_url: `${SITE_URL}/feed.json`,
    description: SITE_DESCRIPTION,
    language: "th",
    items: posts.map((p) => ({
      id: postUrl(p.slug),
      url: postUrl(p.slug),
      title: p.title,
      summary: p.excerpt ?? undefined,
      image: p.cover_image_url ?? undefined,
      date_published: p.published_at
        ? new Date(p.published_at).toISOString()
        : undefined,
      tags: p.tags?.length ? p.tags : undefined,
    })),
  };

  return new Response(JSON.stringify(feed, null, 2), {
    headers: {
      "Content-Type": "application/feed+json; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
