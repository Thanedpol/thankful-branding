"use client";

import { useMemo, useState } from "react";
import BlogCard from "@/components/BlogCard";
import Reveal from "@/components/Reveal";
import { useT } from "@/components/providers/AppProvider";
import type { BlogPreview } from "@/lib/types";

/**
 * Fixed top-level categories. A post belongs to a category when any of its
 * tags (case-insensitive) is listed in `tags`. Edit these lists to map new
 * tags into the right bucket — no schema change needed.
 */
type Category = { key: string; labelKey: string; tags: string[] };

const CATEGORIES: Category[] = [
  {
    key: "ai",
    labelKey: "blog.cat.ai",
    tags: ["ai", "agents", "agent", "llm", "ml", "machine learning", "gpt", "automation", "neural", "deep learning"],
  },
  {
    key: "technology",
    labelKey: "blog.cat.technology",
    tags: ["technology", "tech", "software", "hardware", "design", "future", "web", "data", "engineering", "robotics", "internet", "gadget", "dev", "programming", "code"],
  },
  {
    key: "science",
    labelKey: "blog.cat.science",
    tags: ["science", "earth", "space", "physics", "biology", "paleontology", "climate", "nature", "research", "health", "medicine", "chemistry", "astronomy", "evolution"],
  },
  {
    key: "business",
    labelKey: "blog.cat.business",
    tags: ["business", "economics", "economy", "finance", "startup", "marketing", "strategy", "investment", "crypto", "management", "money"],
  },
];

function postInCategory(post: BlogPreview, cat: Category) {
  const tags = (post.tags ?? []).map((t) => t.toLowerCase());
  return tags.some((t) => cat.tags.includes(t));
}

/** Blog grid with fixed category filters and a title/tag search box.
 *  `withSidebar` caps the grid at two columns so it fits beside a side rail. */
export default function BlogList({
  posts,
  withSidebar = false,
}: {
  posts: BlogPreview[];
  withSidebar?: boolean;
}) {
  const t = useT();
  const [active, setActive] = useState<string | null>(null); // category key, or null = all
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    let list = posts;
    if (active) {
      const cat = CATEGORIES.find((c) => c.key === active);
      if (cat) list = list.filter((p) => postInCategory(p, cat));
    }
    if (q) {
      list = list.filter((p) =>
        [p.title, p.excerpt, ...(p.tags ?? [])]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }
    return list;
  }, [posts, active, q]);

  if (posts.length === 0) {
    return (
      <p className="mt-12 font-mono text-sm text-muted">{t("blog.empty")}</p>
    );
  }

  const chipCls = (isActive: boolean) =>
    `blog-chip rounded-full border px-4 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors ${
      isActive
        ? "border-cyan/60 bg-cyan/15 text-cyan"
        : "border-line/10 text-muted hover:border-cyan/40 hover:text-cyan"
    }`;

  return (
    <>
      <div className="mt-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Fixed category filters */}
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label={t("blog.filter.label")}
        >
          <button
            type="button"
            onClick={() => setActive(null)}
            aria-pressed={active === null}
            className={chipCls(active === null)}
          >
            {t("blog.filter.all")}
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setActive(c.key)}
              aria-pressed={active === c.key}
              className={chipCls(active === c.key)}
            >
              {t(c.labelKey)}
            </button>
          ))}
        </div>

        {/* Search by title or tag */}
        <div className="relative w-full shrink-0 lg:w-72">
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("blog.search.placeholder")}
            aria-label={t("blog.search.placeholder")}
            className="w-full rounded-full border border-line/10 bg-surface/[0.04] py-2 pl-10 pr-4 font-mono text-xs text-ink outline-none transition-colors placeholder:text-muted focus:border-cyan/50"
          />
        </div>
      </div>

      {/* key on `active` replays the reveal animation when switching category
          (kept off `query` so the grid doesn't flicker while typing) */}
      <div
        key={active ?? "__all"}
        className={`mt-8 grid gap-6 pb-24 sm:grid-cols-2 ${
          withSidebar ? "" : "lg:grid-cols-3"
        }`}
      >
        {filtered.length === 0 ? (
          <p className="font-mono text-sm text-muted">
            {q ? t("blog.search.none") : t("blog.filter.none")}
          </p>
        ) : (
          filtered.map((post, i) => (
            <Reveal key={post.id} delay={i * 60} className="h-full">
              <BlogCard post={post} />
            </Reveal>
          ))
        )}
      </div>
    </>
  );
}
