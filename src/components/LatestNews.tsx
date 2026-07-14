"use client";

import Link from "next/link";
import { useApp, useT } from "@/components/providers/AppProvider";
import type { BlogPreview } from "@/lib/types";

const MONTHS_TH = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
];

/** Locale-aware short date. Thai uses พ.ศ. (Buddhist year), like Thai news sites. */
function formatDate(iso: string | null, locale: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  if (locale === "th") {
    return `${d.getDate()} ${MONTHS_TH[d.getMonth()]} ${d.getFullYear() + 543}`;
  }
  return d.toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * "Latest News" side rail — a compact, chronological feed of the newest posts.
 * Inspired by news-site sidebars (e.g. Bangkok Biznews) but rendered in the
 * site's own neon/glass identity: a live-pulse dot, mono index numbers, and a
 * gradient header, so it reads as a cyber transmission feed rather than a plain
 * headline list. Reuses the same locale-aware title logic as BlogCard.
 */
export default function LatestNews({ posts }: { posts: BlogPreview[] }) {
  const t = useT();
  const { locale } = useApp();
  if (!posts.length) return null;

  return (
    <aside className="self-start lg:sticky lg:top-28" aria-label={t("blog.latest")}>
      <div className="glass overflow-hidden">
        {/* Header — live pulse + gradient label */}
        <div className="flex items-center gap-2.5 border-b border-line/[0.08] px-5 py-4">
          <span className="relative flex h-2 w-2" aria-hidden>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan/70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan" />
          </span>
          <h2 className="text-gradient font-mono text-sm font-bold uppercase tracking-[0.2em]">
            {t("blog.latest")}
          </h2>
        </div>

        {/* Feed */}
        <ol className="divide-y divide-line/[0.06]">
          {posts.map((post, i) => {
            const tr =
              locale !== "th"
                ? post.translations?.[locale as "en" | "zh"]
                : undefined;
            const title = tr?.title?.trim() ? tr.title : post.title;
            return (
              <li key={post.id}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="group flex gap-3 px-5 py-3.5 transition-colors hover:bg-cyan/[0.04]"
                >
                  <span className="mt-px font-mono text-xs font-bold tabular-nums text-cyan/50 transition-colors group-hover:text-cyan">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-ink/90 transition-colors group-hover:text-cyan">
                      {title}
                    </h3>
                    <div className="mt-1.5 flex items-center gap-1.5 font-mono text-[11px] text-muted">
                      <svg
                        width="11"
                        height="11"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden
                      >
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 7v5l3 2" />
                      </svg>
                      {formatDate(post.published_at, locale)}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ol>

        {/* Footer link */}
        <Link
          href="/blog"
          className="flex items-center justify-center border-t border-line/[0.08] px-5 py-3.5 font-mono text-xs uppercase tracking-wider text-cyan transition-colors hover:bg-cyan/[0.06]"
        >
          {t("blog.latest.all")}
        </Link>
      </div>
    </aside>
  );
}
