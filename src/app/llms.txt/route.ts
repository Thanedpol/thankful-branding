import { SITE_URL } from "@/lib/seo";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, demoBlogPreviews } from "@/lib/demo-data";
import type { BlogPreview } from "@/lib/types";

export const revalidate = 3600;

// llms.txt — a plain-text/markdown guide for LLMs and AI crawlers (AEO/GEO).
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
    .map((p) => {
      const date = p.published_at
        ? new Date(p.published_at).toISOString().slice(0, 10)
        : "";
      const tags = p.tags?.length ? ` · tags: ${p.tags.join(", ")}` : "";
      const meta = date ? ` — ${date}${tags}` : tags;
      return `- [${p.title}](${SITE_URL}/blog/${p.slug})${meta}: ${p.excerpt ?? ""}`;
    })
    .join("\n");

  const body = `# Thank Thanedpol

> Content creator covering AI & Business news across Thailand and worldwide,
> plus Science & Technology. Making complex AI and business news simple, timely,
> and useful. Blog articles are available in Thai, English, and Simplified Chinese.

## About
- Name: Thank Thanedpol (Thanedpol Dechaduangsakul)
- Role: Content Creator — AI & Business news · Science & Technology
- Works for: Insightist AI Transformation Thailand (Solution Insight Transformation Co., Ltd.)
- Education: Thammasat University; Traimit Wittayalai School
- Expertise: Artificial Intelligence, AI news, Business, Science & Technology, Content creation, Copywriting, Fact-checking
- Languages: Thai, English (articles auto-translated to English and Simplified Chinese)

## Pages
- [Home](${SITE_URL}/): Hero, about, featured portfolio, latest writing
- [Blog](${SITE_URL}/blog): Articles on AI, business, science & technology (TH / EN / 简体中文)
- [Press Kit](${SITE_URL}/press-kit): Bio, headshot, logos, and downloadable media assets
- [Portfolio — Insightist](${SITE_URL}/portfolio/insightist): On-site AI & tech event coverage
- [Portfolio — Snobby Story](${SITE_URL}/portfolio/snobby-story): AI-made kids' storytelling

## Blog posts
${postLines}

## Contact
- Email: thank.2643@gmail.com
- Press & media: see the Press Kit page above
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
