import type { SiteProfile, BlogPost, BlogPreview } from "@/lib/types";
import { YT_CHANNEL_URL, type SeriesFeed } from "@/lib/youtube";
import { SOCIAL_PROFILES } from "@/lib/social";

/** Canonical site URL (no trailing slash). Set NEXT_PUBLIC_SITE_URL in prod. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://thankful-branding.vercel.app"
).replace(/\/$/, "");

const NAME = "Thank Thanedpol";
const ALT_NAME = "Thanedpol Dechaduangsakul";
/** The Thai spelling, stated outright. Without it, search and answer engines
 *  transliterate "Thanedpol" themselves and get it wrong (Google's AI Overview
 *  produced "ธนรรถพล" and the nickname "แธงค์"). */
export const NAME_TH = "ธเนศพล เดชาดวงสกุล";
export const NICKNAME_TH = "แต้ง";
const ROLE = "Content Creator — AI & Business · SCI & Technology";

export const SITE_NAME = NAME;
/** The public brand the site, the YouTube channel and the logo all carry. */
export const BRAND = "Thankful";
export const SITE_DESCRIPTION =
  "Thank Thanedpol (ธเนศพล เดชาดวงสกุล, คุณแต้ง) — content creator covering AI, business, science and technology news across Thailand and worldwide. Made simple, timely, and useful.";

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
    social?.tiktok,
    social?.facebook,
    "https://github.com/Thanedpol",
    // The YouTube channel is where most people meet the work — linking it is
    // what lets search and answer engines join the channel and this site into
    // one entity.
    YT_CHANNEL_URL,
    ...SOCIAL_PROFILES.map((p) => p.url),
    // Add a Wikidata entity URL here once it exists, e.g.
    // "https://www.wikidata.org/wiki/Qxxxxxxx",
  ].filter((u): u is string => !!u);

  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile?.name ?? NAME,
    alternateName: [ALT_NAME, NAME_TH, `คุณ${NICKNAME_TH}`, `${NICKNAME_TH} ${NAME_TH}`],
    givenName: "Thanedpol",
    familyName: "Dechaduangsakul",
    url: SITE_URL,
    jobTitle: profile?.headline ?? ROLE,
    description: profile?.long_bio ?? undefined,
    email: "mailto:thank.2643@gmail.com",
    image: profile?.avatar_url
      ? new URL(profile.avatar_url, SITE_URL).toString()
      : undefined,
    worksFor: EMPLOYER,
    brand: { "@id": `${SITE_URL}/#brand` },
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
    alternateName: [BRAND, "Thankful Branding"],
    url: SITE_URL,
    inLanguage: ["th", "en", "zh"],
    description: SITE_DESCRIPTION,
    publisher: { "@type": "Person", name: NAME, url: SITE_URL },
  };
}

/**
 * "Thankful" as an entity of its own — the brand on the site, the logo and the
 * YouTube channel — founded by the person above. Without it, a model reading
 * the channel name has nothing tying "Thankful" back to this site.
 */
export function brandJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#brand`,
    name: BRAND,
    alternateName: ["Thankful Branding", "Thankful2026"],
    url: SITE_URL,
    logo: `${SITE_URL}/thankful-logo.png`,
    description:
      "Thai-language AI, business, science and technology news and explainers by Thank Thanedpol — on the web and on YouTube.",
    founder: { "@type": "Person", name: NAME, alternateName: [ALT_NAME, NAME_TH], url: SITE_URL },
    sameAs: [YT_CHANNEL_URL],
    knowsAbout: KNOWS_ABOUT,
  };
}

/**
 * The YouTube series as an ItemList of CreativeWorkSeries, each carrying its
 * newest episode as a VideoObject. Plain, crawlable facts about what the
 * channel covers — the kind of thing an answer engine quotes.
 */
export function youtubeSeriesJsonLd(series: SeriesFeed[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${BRAND} YouTube series`,
    url: `${SITE_URL}/#youtube`,
    itemListElement: series.map((s, i) => {
      const v = s.videos[0];
      return {
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "CreativeWorkSeries",
          name: s.title,
          description: s.blurb,
          url: `https://www.youtube.com/playlist?list=${s.playlistId}`,
          inLanguage: "th",
          author: { "@id": `${SITE_URL}/#brand` },
          ...(v && {
            hasPart: {
              "@type": "VideoObject",
              name: v.title,
              description: `${s.title}: ${v.title}`,
              thumbnailUrl: `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`,
              uploadDate: v.published,
              contentUrl: `https://www.youtube.com/watch?v=${v.id}`,
              embedUrl: `https://www.youtube.com/embed/${v.id}`,
            },
          }),
        },
      };
    }),
  };
}

export function blogPostingJsonLd(post: BlogPost | BlogPreview) {
  const url = `${SITE_URL}/blog/${post.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt ?? undefined,
    image: post.cover_image_url ?? `${SITE_URL}/opengraph-image`,
    datePublished: post.published_at ?? undefined,
    dateModified: post.published_at ?? undefined,
    url,
    mainEntityOfPage: url,
    inLanguage: "th",
    keywords: post.tags?.join(", ") || undefined,
    articleSection: post.tags?.[0] || undefined,
    author: { "@type": "Person", name: NAME, url: SITE_URL },
    publisher: { "@type": "Person", name: NAME, url: SITE_URL },
  };
}

// ── FAQ — helps answer engines (AEO/GEO) understand the site's entity. The
// same items are exported so a visible FAQ section can stay in sync if added.
export const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "Thank Thanedpol คือใคร?",
    a: "Thank Thanedpol คือคุณแต้ง ธเนศพล เดชาดวงสกุล (Thanedpol Dechaduangsakul) คอนเทนต์ครีเอเตอร์ที่เล่าข่าว AI ธุรกิจ วิทยาศาสตร์และเทคโนโลยี ทั้งในไทยและต่างประเทศ ให้เข้าใจง่ายและนำไปใช้ได้จริง ปัจจุบันเป็นทีมข่าวเทคโนโลยีและ AI ของ Insightist AI Transformation Thailand",
  },
  {
    q: "Thank Thanedpol ชื่อภาษาไทยสะกดอย่างไร?",
    a: "ชื่อจริง ธเนศพล นามสกุล เดชาดวงสกุล ชื่อเล่น แต้ง — ภาษาอังกฤษเขียนว่า Thank Thanedpol หรือ Thanedpol Dechaduangsakul",
  },
  {
    q: "บล็อกนี้มีเนื้อหาเกี่ยวกับอะไร?",
    a: "ข่าวและบทความด้านปัญญาประดิษฐ์ (AI) ธุรกิจ วิทยาศาสตร์และเทคโนโลยี อัปเดตความเคลื่อนไหวใหม่ ๆ ทั้งในไทยและทั่วโลก แบบเข้าใจง่ายและทันเหตุการณ์",
  },
  {
    q: "อ่านบทความเป็นภาษาอะไรได้บ้าง?",
    a: "อ่านได้ 3 ภาษา — ไทย อังกฤษ และจีน (ตัวย่อ) สลับภาษาได้จากปุ่มเปลี่ยนภาษามุมขวาบนของเว็บ",
  },
  {
    q: "ติดต่อหรือร่วมงานกับ Thank Thanedpol ได้อย่างไร?",
    a: "ติดต่อผ่านฟอร์มติดต่อบนเว็บไซต์ หรืออีเมล thank.2643@gmail.com และดูข้อมูลสำหรับสื่อได้ที่หน้า Press Kit",
  },
];

export function faqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

const PERSON_REF = { "@type": "Person", name: NAME, url: SITE_URL } as const;
const strip = (s?: string | null) => (s ? s.replace(/<[^>]*>/g, "").trim() : undefined);

/** Breadcrumb trail — helps engines understand where a page sits in the site. */
export function breadcrumbJsonLd(crumbs: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: `${SITE_URL}${c.path}`,
    })),
  };
}

/** The /blog index — a Blog listing its recent posts. */
export function blogListJsonLd(posts: BlogPreview[]) {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: `${NAME} — Blog`,
    url: `${SITE_URL}/blog`,
    description: "Articles on AI, business, science and technology.",
    inLanguage: ["th", "en", "zh"],
    publisher: PERSON_REF,
    blogPost: posts.slice(0, 20).map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      url: `${SITE_URL}/blog/${p.slug}`,
      datePublished: p.published_at ?? undefined,
      image: p.cover_image_url ?? undefined,
    })),
  };
}

/** The /press-kit page — a ProfilePage about the person. */
export function profilePageJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: `${SITE_URL}/press-kit`,
    name: `${NAME} — Press Kit`,
    mainEntity: PERSON_REF,
  };
}

/** A portfolio collection page (Snobby Story, Insightist, …). */
export function collectionPageJsonLd(c: {
  slug: string;
  title: string;
  intro?: string | null;
  category?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: c.title,
    url: `${SITE_URL}/portfolio/${c.slug}`,
    description: strip(c.intro),
    about: c.category || undefined,
    inLanguage: "th",
    isPartOf: { "@type": "WebSite", name: `${NAME} — Portfolio & Blog`, url: SITE_URL },
    author: PERSON_REF,
    creator: PERSON_REF,
  };
}

/** A single portfolio work/event within a collection. */
export function creativeWorkJsonLd(opts: {
  title: string;
  path: string;
  description?: string | null;
  image?: string | null;
  partOf?: { name: string; path: string };
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: opts.title,
    url: `${SITE_URL}${opts.path}`,
    description: strip(opts.description),
    image: opts.image || undefined,
    inLanguage: "th",
    author: PERSON_REF,
    creator: PERSON_REF,
    isPartOf: opts.partOf
      ? { "@type": "CollectionPage", name: opts.partOf.name, url: `${SITE_URL}${opts.partOf.path}` }
      : undefined,
  };
}
