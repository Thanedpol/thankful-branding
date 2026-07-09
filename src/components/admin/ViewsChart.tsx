"use client";

import { useState } from "react";
import type { SeriesPoint, Bucket } from "@/lib/types";

function fmt(iso: string, bucket: Bucket): string {
  const d = new Date(iso);
  if (bucket === "hour") return d.toLocaleTimeString("en-US", { hour: "numeric" });
  if (bucket === "month") return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function BarIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <rect x="3" y="12" width="4" height="9" rx="1" />
      <rect x="10" y="6" width="4" height="15" rx="1" />
      <rect x="17" y="3" width="4" height="18" rx="1" />
    </svg>
  );
}
function LineIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="3,15 9,9 14,13 21,4" />
    </svg>
  );
}

/**
 * Interactive views chart — bar or line, with a hover tooltip showing the exact
 * value for each bucket (Meta-style). Dependency-free, theme-aware.
 */
export default function ViewsChart({
  data,
  bucket,
  label,
  totalInRange,
  uniqueInRange,
}: {
  data: SeriesPoint[];
  bucket: Bucket;
  label: string;
  totalInRange?: number;
  uniqueInRange?: number;
}) {
  const [type, setType] = useState<"bar" | "line">("bar");
  const [hover, setHover] = useState<number | null>(null);

  const n = data.length;
  const max = Math.max(1, ...data.map((d) => d.views));
  const peak = data.reduce(
    (a, b) => (b.views > a.views ? b : a),
    data[0] ?? { bucket_start: "", views: 0 }
  );

  // viewBox 0..100 space (headroom top & bottom so points don't hit the edge).
  const yOf = (v: number) => 100 - (v / max) * 88 - 6;
  const xOf = (i: number) => (n > 1 ? (i / (n - 1)) * 100 : 50);
  const linePts = data.map((d, i) => `${xOf(i)},${yOf(d.views)}`).join(" ");
  const areaPts = `0,100 ${linePts} 100,100`;

  const active = hover != null ? data[hover] : null;
  const tipX = active
    ? type === "bar"
      ? ((hover! + 0.5) / n) * 100
      : xOf(hover!)
    : 0;

  const tab = (on: boolean) =>
    `flex items-center gap-1.5 rounded-md px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider transition-colors ${
      on ? "bg-cyan/15 text-cyan" : "text-muted hover:text-ink"
    }`;

  return (
    <div className="glass p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold">Views · {label}</h2>
          <span className="font-mono text-[11px] text-muted">
            {typeof totalInRange === "number" && (
              <>
                {totalInRange.toLocaleString()} views
                {typeof uniqueInRange === "number" && ` · ${uniqueInRange.toLocaleString()} unique`}
                {" · "}
              </>
            )}
            peak {peak.views.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-0.5 rounded-lg border border-line/10 p-0.5">
          <button type="button" onClick={() => setType("bar")} aria-pressed={type === "bar"} className={tab(type === "bar")}>
            <BarIcon /> แท่ง
          </button>
          <button type="button" onClick={() => setType("line")} aria-pressed={type === "line"} className={tab(type === "line")}>
            <LineIcon /> เส้น
          </button>
        </div>
      </div>

      <div className="relative h-56" onMouseLeave={() => setHover(null)}>
        {n === 0 ? (
          <p className="flex h-full items-center justify-center font-mono text-xs text-muted">
            No views in this range.
          </p>
        ) : (
          <>
            {/* ── visual ── */}
            {type === "bar" ? (
              <div className="flex h-full items-end gap-[3px]">
                {data.map((d, i) => (
                  <div key={d.bucket_start} className="flex h-full flex-1 flex-col justify-end">
                    <div
                      className="w-full rounded-t-sm bg-gradient-to-t from-cyan/25 to-cyan/80 transition-opacity"
                      style={{
                        height: `${d.views > 0 ? Math.max((d.views / max) * 100, 2) : 0}%`,
                        opacity: hover == null || hover === i ? 1 : 0.4,
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
                <defs>
                  <linearGradient id="viewsArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="rgb(0,245,255)" stopOpacity="0.32" />
                    <stop offset="1" stopColor="rgb(0,245,255)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polygon points={areaPts} fill="url(#viewsArea)" />
                <polyline
                  points={linePts}
                  fill="none"
                  stroke="rgb(0,245,255)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
                {active && (
                  <line
                    x1={tipX}
                    y1="0"
                    x2={tipX}
                    y2="100"
                    stroke="rgb(0,245,255)"
                    strokeOpacity="0.4"
                    strokeDasharray="3 3"
                    vectorEffect="non-scaling-stroke"
                  />
                )}
              </svg>
            )}

            {/* bar-mode vertical guide */}
            {type === "bar" && active && (
              <div className="pointer-events-none absolute inset-y-0 w-px bg-cyan/30" style={{ left: `${tipX}%` }} />
            )}

            {/* line-mode hovered dot */}
            {type === "line" && active && (
              <div
                className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-cyan bg-space"
                style={{ left: `${tipX}%`, top: `${yOf(active.views)}%` }}
              />
            )}

            {/* hover hit areas */}
            <div className="absolute inset-0 flex">
              {data.map((d, i) => (
                <div key={d.bucket_start} className="h-full flex-1" onMouseEnter={() => setHover(i)} />
              ))}
            </div>

            {/* tooltip */}
            {active && (
              <div
                className="pointer-events-none absolute top-1 z-10 -translate-x-1/2 rounded-lg border border-line/15 bg-space-light/95 px-3 py-2 shadow-lg shadow-black/40 backdrop-blur-sm"
                style={{ left: `${Math.min(Math.max(tipX, 9), 91)}%` }}
              >
                <p className="whitespace-nowrap font-mono text-[10px] uppercase tracking-wider text-muted">
                  {fmt(active.bucket_start, bucket)}
                </p>
                <p className="whitespace-nowrap font-display text-lg font-bold text-cyan">
                  {active.views.toLocaleString()}{" "}
                  <span className="text-xs font-normal text-muted">views</span>
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <div className="mt-2 flex justify-between font-mono text-[10px] text-muted">
        <span>{data[0] ? fmt(data[0].bucket_start, bucket) : ""}</span>
        <span>{data.length ? fmt(data[data.length - 1].bucket_start, bucket) : ""}</span>
      </div>
    </div>
  );
}
