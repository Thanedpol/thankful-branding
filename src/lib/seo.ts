import type { SiteProfile, BlogPost, BlogPreview } from "@/lib/types";

/** Canonical site URL (no trailing slash). Set NEXT_PUBLIC_SITE_URL in prod. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://thankful-branding.vercel.app"
).replace(/\/$/, "");

const NAME = "Thank Thanedpol";
const ALT_NAME = "Thanedpol Dechaduangsakul";
const ROLE = "Content Creator — AI & Business · SCI & Technology";

// ── Credential / entity data (from CV) — stable facts that enrich the
// knowledge-graph entity for Google and AI/answer engines. ───────────────────
const EMPLOYER = {
  "@type": "Organization",
  name: "Solution Insight Transformation Co., Ltd.",
  brand: "Insightist AI Transformation Thailand",
};

const EDUCATION = [
  { "@type": "CollegeOrUniversity", name: "Thammasat University" },
  { "@type": "HighSchool", name: "Traimit Wittayalai School" },
];

const CREDENTIALS: { name: string; by: string }[] = [
  { name: "Claude 101", by: "Anthropic" },
  { name: "Claude Foundations", by: "Rangsit University" },
  { name: "OKMD Career Bootcamp — Creative Writing Prompt", by: "OKMD" },
  { name: "OKMD Career Bootcamp — Art & AI", by: "OKMD" },
  { name: "OKMD Career Bootcamp — AI Ethics & Copyright", by: "OKMD" },
  { name: "Generative AI & ChatGPT for Business & Marketing", by: "SolutionsImpact" },
  { name: "The Magic of AI Presentation", by: "SolutionsImpact" },
  { name: "AI Marketing Studio", by: "SolutionsImpact" },
  { name: "AI Automation Business", by: "SolutionsImpact" },
];

const KNOWS_ABOUT = [
  "Artificial Intelligence",
  "AI News",
  "Business",
  "Science and Technology",
  "Content Creation",
  "Copywriting",
  "Fact-checking",
  "Applied Mathematics",
];

export function personJsonLd(profile: SiteProfile | null) {
  const social = profile?.social_links;
  const sameAs = [
    social?.github,
    social?.linkedin,
    social?.x,
    "https://github.com/Thanedpol",
    // Add a Wikidata entity URL here once it exists, e.g.
    // "https://www.wikidata.org/wiki/Qxxxxxxx",
  ].filter((u): u is string => !!u);

  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile?.name ?? NAME,
    alternateName: ALT_NAME,
    url: SITE_URL,
    jobTitle: profile?.headline ?? ROLE,
    description: profile?.long_bio ?? undefined,
    email: "mailto:thank.2643@gmail.com",
    image: profile?.avatar_url
      ? new URL(profile.avatar_url, SITE_URL).toString()
      : undefined,
    worksFor: EMPLOYER,
    alumniOf: EDUCATION,
    knowsAbout: KNOWS_ABOUT,
    knowsLanguage: ["th", "en"],
    hasCredential: CREDENTIALS.map((c) => ({
      "@type": "EducationalOccupationalCredential",
      name: c.name,
      credentialCategory: "certificate",
      recognizedBy: { "@type": "Organization", name: c.by },
    })),
    sameAs: [...new Set(sameAs)],
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: `${NAME} — Portfolio & Blog`,
    url: SITE_URL,
  };
}

export function blogPostingJsonLd(post: BlogPost | BlogPreview) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt ?? undefined,
    image: post.cover_image_url ?? undefined,
    datePublished: post.published_at ?? undefined,
    dateModified: post.published_at ?? undefined,
    url: `${SITE_URL}/blog/${post.slug}`,
    mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
    keywords: post.tags?.join(", ") || undefined,
    author: { "@type": "Person", name: NAME, url: SITE_URL },
  };
}
