import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/seo";
import { getFeedPosts, xmlEscape, postUrl } from "@/lib/feed";

export const revalidate = 3600;

// RSS 2.0 feed of the latest blog posts (public excerpts only).
export async function GET() {
  const posts = await getFeedPosts(30);
  const now = new Date().toUTCString();

  const items = posts
    .map((p) => {
      const url = postUrl(p.slug);
      const pub = p.published_at ? new Date(p.published_at).toUTCString() : now;
      const cats = (p.tags ?? [])
        .map((t) => `      <category>${xmlEscape(t)}</category>`)
        .join("\n");
      const enclosure = p.cover_image_url
        ? `\n      <enclosure url="${xmlEscape(p.cover_image_url)}" type="image/*" length="0" />`
        : "";
      return `    <item>
      <title>${xmlEscape(p.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pub}</pubDate>
      <description>${xmlEscape(p.excerpt)}</description>${enclosure}
${cats}
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xmlEscape(SITE_NAME)} — Blog</title>
    <link>${SITE_URL}/blog</link>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    <description>${xmlEscape(SITE_DESCRIPTION)}</description>
    <language>th</language>
    <lastBuildDate>${now}</lastBuildDate>
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
