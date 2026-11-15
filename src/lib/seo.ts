import type { SiteProfile, BlogPost, BlogPreview } from "@/lib/types";
import { YT_CHANNEL_URL, SERIES, type SeriesFeed } from "@/lib/youtube";
import { SOCIAL_PROFILES, LINKEDIN_URL, GITHUB_URL } from "@/lib/social";

/** Canonical site URL (no trailing slash). Set NEXT_PUBLIC_SITE_URL in prod. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://thankful-branding.vercel.app"
).replace(/\/$/, "");

const NAME = "Thank Thanedpol";
export const SITE_TITLE = "Thank Thanedpol — AI, Business & Technology News";
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
// ── Stable node ids. Every page's structured data points at the same person,
// brand and website through these, so engines merge them into one entity
// instead of reading a dozen unrelated "Person" objects. ─────────────────────
export const PERSON_ID = `${SITE_URL}/#person`;
export const BRAND_ID = `${SITE_URL}/#brand`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
const PERSON_LINK = { "@id": PERSON_ID };

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

export const CREDENTIALS: { name: string; by: string }[] = [
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
    GITHUB_URL,
    LINKEDIN_URL,
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
    "@id": PERSON_ID,
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
    brand: { "@id": BRAND_ID },
    mainEntityOfPage: `${SITE_URL}/about`,
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
    "@id": WEBSITE_ID,
    name: `${NAME} — Portfolio & Blog`,
    alternateName: [BRAND, "Thankful Branding"],
    url: SITE_URL,
    inLanguage: ["th", "en", "zh"],
    description: SITE_DESCRIPTION,
    publisher: PERSON_LINK,
    author: PERSON_LINK,
    about: { "@id": BRAND_ID },
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
    "@id": BRAND_ID,
    name: BRAND,
    alternateName: ["Thankful Branding", "Thankful2026"],
    url: SITE_URL,
    logo: `${SITE_URL}/thankful-logo.png`,
    description:
      "Thai-language AI, business, science and technology news and explainers by Thank Thanedpol — on the web and on YouTube.",
    founder: PERSON_LINK,
    // The channel and the TikTok account both carry the brand's own name.
    sameAs: [YT_CHANNEL_URL, ...SOCIAL_PROFILES.filter((p) => p.platform === "tiktok").map((p) => p.url)],
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
          author: { "@id": BRAND_ID },
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
    author: PERSON_REF,
    publisher: PERSON_REF,
    isPartOf: { "@id": WEBSITE_ID },
  };
}

// ── FAQ — helps answer engines (AEO/GEO) understand the site's entity. The
// same items are exported so a visible FAQ section can stay in sync if added.
export const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "Thank Thanedpol คือใคร?",
    a: "Thank Thanedpol คือคุณแต้ง ธเนศพล เดชาดวงสกุล (Thanedpol Dechaduangsakul) คอนเทนต์ครีเอเตอร์ที่เล่าข่าว AI ธุรกิจ วิทยาศาสตร์และเทคโนโลยีเป็นภาษาไทย ทั้งในไทยและต่างประเทศ ให้เข้าใจง่ายและนำไปใช้ได้จริง ทำช่อง YouTube ชื่อ Thankful (@Thankful2026) และเป็นทีมข่าวเทคโนโลยีและ AI ของ Insightist AI Transformation Thailand",
  },
  {
    q: "Thank Thanedpol ชื่อภาษาไทยสะกดอย่างไร?",
    a: "ชื่อจริง ธเนศพล นามสกุล เดชาดวงสกุล ชื่อเล่น แต้ง (คุณแต้ง) — ภาษาอังกฤษเขียนว่า Thank Thanedpol หรือ Thanedpol Dechaduangsakul",
  },
  {
    q: "ช่อง YouTube ของ Thank Thanedpol มีซีรีส์อะไรบ้าง?",
    a: `ช่อง Thankful (@Thankful2026) มี ${SERIES.length} ซีรีส์ ได้แก่ ${SERIES.map((x) => x.title).join(", ")} — ดูทั้งหมดได้ที่ ${YT_CHANNEL_URL}`,
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
    q: "ติดต่อหรือจ้างงาน Thank Thanedpol ได้อย่างไร?",
    a: "ดูตัวอย่างผลงานได้ที่หัวข้อ \"รับงาน\" บนหน้าแรก แล้วติดต่อทางอีเมล thank.2643@gmail.com หรือ LinkedIn ส่วนข้อมูลสำหรับสื่อ (ประวัติ รูป โลโก้) อยู่ที่หน้า Press Kit",
  },
];

export function faqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${SITE_URL}/#faq`,
    isPartOf: { "@id": HOME_PAGE_ID },
    mainEntity: FAQ_ITEMS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

const PERSON_REF = { "@type": "Person", "@id": PERSON_ID, name: NAME, url: `${SITE_URL}/about` } as const;
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
    isPartOf: { "@id": WEBSITE_ID },
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
    isPartOf: { "@id": WEBSITE_ID },
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

// ── Answer-first passages ────────────────────────────────────────────────────
// One self-contained paragraph that answers "who is Thank Thanedpol?" with
// checkable facts, in the shape answer engines lift whole (≈40–80 words).
// Shown on the home page (About) and on /about, and marked speakable.

export const WHO_IS_TH = `Thank Thanedpol หรือคุณแต้ง ธเนศพล เดชาดวงสกุล (Thanedpol Dechaduangsakul) เป็นคอนเทนต์ครีเอเตอร์ที่เล่าข่าว AI และธุรกิจเป็นภาษาไทย ทั้งข่าวในไทยและต่างประเทศ ให้เข้าใจง่าย ทันเหตุการณ์ และนำไปใช้ได้จริง คุณแต้งทำช่อง YouTube ชื่อ Thankful (@Thankful2026) ที่มี ${SERIES.length} ซีรีส์ เช่น AI ฉับไว News, AI Apps และ Physical AI & Robotics News เขียนบทความบนเว็บนี้ซึ่งอ่านได้ 3 ภาษา และทำงานในทีมข่าวเทคโนโลยีและ AI ของ Insightist AI Transformation Thailand`;

export const WHO_IS_EN = `Thank Thanedpol (Thanedpol Dechaduangsakul; Thai: ธเนศพล เดชาดวงสกุล, nickname แต้ง) is a Thai content creator who explains AI and business news in Thai, from Thailand and around the world, so that it is clear, timely and useful. Thank runs the Thankful YouTube channel (@Thankful2026) with ${SERIES.length} series, including AI ฉับไว News, AI Apps and Physical AI & Robotics News, writes the articles on this site in 3 languages, and works on the technology and AI news team at Insightist AI Transformation Thailand.`;

export const WHO_IS_ZH = `Thank Thanedpol（Thanedpol Dechaduangsakul，泰文名 ธเนศพล เดชาดวงสกุล，昵称 แต้ง）是一位泰国内容创作者，用泰语讲解泰国及全球的 AI 与商业新闻，力求清晰、及时、实用。Thank 运营 YouTube 频道 Thankful（@Thankful2026），共有 ${SERIES.length} 个系列，包括 AI ฉับไว News、AI Apps 和 Physical AI & Robotics News；在本站撰写可用 3 种语言阅读的文章，并任职于 Insightist AI Transformation Thailand 的科技与 AI 新闻团队。`;

export type WhoIs = { th: string; en: string; zh: string };
export const WHO_IS: WhoIs = { th: WHO_IS_TH, en: WHO_IS_EN, zh: WHO_IS_ZH };

/** When the /about facts and the legal pages were last reviewed. */
export const ABOUT_UPDATED = "2026-11-15";
export const LEGAL_UPDATED = "2026-11-15";

const HOME_PAGE_ID = `${SITE_URL}/#webpage`;

/** The home page itself: about the person, part of the website, dated by its
 *  newest episode or article, with the answer-first passage marked speakable. */
export function homePageJsonLd(dateModified?: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": HOME_PAGE_ID,
    url: `${SITE_URL}/`,
    name: SITE_TITLE,
    description: SITE_DESCRIPTION,
    inLanguage: "th",
    isPartOf: { "@id": WEBSITE_ID },
    about: PERSON_LINK,
    mainEntity: PERSON_LINK,
    author: PERSON_LINK,
    primaryImageOfPage: `${SITE_URL}/opengraph-image`,
    dateModified,
    speakable: { "@type": "SpeakableSpecification", cssSelector: ["#who-is-thank", "#faq"] },
  };
}

/** /about — the fact page for the person. */
export function aboutPageJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "@id": `${SITE_URL}/about#webpage`,
    url: `${SITE_URL}/about`,
    name: `เกี่ยวกับ ${NAME} (${NAME_TH})`,
    inLanguage: ["th", "en"],
    isPartOf: { "@id": WEBSITE_ID },
    about: PERSON_LINK,
    mainEntity: PERSON_LINK,
    dateModified: ABOUT_UPDATED,
    speakable: { "@type": "SpeakableSpecification", cssSelector: ["#who-is-thank"] },
  };
}

/** /privacy and /terms. */
export function legalPageJsonLd(path: string, name: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${SITE_URL}${path}#webpage`,
    url: `${SITE_URL}${path}`,
    name,
    inLanguage: "th",
    isPartOf: { "@id": WEBSITE_ID },
    publisher: PERSON_LINK,
    dateModified: LEGAL_UPDATED,
  };
}

/** Several nodes as one JSON-LD @graph, so the @id links resolve in one place. */
export function jsonLdGraph(nodes: Record<string, unknown>[]) {
  return {
    "@context": "https://schema.org",
    "@graph": nodes.map(({ "@context": _ctx, ...node }) => node),
  };
}
