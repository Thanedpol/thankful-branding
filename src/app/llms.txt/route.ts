import { SITE_URL } from "@/lib/seo";
import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured, demoBlogPreviews } from "@/lib/demo-data";
import { listPublishedProducts } from "@/lib/shop-queries";
import { LLMS_INTRO, pagesSection, seriesSection, TEXT_HEADERS } from "@/lib/llms";
import type { BlogPreview } from "@/lib/types";

export const revalidate = 3600;

// llms.txt — the short guide for LLMs and AI crawlers. Spec: https://llmstxt.org
// The long companion with every article's full text is /llms-full.txt.
export async function GET() {
  let posts: BlogPreview[] = demoBlogPreviews;
  if (isSupabaseConfigured()) {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("blog_previews")
      .select("*")
      .order("published_at", { ascending: false });
    posts = (data as BlogPreview[]) ?? [];
  }
  const products = await listPublishedProducts();

  const postLines = posts
    .map((p) => {
      const date = p.published_at ? new Date(p.published_at).toISOString().slice(0, 10) : "";
      const tags = p.tags?.length ? ` · ${p.tags.join(", ")}` : "";
      // Many posts have no excerpt; leave the line clean rather than ending
      // it with an empty ": ".
      const excerpt = p.excerpt?.trim() ? `: ${p.excerpt.trim()}` : "";
      return `- [${p.title}](${SITE_URL}/blog/${p.slug}) — ${date}${tags}${excerpt}`;
    })
    .join("\n");

  const productLines = products.length
    ? `\n\n## Shop\n${products
        .map((p) => `- [${p.title}](${SITE_URL}/shop/${p.slug})${p.tagline ? `: ${p.tagline}` : ""}`)
        .join("\n")}`
    : "";

  const body = `${LLMS_INTRO}

${pagesSection(products.length > 0)}

${seriesSection()}

## Blog posts
${postLines}${productLines}
`;

  return new Response(body, { headers: TEXT_HEADERS });
}
