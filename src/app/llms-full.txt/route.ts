import { SITE_URL } from "@/lib/seo";
import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/demo-data";
import { htmlToText, LLMS_INTRO, pagesSection, seriesSection, TEXT_HEADERS } from "@/lib/llms";

export const revalidate = 3600;

interface FullPost {
  title: string;
  slug: string;
  excerpt: string | null;
  body: string | null;
  tags: string[] | null;
  published_at: string | null;
}

// llms-full.txt — every public article's full text in one file, so an AI tool
// can take in the whole site with a single fetch instead of crawling 90 pages.
//
// Read through the anonymous client on purpose: RLS returns only public,
// published posts, so members-only articles can never leak into this file.
export async function GET() {
  let posts: FullPost[] = [];
  if (isSupabaseConfigured()) {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("blog_posts")
      .select("title, slug, excerpt, body, tags, published_at")
      .eq("status", "published")
      .eq("is_public", true)
      .order("published_at", { ascending: false });
    posts = (data as FullPost[]) ?? [];
  }

  const articles = posts
    .map((p) => {
      const date = p.published_at ? new Date(p.published_at).toISOString().slice(0, 10) : "";
      const meta = [
        `URL: ${SITE_URL}/blog/${p.slug}`,
        date && `Published: ${date}`,
        p.tags?.length ? `Tags: ${p.tags.join(", ")}` : "",
        "Author: Thank Thanedpol (Thankful)",
      ]
        .filter(Boolean)
        .join("\n");
      const summary = p.excerpt?.trim() ? `\n\n> ${p.excerpt.trim()}` : "";
      return `# ${p.title}\n\n${meta}${summary}\n\n${htmlToText(p.body ?? "")}`;
    })
    .join("\n\n---\n\n");

  const body = `${LLMS_INTRO}

${pagesSection(false)}

${seriesSection()}

---

${articles}
`;

  return new Response(body, { headers: TEXT_HEADERS });
}
