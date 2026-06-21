import type {
  Portfolio,
  BlogPreview,
  BlogPost,
  SiteProfile,
  PressKit,
} from "@/lib/types";

/**
 * Demo content used as a FALLBACK when Supabase isn't configured yet
 * (env still on the placeholder values). Lets the whole public site be
 * previewed/design-reviewed with no backend. Never used once real
 * NEXT_PUBLIC_SUPABASE_URL credentials are set.
 */
export function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  return (
    !!url &&
    !!key &&
    !url.includes("placeholder") &&
    key !== "placeholder" &&
    url.startsWith("http")
  );
}

export const demoProfile: SiteProfile = {
  id: 1,
  name: "Thank Thanedpol",
  headline: "Content Creator ทำข่าว AI & Business ทั้งไทยและต่างประเทศ · SCI & Technology",
  long_bio:
    "ครีเอเตอร์สายข่าว AI และธุรกิจ เล่าเรื่องวิทยาศาสตร์ เทคโนโลยีและความเคลื่อนไหวทางธุรกิจทั้งในไทยและต่างประเทศ ให้เข้าใจง่าย ทันเหตุการณ์ และนำไปใช้ได้จริง",
  avatar_url: "/profile/thank.png",
  background_reel_url: null,
  social_links: {
    github: "https://github.com/",
    linkedin: "https://linkedin.com/in/",
    x: "https://x.com/",
    email: "thank@example.com",
  },
};

export const demoPortfolio: Portfolio[] = [
  { id: "vw1", title: "Video Editor — Y.E.M. Young Executive Management", description: "Internship social activity at Y.E.M. Young Executive Management (Allianz Ayudhya). Video editor for content on practical life skills — capturing the internship atmosphere and interviews.", tech_tags: ["Video Editing", "Storytelling", "Social Content"], category: "Video", featured: true, display_order: 1, thumbnail_url: "/portfolio/yem-internship.svg", project_url: "https://fb.watch/q7dPzSPYiK/", created_at: "" },
  { id: "vw2", title: "Siam Global Group — SUMO Service", description: "End-to-end video production for SUMO tool-repair content, pre to post. Lighting setup (brightness & angle), camera framing, set & background dressing, briefing technicians on script & storytelling, scene-by-scene shooting, editing in CapCut, and publishing to TikTok with captions and post copy.", tech_tags: ["CapCut", "TikTok", "Videography", "Lighting"], category: "Video", featured: true, display_order: 2, thumbnail_url: "/portfolio/sumo-service.svg", project_url: null, created_at: "" },
  { id: "vw3", title: "Snobby Story", description: "นิทานสอนใจ ดีๆ ที่จะช่วยให้เด็กเติบโตไปอย่างมั่นคง — ใช้ AI สร้างการ์ตูนนิทานสอนใจสำหรับเด็ก", tech_tags: ["AI Cartoon", "Storytelling", "Kids"], category: "Video", featured: true, display_order: 3, thumbnail_url: "/portfolio/snobby-story.jpg", project_url: "/portfolio/snobby-story", created_at: "" },
];

export const demoBlogPreviews: BlogPreview[] = [
  { id: "b1", slug: "why-agents-beat-pipelines", title: "Why Agents Beat Pipelines", excerpt: "A practical look at why autonomous agent loops outperform rigid pipelines for open-ended work.", cover_image_url: "https://picsum.photos/seed/post1/1200/630", tags: ["AI", "Agents"], is_public: true, published_at: "2026-05-01", created_at: "" },
  { id: "b2", slug: "hidden-cost-of-context-windows", title: "The Hidden Cost of Context Windows", excerpt: "Members-only deep dive into the economics of long-context inference and how to budget tokens.", cover_image_url: "https://picsum.photos/seed/post2/1200/630", tags: ["AI", "Economics"], is_public: false, published_at: "2026-04-18", created_at: "" },
  { id: "b3", slug: "interfaces-2049", title: "Designing Interfaces for the Year 2049", excerpt: "How sci-fi aesthetics inform real product decisions — and where they break down.", cover_image_url: "https://picsum.photos/seed/post3/1200/630", tags: ["Design", "Future"], is_public: true, published_at: "2026-03-30", created_at: "" },
];

export const demoBlogPosts: Record<string, BlogPost> = {
  "why-agents-beat-pipelines": { ...demoBlogPreviews[0], body: "<p>Pipelines assume you know the shape of the problem in advance. Agents do not — they decide the next step from the current state, which is exactly what open-ended work demands.</p><p>This is a public post — anyone can read the full body.</p>", status: "published" },
  "interfaces-2049": { ...demoBlogPreviews[2], body: "<p>Cyberpunk UI looks great in trailers. Shipping it is another matter — readability, accessibility, and performance all push back against the aesthetic.</p>", status: "published" },
  // 'hidden-cost-of-context-windows' is member-only → body withheld in demo too.
};

export const demoPressKit: PressKit = {
  id: 1,
  short_bio:
    "Thank Thanedpol is an AI engineer and researcher working at the frontier of applied machine intelligence.",
  long_bio:
    "Thank Thanedpol is an AI engineer and researcher. His work focuses on large language models, autonomous agents, and the design of AI systems that augment human capability. He speaks and writes about the future of intelligent software.",
  headshot_url: null,
  logo_files: [
    { label: "Logo — SVG (light)", file_url: "logos/tt-light.svg" },
    { label: "Logo — PNG (dark)", file_url: "logos/tt-dark.png" },
  ],
  awards: ["Featured Speaker — AI Frontiers 2025", "Top AI Builder Award 2024"],
  media_contact_email: "press@example.com",
  downloadable_kit_pdf_url: "kit/press-kit.pdf",
};
