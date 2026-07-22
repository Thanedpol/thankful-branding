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

/**
 * AI tools we write about. A post "mentions" a tool when any alias appears
 * (whole-word, case-insensitive) in its title + excerpt + tags + slug. Only
 * tools with ≥1 matching post are shown, so this list can safely hold tools we
 * haven't covered yet. Add aliases to catch more spellings; `color` is the
 * brand accent used for the chip's icon and active state.
 */
type AiTool = { key: string; label: string; color: string; aliases: string[] };

const AI_TOOLS: AiTool[] = [
  { key: "claude", label: "Claude", color: "#D97757", aliases: ["claude", "anthropic"] },
  { key: "chatgpt", label: "ChatGPT", color: "#10A37F", aliases: ["chatgpt", "openai", "gpt"] },
  { key: "gemini", label: "Gemini", color: "#4C8DF6", aliases: ["gemini", "bard"] },
  { key: "grok", label: "Grok", color: "#AEB6C2", aliases: ["grok"] },
  { key: "llama", label: "Llama", color: "#4A8CFF", aliases: ["llama"] },
  { key: "deepseek", label: "DeepSeek", color: "#4D6BFE", aliases: ["deepseek"] },
  { key: "mistral", label: "Mistral", color: "#FF7000", aliases: ["mistral"] },
  { key: "qwen", label: "Qwen", color: "#7B5CFF", aliases: ["qwen"] },
  { key: "perplexity", label: "Perplexity", color: "#22B8CD", aliases: ["perplexity"] },
  { key: "copilot", label: "Copilot", color: "#6E9BF4", aliases: ["copilot"] },
  { key: "cursor", label: "Cursor", color: "#9CA3AF", aliases: ["cursor"] },
  { key: "n8n", label: "n8n", color: "#EA4B71", aliases: ["n8n"] },
  { key: "notebooklm", label: "NotebookLM", color: "#E8710A", aliases: ["notebooklm", "notebook lm"] },
  { key: "sora", label: "Sora", color: "#14B8A6", aliases: ["sora"] },
  { key: "midjourney", label: "Midjourney", color: "#9AA0AA", aliases: ["midjourney"] },
];

const TOOL_RE = new Map<string, RegExp>(
  AI_TOOLS.map((t) => [
    t.key,
    new RegExp(
      "\\b(" +
        t.aliases.map((a) => a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") +
        ")\\b",
      "i"
    ),
  ])
);

function postHaystack(p: BlogPreview) {
  return `${p.title} ${p.excerpt ?? ""} ${(p.tags ?? []).join(" ")} ${p.slug}`;
}

/** Small 4-point "AI spark" mark, tinted per brand via currentColor. */
function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden>
      <path d="M12 2l2.1 6.4a2 2 0 0 0 1.4 1.4L22 12l-6.5 2.2a2 2 0 0 0-1.4 1.4L12 22l-2.1-6.4a2 2 0 0 0-1.4-1.4L2 12l6.5-2.2a2 2 0 0 0 1.4-1.4z" />
    </svg>
  );
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
  const [activeTool, setActiveTool] = useState<string | null>(null); // AI tool key
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();

  // Post count per AI tool (across all posts, like the reference), newest-heavy
  // tools first. Only tools we've actually written about appear.
  const aiCounts = useMemo(
    () =>
      AI_TOOLS.map((tool) => {
        const re = TOOL_RE.get(tool.key)!;
        const count = posts.filter((p) => re.test(postHaystack(p))).length;
        return { tool, count };
      })
        .filter((x) => x.count > 0)
        .sort((a, b) => b.count - a.count),
    [posts]
  );

  const filtered = useMemo(() => {
    let list = posts;
    if (active) {
      const cat = CATEGORIES.find((c) => c.key === active);
      if (cat) list = list.filter((p) => postInCategory(p, cat));
    }
    if (activeTool) {
      const re = TOOL_RE.get(activeTool);
      if (re) list = list.filter((p) => re.test(postHaystack(p)));
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
  }, [posts, active, activeTool, q]);

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
            onClick={() => {
              setActive(null);
              setActiveTool(null);
            }}
            aria-pressed={active === null}
            className={chipCls(active === null)}
          >
            {t("blog.filter.all")}
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => {
                setActive(c.key);
                setActiveTool(null);
              }}
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

      {/* AI tools we've written about — click to filter to that tool's posts */}
      {aiCounts.length > 0 && (
        <div className="mt-6">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.25em] text-muted">
            {t("blog.aiTools")}
          </p>
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label={t("blog.aiTools")}
          >
            {aiCounts.map(({ tool, count }) => {
              const on = activeTool === tool.key;
              return (
                <button
                  key={tool.key}
                  type="button"
                  onClick={() => {
                    setActiveTool(on ? null : tool.key);
                    setActive(null);
                  }}
                  aria-pressed={on}
                  title={`${tool.label} · ${count} บทความ`}
                  style={
                    on
                      ? { borderColor: tool.color, backgroundColor: `${tool.color}1f` }
                      : undefined
                  }
                  className={`group flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 transition-colors ${
                    on
                      ? ""
                      : "border-line/10 bg-surface/[0.03] hover:border-line/25"
                  }`}
                >
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${tool.color}26`, color: tool.color }}
                  >
                    <SparkIcon />
                  </span>
                  <span className="text-sm font-medium text-ink/90">{tool.label}</span>
                  <span className="rounded-full bg-surface/10 px-1.5 py-0.5 font-mono text-[11px] text-muted">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* key on the active filters replays the reveal animation when switching
          (kept off `query` so the grid doesn't flicker while typing) */}
      <div
        key={`${active ?? "all"}|${activeTool ?? "all"}`}
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
