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
  headline:
    "AI Engineer & Researcher — building intelligent systems from the future",
  long_bio:
    "I design and ship AI systems at the intersection of research and product. My work spans large language models, autonomous agents, and human-centred machine intelligence. I believe the most powerful technology feels inevitable — quiet, precise, and a little bit like science fiction.",
  avatar_url: null,
  background_reel_url: null,
  social_links: {
    github: "https://github.com/",
    linkedin: "https://linkedin.com/in/",
    x: "https://x.com/",
    email: "thank@example.com",
  },
};

export const demoPortfolio: Portfolio[] = [
  { id: "d1", title: "Neural Agent Orchestrator", description: "A multi-agent runtime that coordinates autonomous LLM workers across long-horizon tasks.", tech_tags: ["TypeScript", "LangGraph", "Postgres"], category: "AI", featured: true, display_order: 1, thumbnail_url: "https://picsum.photos/seed/agent/800/600", project_url: "https://example.com", created_at: "" },
  { id: "d2", title: "Synaptic — Realtime ML Dashboard", description: "Streaming inference observability with sub-second latency visualisation.", tech_tags: ["Next.js", "WebGL", "Rust"], category: "Web", featured: true, display_order: 2, thumbnail_url: "https://picsum.photos/seed/synaptic/800/600", project_url: "https://example.com", created_at: "" },
  { id: "d3", title: "Glitch UI Kit", description: "A cyberpunk design system with motion primitives and shader-driven components.", tech_tags: ["Figma", "Framer", "GLSL"], category: "Design", featured: true, display_order: 3, thumbnail_url: "https://picsum.photos/seed/glitch/800/600", project_url: "https://example.com", created_at: "" },
  { id: "d4", title: "Vision Transformer Playground", description: "Interactive notebook for probing attention maps in vision transformers.", tech_tags: ["Python", "PyTorch", "Jupyter"], category: "AI", featured: true, display_order: 4, thumbnail_url: "https://picsum.photos/seed/vit/800/600", project_url: "https://example.com", created_at: "" },
  { id: "d5", title: "Quantum Notes", description: "A research-grade note tool with bidirectional links and local-first sync.", tech_tags: ["Svelte", "SQLite", "CRDT"], category: "Web", featured: true, display_order: 5, thumbnail_url: "https://picsum.photos/seed/quantum/800/600", project_url: "https://example.com", created_at: "" },
  { id: "d6", title: "Aurora Render Engine", description: "Experimental WebGPU renderer for volumetric sci-fi environments.", tech_tags: ["WebGPU", "WGSL", "TypeScript"], category: "Other", featured: true, display_order: 6, thumbnail_url: "https://picsum.photos/seed/aurora/800/600", project_url: "https://example.com", created_at: "" },
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
