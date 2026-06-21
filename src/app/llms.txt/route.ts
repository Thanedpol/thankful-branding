import { SITE_URL } from "@/lib/seo";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, demoBlogPreviews } from "@/lib/demo-data";
import type { BlogPreview } from "@/lib/types";

export const revalidate = 3600;

// llms.txt — a plain-text/markdown guide for LLMs and AI crawlers.
// Spec: https://llmstxt.org
export async function GET() {
  let posts: BlogPreview[] = demoBlogPreviews;
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("blog_previews")
      .select("*")
      .order("published_at", { ascending: false });
    posts = (data as BlogPreview[]) ?? [];
  }

  const postLines = posts
    .map((p) => `- [${p.title}](${SITE_URL}/blog/${p.slug}): ${p.excerpt ?? ""}`)
    .join("\n");

  const body = `# Thank Thanedpol

> Content Creator covering AI & Business news across Thailand and worldwide,
> plus Science & Technology. Personal brand site with portfolio, blog, and press kit.

## Pages
- [Home](${SITE_URL}/): Hero, about, featured portfolio, latest writing
- [Blog](${SITE_URL}/blog): Articles on AI, business, science & technology
- [Press Kit](${SITE_URL}/press-kit): Bio, headshot, and media assets

## Blog posts
${postLines}

## Contact
- Email: thank.2643@gmail.com
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
