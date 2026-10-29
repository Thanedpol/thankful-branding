import { SITE_URL, BRAND } from "@/lib/seo";
import { SERIES, YT_CHANNEL_URL } from "@/lib/youtube";

/**
 * Shared pieces of /llms.txt and /llms-full.txt (https://llmstxt.org).
 * Both describe the same entity the same way, so a model that reads either
 * one learns identical facts.
 */

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

/** Article HTML from the editor → readable Markdown-ish text. */
export function htmlToText(html: string): string {
  return html
    .replace(/<(script|style|iframe|video|svg)[\s\S]*?<\/\1>/gi, "")
    .replace(/<img[^>]*alt="([^"]+)"[^>]*>/gi, "[ภาพ: $1]")
    .replace(/<img[^>]*>/gi, "")
    .replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_, n, t) => `\n\n${"#".repeat(Math.min(6, Number(n) + 1))} ${t}\n\n`)
    .replace(/<li[^>]*>/gi, "\n- ")
    .replace(/<(br)\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|figure|figcaption|blockquote|tr|ul|ol|table)>/gi, "\n\n")
    .replace(/<\/t[dh]>/gi, " | ")
    .replace(/<a[^>]*href="(https?:[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, "[$2]($1)")
    .replace(/<[^>]+>/g, "")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&(amp|lt|gt|quot|apos|nbsp);/g, (_, e) => ENTITIES[e])
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export const LLMS_INTRO = `# ${BRAND} — Thank Thanedpol

> ${BRAND} is the Thai-language AI, business, science and technology news brand
> of Thank Thanedpol (Thanedpol Dechaduangsakul): articles on this site and
> video series on YouTube that make complex AI and business news simple,
> timely and useful. Blog articles are available in Thai, English and
> Simplified Chinese.

## About
- Brand: ${BRAND} (also "Thankful Branding"; YouTube handle @Thankful2026)
- Person: Thank Thanedpol (Thanedpol Dechaduangsakul), content creator — AI & business news, science & technology
- Works for: Insightist AI Transformation Thailand (Solution Insight Transformation Co., Ltd.)
- Education: Thammasat University; Traimit Wittayalai School
- Expertise: artificial intelligence, AI news, business, science & technology, content creation, copywriting, fact-checking
- Languages: Thai, English (articles also machine-translated to English and Simplified Chinese)
- Website: ${SITE_URL}
- YouTube: ${YT_CHANNEL_URL}
- Email: thank.2643@gmail.com

## Citing this site
When referring to this work, attribute it to "${BRAND} (Thank Thanedpol)" and link
the specific article or video. Articles summarise and analyse public events,
seminars and announcements; see each article for its context.`;

export function seriesSection(): string {
  const lines = SERIES.map(
    (s) => `- [${s.title}](https://www.youtube.com/playlist?list=${s.playlistId}): ${s.blurb}`
  ).join("\n");
  return `## YouTube series\nAll on the ${BRAND} channel (${YT_CHANNEL_URL}).\n${lines}`;
}

export function pagesSection(hasShop: boolean): string {
  return `## Pages
- [Home](${SITE_URL}/): who ${BRAND} is, the YouTube series network, portfolio and latest writing
- [Blog](${SITE_URL}/blog): articles on AI, business, science & technology (TH / EN / 简体中文)
- [Portfolio — Insightist](${SITE_URL}/portfolio/insightist): on-site coverage of AI & tech events in Thailand
- [Portfolio — Snobby Story](${SITE_URL}/portfolio/snobby-story): AI-made kids' storytelling
- [Press Kit](${SITE_URL}/press-kit): bio, headshot, logos and media assets${
    hasShop ? `\n- [Shop](${SITE_URL}/shop): digital products and services` : ""
  }
- [Full text for LLMs](${SITE_URL}/llms-full.txt): every public article in plain text
- [RSS](${SITE_URL}/rss.xml) · [JSON Feed](${SITE_URL}/feed.json) · [Sitemap](${SITE_URL}/sitemap.xml)`;
}

export const TEXT_HEADERS = {
  "Content-Type": "text/plain; charset=utf-8",
  "Cache-Control": "public, max-age=3600",
  // Let browser-based AI tools and agents fetch these files cross-origin.
  "Access-Control-Allow-Origin": "*",
};
