import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/seo";
import { getFeedPosts, xmlEscape, postUrl } from "@/lib/feed";

export const revalidate = 3600;

// Atom 1.0 feed of the latest blog posts (public excerpts only).
export async function GET() {
  const posts = await getFeedPosts(30);
  const nowIso = new Date().toISOString();
  const updated = posts[0]?.published_at
    ? new Date(posts[0].published_at).toISOString()
    : nowIso;

  const entries = posts
    .map((p) => {
      const url = postUrl(p.slug);
      const iso = p.published_at ? new Date(p.published_at).toISOString() : nowIso;
      const cats = (p.tags ?? [])
        .map((t) => `    <category term="${xmlEscape(t)}" />`)
        .join("\n");
      return `  <entry>
    <title>${xmlEscape(p.title)}</title>
    <link href="${url}" />
    <id>${url}</id>
    <updated>${iso}</updated>
    <published>${iso}</published>
    <summary>${xmlEscape(p.excerpt)}</summary>
${cats}
  </entry>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="th">
  <title>${xmlEscape(SITE_NAME)} — Blog</title>
  <subtitle>${xmlEscape(SITE_DESCRIPTION)}</subtitle>
  <link href="${SITE_URL}/blog" />
  <link href="${SITE_URL}/atom.xml" rel="self" type="application/atom+xml" />
  <id>${SITE_URL}/</id>
  <updated>${updated}</updated>
  <author><name>${xmlEscape(SITE_NAME)}</name></author>
${entries}
</feed>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/atom+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
