"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useApp } from "@/components/providers/AppProvider";
import { YT_CHANNEL_URL, type SeriesFeed } from "@/lib/youtube";
import type { BlogPreview } from "@/lib/types";

/**
 * "Latest updates" strip under the hero: the newest episodes across every
 * series plus the newest article, in date order. The channel uploads far more
 * often than the blog, so the newest article always gets one slot rather than
 * being pushed off the end — the strip shows both sides of the work.
 */

interface Item {
  key: string;
  kind: "video" | "post";
  title: string;
  label: string;
  date: string;
  href: string;
  image: string | null;
  external: boolean;
}

const VIDEO_SLOTS = 3;

function buildItems(series: SeriesFeed[], posts: BlogPreview[], articleLabel: string): Item[] {
  const seen = new Set<string>();
  const videos: Item[] = [];
  for (const s of series)
    for (const v of s.videos) {
      if (seen.has(v.id)) continue; // a video posted to two playlists counts once
      seen.add(v.id);
      videos.push({
        key: `v-${v.id}`,
        kind: "video",
        title: v.title,
        label: s.title,
        date: v.published,
        href: `https://www.youtube.com/watch?v=${v.id}`,
        image: `https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`,
        external: true,
      });
    }
  videos.sort((a, b) => b.date.localeCompare(a.date));

  const post = [...posts].sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? ""))[0];
  const items = videos.slice(0, VIDEO_SLOTS);
  if (post)
    items.push({
      key: `p-${post.id}`,
      kind: "post",
      title: post.title,
      label: articleLabel,
      date: post.published_at ?? "",
      href: `/blog/${post.slug}`,
      image: post.cover_image_url,
      external: false,
    });
  return items.sort((a, b) => b.date.localeCompare(a.date));
}

/** A date in Bangkok time — identical on the server and in the browser. */
const absolute = (iso: string, locale: string) =>
  iso
    ? new Date(iso).toLocaleDateString(locale === "th" ? "th-TH" : locale === "zh" ? "zh-CN" : "en-GB", {
        day: "numeric",
        month: "short",
        timeZone: "Asia/Bangkok",
      })
    : "";

function relative(iso: string, locale: string, now: number) {
  const diff = (Date.parse(iso) - now) / 1000;
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [
    ["minute", 60],
    ["hour", 3600],
    ["day", 86400],
    ["week", 604800],
    ["month", 2629800],
  ];
  if (Math.abs(diff) < 3600) return rtf.format(Math.round(diff / 60), "minute");
  for (let i = steps.length - 1; i >= 0; i--) {
    const [unit, sec] = steps[i];
    if (Math.abs(diff) >= sec) return rtf.format(Math.round(diff / sec), unit);
  }
  return rtf.format(0, "minute");
}

export default function LatestUpdates({ series, posts }: { series: SeriesFeed[]; posts: BlogPreview[] }) {
  const { t, locale } = useApp();
  const items = useMemo(() => buildItems(series, posts, t("latest.article")), [series, posts, t]);
  // Relative times ("3 hours ago") only after mount: the server can't know the
  // reader's clock, and rendering them there would mismatch on hydration.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  if (items.length === 0) return null;

  return (
    <section aria-labelledby="latest-heading" className="relative mx-auto -mt-10 max-w-7xl px-6 pb-6">
      <div className="space-plate flex flex-col gap-4 !p-4 sm:!p-5 lg:flex-row lg:items-center">
        <div className="flex shrink-0 items-center gap-3 lg:w-44">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan/40 text-cyan shadow-[0_0_18px_rgb(var(--accent)/0.3)]">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
              <path d="M13 2 4 14h7l-1 8 9-12h-7z" />
            </svg>
          </span>
          <h2 id="latest-heading" className="font-display text-lg font-bold text-ink">
            {t("latest.heading")}
          </h2>
        </div>

        <ul className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-1 lg:grid lg:flex-1 lg:grid-cols-4 lg:overflow-visible lg:pb-0">
          {items.map((it) => {
            const inner = (
              <>
                <span className="relative aspect-video w-24 shrink-0 overflow-hidden rounded-lg bg-surface/10">
                  {it.image && (
                    <Image src={it.image} alt="" fill unoptimized sizes="96px" className="object-cover" />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-mono text-[10px] uppercase tracking-wider text-cyan">
                    {it.label}
                  </span>
                  <span className="line-clamp-2 text-xs font-medium leading-snug text-ink">{it.title}</span>
                  <span className="mt-0.5 block font-mono text-[10px] text-muted" suppressHydrationWarning>
                    {now && it.date ? relative(it.date, locale, now) : absolute(it.date, locale)}
                  </span>
                </span>
              </>
            );
            const cls =
              "flex h-full w-[16.5rem] snap-start items-center gap-3 rounded-xl p-2 transition-colors hover:bg-ink/5 lg:w-auto";
            return (
              <li key={it.key} className="shrink-0 lg:shrink">
                {it.external ? (
                  <a href={it.href} target="_blank" rel="noopener noreferrer" className={cls}>
                    {inner}
                  </a>
                ) : (
                  <Link href={it.href} className={cls}>
                    {inner}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>

        <a
          href={YT_CHANNEL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 self-start rounded-full border border-line/15 px-4 py-2 text-xs font-medium text-ink transition-colors hover:border-cyan/50 hover:text-cyan lg:self-center"
        >
          {t("latest.all")} →
        </a>
      </div>
    </section>
  );
}
