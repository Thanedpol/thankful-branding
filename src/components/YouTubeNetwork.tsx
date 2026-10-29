"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Reveal from "./Reveal";
import { useT } from "@/components/providers/AppProvider";
import {
  THEME_LINKS,
  YT_CHANNEL_URL,
  YT_SUBSCRIBE_URL,
  type SeriesFeed,
  type SeriesGroup,
  type SharedLink,
  type Video,
} from "@/lib/youtube";

/**
 * Thankful's YouTube series drawn as a constellation: the channel at the hub,
 * every series a star around it, and lines between series a viewer would
 * naturally move between. Gold lines are editorial; cyan ones come from the
 * feeds themselves — a video posted to both playlists — so the network grows
 * on its own as episodes are cross-posted.
 *
 * Picking a star shows that series' newest episode, playable in place and set
 * to roll on through the playlist, plus its neighbours to watch next. Every
 * path leads to another series or the subscribe button: the network effect.
 */

const GROUP: Record<SeriesGroup, { label: string; ring: string; glow: string; line: string }> = {
  news: { label: "News", ring: "#5fb4ff", glow: "rgba(95,180,255,0.55)", line: "#5fb4ff" },
  learn: { label: "Learn", ring: "#ffcf73", glow: "rgba(255,207,115,0.55)", line: "#ffcf73" },
  event: { label: "Event", ring: "#c39bff", glow: "rgba(195,155,255,0.55)", line: "#c39bff" },
};

const thumb = (id: string, q: "mq" | "hq" | "maxres" = "hq") =>
  `https://i.ytimg.com/vi/${id}/${q}default.jpg`;

// Fixed time zone so the server render and the browser agree on the date.
const fmtDate = (iso: string) =>
  iso
    ? new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short", timeZone: "Asia/Bangkok" })
    : "";

/** Node positions on an ellipse around the hub, in % of the square stage. */
function layout(n: number) {
  return Array.from({ length: n }, (_, i) => {
    const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
    return { x: 50 + Math.cos(a) * 38, y: 50 + Math.sin(a) * 36 };
  });
}

export default function YouTubeNetwork({ series, shared }: { series: SeriesFeed[]; shared: SharedLink[] }) {
  const t = useT();
  const [activeId, setActiveId] = useState(series[0]?.id ?? "");
  const [playing, setPlaying] = useState<string | null>(null); // video id loaded in the player

  const pos = useMemo(() => layout(series.length), [series.length]);
  const index = useMemo(() => Object.fromEntries(series.map((s, i) => [s.id, i])), [series]);

  const links = useMemo(() => {
    const seen = new Set<string>();
    const out: { a: string; b: string; kind: "theme" | "shared"; count?: number }[] = [];
    for (const l of shared) {
      seen.add([l.a, l.b].sort().join("|"));
      out.push({ ...l, kind: "shared" });
    }
    for (const [a, b] of THEME_LINKS) {
      if (index[a] === undefined || index[b] === undefined) continue;
      if (!seen.has([a, b].sort().join("|"))) out.push({ a, b, kind: "theme" });
    }
    return out;
  }, [shared, index]);

  const active = series[index[activeId] ?? 0];
  const neighbours = useMemo(
    () =>
      links
        .filter((l) => l.a === activeId || l.b === activeId)
        .map((l) => series[index[l.a === activeId ? l.b : l.a]])
        .filter(Boolean),
    [links, activeId, series, index]
  );

  const latestUpload = useMemo(
    () =>
      series
        .flatMap((s) => s.videos.map((v) => v.published))
        .sort()
        .at(-1) ?? "",
    [series]
  );

  function pick(id: string) {
    setActiveId(id);
    setPlaying(null);
  }

  if (!active) return null;
  const lead: Video | undefined = active.videos.find((v) => v.id === playing) ?? active.videos[0];
  const rest = active.videos.filter((v) => v.id !== lead?.id).slice(0, 3);
  const g = GROUP[active.group];

  return (
    <section id="youtube" className="section-pad scroll-mt-20">
      <Reveal className="space-plate mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{t("yt.eyebrow")}</p>
          <h2 className="font-display text-3xl font-bold md:text-4xl text-gradient">{t("yt.heading")}</h2>
          <p className="mt-3 max-w-2xl text-muted">{t("yt.sub")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] text-white/70">
          <span>{series.length} ซีรีส์</span>
          {latestUpload && (
            <span>
              · {t("yt.updated")} {fmtDate(latestUpload)}
            </span>
          )}
          <a
            href={YT_SUBSCRIBE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 inline-flex items-center gap-2 rounded-full bg-[#ff0033] px-4 py-2 font-sans text-xs font-semibold text-white shadow-[0_0_24px_rgba(255,0,51,0.35)] transition-transform hover:scale-[1.03]"
          >
            <YtIcon className="h-3.5 w-3.5" /> {t("yt.subscribe")}
          </a>
        </div>
      </Reveal>

      <div className="grid items-start gap-8 lg:grid-cols-[1fr_1.05fr]">
        {/* ── constellation ── */}
        <Reveal className="relative mx-auto aspect-square w-full max-w-[560px]">
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
            {/* spokes from the hub */}
            {pos.map((p, i) => (
              <line
                key={`s${i}`}
                x1={50}
                y1={50}
                x2={p.x}
                y2={p.y}
                stroke={series[i].id === activeId ? GROUP[series[i].group].line : "rgba(255,255,255,0.12)"}
                strokeWidth={series[i].id === activeId ? 0.45 : 0.2}
                strokeDasharray="0.6 1.2"
              />
            ))}
            {/* series ↔ series */}
            {links.map((l, i) => {
              const a = pos[index[l.a]];
              const b = pos[index[l.b]];
              const on = l.a === activeId || l.b === activeId;
              const color = l.kind === "shared" ? "#4fe3ff" : "#ffcf73";
              const d = `M ${a.x} ${a.y} Q 50 50 ${b.x} ${b.y}`;
              return (
                <g key={`l${i}`}>
                  <path
                    d={d}
                    fill="none"
                    stroke={color}
                    strokeOpacity={on ? 0.95 : 0.3}
                    strokeWidth={on ? 0.55 : 0.3}
                    className={on ? "yt-flow" : undefined}
                  />
                  <circle r={on ? 0.9 : 0.6} fill={color} opacity={on ? 1 : 0.6}>
                    <animateMotion dur={`${5 + (i % 4)}s`} repeatCount="indefinite" path={d} />
                  </circle>
                </g>
              );
            })}
          </svg>

          {/* hub */}
          <a
            href={YT_CHANNEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
            aria-label="ช่อง YouTube Thankful"
          >
            <span className="space-pulse-soft relative block h-20 w-20 overflow-hidden rounded-full ring-2 ring-[#ffcf73]/70 shadow-[0_0_40px_rgba(255,200,100,0.45)] sm:h-24 sm:w-24">
              <Image src="/thankful-logo.png" alt="" fill sizes="96px" className="object-cover" />
            </span>
            <span className="mt-2 rounded-full bg-[#050a18]/85 px-2.5 py-0.5 font-mono text-[10px] tracking-[0.25em] text-[#ffd77a] group-hover:text-white">
              THANKFUL
            </span>
          </a>

          {/* series stars */}
          {series.map((s, i) => {
            const on = s.id === activeId;
            const gg = GROUP[s.group];
            const v = s.videos[0];
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => pick(s.id)}
                aria-pressed={on}
                className="absolute flex w-[4.5rem] -translate-x-1/2 -translate-y-1/2 flex-col items-center sm:w-28"
                style={{ left: `${pos[i].x}%`, top: `${pos[i].y}%` }}
              >
                <span
                  className={`relative block overflow-hidden rounded-full transition-all duration-300 ${
                    on ? "h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem]" : "h-11 w-11 sm:h-14 sm:w-14 hover:scale-110"
                  }`}
                  style={{
                    boxShadow: `0 0 0 2px ${gg.ring}, 0 0 ${on ? 30 : 16}px ${gg.glow}`,
                    background: "#0a1226",
                  }}
                >
                  {v && (
                    <Image src={thumb(v.id, "mq")} alt="" fill unoptimized sizes="72px" className="object-cover" />
                  )}
                </span>
                <span
                  className={`mt-1.5 rounded-full px-2 py-0.5 text-center text-[10px] leading-tight sm:text-[11px] ${
                    on ? "bg-white text-[#050a18] font-semibold" : "bg-[#050a18]/85 text-white/85"
                  }`}
                >
                  <span className="sm:hidden">{s.short}</span>
                  <span className="hidden sm:inline">{s.title}</span>
                </span>
              </button>
            );
          })}

          <p className="pointer-events-none absolute inset-x-0 -bottom-2 text-center font-mono text-[10px] text-white/50">
            {t("yt.hint")}
          </p>
        </Reveal>

        {/* ── selected series ── */}
        <Reveal delay={100} className="glass overflow-hidden">
          <div className="p-5 pb-4">
            <span
              className="inline-block rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider"
              style={{ color: g.ring, boxShadow: `inset 0 0 0 1px ${g.ring}` }}
            >
              {g.label}
            </span>
            <h3 className="mt-2 font-display text-2xl font-bold text-white">{active.title}</h3>
            <p className="mt-1 text-sm text-muted">{active.blurb}</p>
          </div>

          {lead ? (
            <div className="relative aspect-video w-full bg-black">
              {playing ? (
                <iframe
                  key={lead.id}
                  src={`https://www.youtube-nocookie.com/embed/${lead.id}?autoplay=1&rel=0&list=${active.playlistId}`}
                  title={lead.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 h-full w-full"
                />
              ) : (
                // A facade, not an iframe, until asked: eight embedded players
                // would cost megabytes before anyone pressed play.
                <button
                  type="button"
                  onClick={() => setPlaying(lead.id)}
                  className="group absolute inset-0"
                  aria-label={`เล่น ${lead.title}`}
                >
                  <Image src={thumb(lead.id, "hq")} alt="" fill unoptimized sizes="(max-width:1024px) 100vw, 560px" className="object-cover" />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                  <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#ff0033] shadow-[0_0_30px_rgba(255,0,51,0.6)] transition-transform group-hover:scale-110">
                    <svg viewBox="0 0 24 24" className="ml-1 h-7 w-7 fill-white" aria-hidden>
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                  <span className="absolute inset-x-4 bottom-3 text-left">
                    <span className="line-clamp-2 text-sm font-semibold text-white">{lead.title}</span>
                    <span className="font-mono text-[10px] text-white/70">{fmtDate(lead.published)}</span>
                  </span>
                </button>
              )}
            </div>
          ) : (
            <p className="px-5 pb-4 text-sm text-muted">ยังโหลดตอนล่าสุดไม่ได้ในตอนนี้ — เปิดดูบน YouTube ได้เลย</p>
          )}

          {rest.length > 0 && (
            <div className="space-y-2 p-5 pb-3">
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted">{t("yt.latest")}</p>
              {rest.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setPlaying(v.id)}
                  className="flex w-full items-center gap-3 rounded-lg p-1.5 text-left transition-colors hover:bg-white/5"
                >
                  <span className="relative aspect-video w-24 shrink-0 overflow-hidden rounded-md">
                    <Image src={thumb(v.id, "mq")} alt="" fill unoptimized sizes="96px" className="object-cover" />
                  </span>
                  <span className="min-w-0">
                    <span className="line-clamp-2 text-xs text-white/90">{v.title}</span>
                    <span className="font-mono text-[10px] text-muted">{fmtDate(v.published)}</span>
                  </span>
                </button>
              ))}
            </div>
          )}

          {neighbours.length > 0 && (
            <div className="border-t border-white/10 p-5 pb-4">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted">{t("yt.next")} →</p>
              <div className="flex flex-wrap gap-2">
                {neighbours.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => pick(n.id)}
                    className="rounded-full border px-3 py-1 text-xs text-white/85 transition-colors hover:bg-white/10"
                    style={{ borderColor: `${GROUP[n.group].ring}80` }}
                  >
                    {n.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2 border-t border-white/10 p-5">
            <a
              href={`https://www.youtube.com/playlist?list=${active.playlistId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost !px-4 !py-2 text-xs"
            >
              {t("yt.playlist")} ↗
            </a>
            <a
              href={YT_SUBSCRIBE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-[#ff0033] px-4 py-2 text-xs font-semibold text-white transition-transform hover:scale-[1.03]"
            >
              <YtIcon className="h-3.5 w-3.5" /> {t("yt.subscribe")}
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function YtIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.6 15.6V8.4l6.2 3.6-6.2 3.6z" />
    </svg>
  );
}
