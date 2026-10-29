import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

/**
 * AI crawlers named one by one. The `*` group already lets them in, but a
 * crawler that finds a group with its own name obeys only that group — so
 * spelling them out makes the welcome explicit and keeps them out of the
 * private routes too. Covers training, search-index and on-demand fetchers.
 */
const AI_AGENTS = [
  // OpenAI — training, ChatGPT search index, and live browsing for a user
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  // Anthropic — training, Claude search, and live fetches for a user
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "anthropic-ai",
  // Perplexity
  "PerplexityBot",
  "Perplexity-User",
  // Google Gemini / AI Overviews, Apple Intelligence
  "Google-Extended",
  "Applebot-Extended",
  // Microsoft Copilot and ChatGPT search both lean on Bing's index
  "Bingbot",
  // Others that feed widely used models
  "CCBot",
  "meta-externalagent",
  "Amazonbot",
  "DuckAssistBot",
  "MistralAI-User",
  "cohere-ai",
];

const PRIVATE = ["/admin", "/api"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE },
      { userAgent: AI_AGENTS, allow: "/", disallow: PRIVATE },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
