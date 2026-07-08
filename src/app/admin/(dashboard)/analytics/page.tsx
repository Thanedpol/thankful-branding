import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/demo-data";
import ViewsChart from "@/components/admin/ViewsChart";
import AnalyticsRangePicker from "@/components/admin/AnalyticsRangePicker";
import type {
  BlogViewTotals,
  SeriesPoint,
  Bucket,
  RangeTotals,
  TopPost,
  DimensionCount,
} from "@/lib/types";

export const revalidate = 0;

const DAY_MS = 86_400_000;
const PRESET_DAYS = [1, 7, 14, 90, 180, 365];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Pick a sensible bucket granularity for a span (in days). */
function bucketFor(spanDays: number): Bucket {
  if (spanDays <= 2) return "hour";
  if (spanDays <= 45) return "day";
  if (spanDays <= 183) return "week";
  return "month";
}

/** Human label for the chart header. */
function rangeLabel(days: number | null, from?: string, to?: string): string {
  if (days === null) return `${from} → ${to}`;
  if (days === 1) return "last 24 hours";
  if (days < 30) return `last ${days} days`;
  if (days < 365) return `last ${Math.round(days / 30)} months`;
  return "last 12 months";
}

// ─── Demo series (renders the full dashboard with no backend) ────────────────
function stepDate(d: Date, bucket: Bucket): Date {
  const n = new Date(d);
  if (bucket === "hour") n.setUTCHours(n.getUTCHours() + 1);
  else if (bucket === "day") n.setUTCDate(n.getUTCDate() + 1);
  else if (bucket === "week") n.setUTCDate(n.getUTCDate() + 7);
  else n.setUTCMonth(n.getUTCMonth() + 1);
  return n;
}
function truncDate(d: Date, bucket: Bucket): Date {
  const n = new Date(d);
  n.setUTCMilliseconds(0);
  n.setUTCSeconds(0);
  n.setUTCMinutes(0);
  if (bucket !== "hour") n.setUTCHours(0);
  if (bucket === "week") n.setUTCDate(n.getUTCDate() - ((n.getUTCDay() + 6) % 7));
  if (bucket === "month") n.setUTCDate(1);
  return n;
}
function demoSeries(from: Date, to: Date, bucket: Bucket): SeriesPoint[] {
  const pts: SeriesPoint[] = [];
  let cur = truncDate(from, bucket);
  let i = 0;
  while (cur <= to && i < 800) {
    const views = 8 + Math.round(24 * Math.abs(Math.sin(i / 3.1))) + (i % 4);
    pts.push({ bucket_start: cur.toISOString(), views });
    cur = stepDate(cur, bucket);
    i++;
  }
  return pts;
}

// ─── Safe RPC wrapper: any failure (incl. "migration not run") → fallback ─────
async function safeRpc<T>(
  admin: ReturnType<typeof createAdminClient>,
  fn: string,
  params: Record<string, unknown>,
  fallback: T
): Promise<T> {
  try {
    const { data, error } = await admin.rpc(fn, params);
    if (error) {
      console.error(`[analytics] ${fn} failed`, error.message);
      return fallback;
    }
    return (data as T) ?? fallback;
  } catch (e) {
    console.error(`[analytics] ${fn} threw`, e);
    return fallback;
  }
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  const sp = await searchParams;

  // ── Resolve the selected window ───────────────────────────────────────────
  let activeDays: number | null;
  let fromDate: Date;
  let toDate: Date;

  if (sp.from && sp.to && DATE_RE.test(sp.from) && DATE_RE.test(sp.to) && sp.from <= sp.to) {
    activeDays = null;
    fromDate = new Date(`${sp.from}T00:00:00.000Z`);
    toDate = new Date(`${sp.to}T23:59:59.999Z`);
  } else {
    activeDays = PRESET_DAYS.includes(Number(sp.range)) ? Number(sp.range) : 7;
    toDate = new Date();
    fromDate = new Date(toDate.getTime() - activeDays * DAY_MS);
  }

  const spanDays = (toDate.getTime() - fromDate.getTime()) / DAY_MS;
  const bucket = bucketFor(spanDays);
  const label = rangeLabel(activeDays, sp.from, sp.to);
  const fromISO = fromDate.toISOString();
  const toISO = toDate.toISOString();

  // ── Fetch ─────────────────────────────────────────────────────────────────
  let totals: BlogViewTotals = { total: 0, today: 0, last7: 0, last30: 0, unique30: 0 };
  let series: SeriesPoint[] = [];
  let rangeTotals: RangeTotals = { total: 0, unique_visitors: 0 };
  let top: TopPost[] = [];
  let referrers: DimensionCount[] = [];
  let countries: DimensionCount[] = [];
  let notMigrated = false;

  if (isSupabaseConfigured()) {
    const admin = createAdminClient();
    const [totalsRows, seriesRows, rangeRows, topRows, refRows, countryRows] = await Promise.all([
      safeRpc<BlogViewTotals[]>(admin, "blog_view_totals", {}, []),
      safeRpc<SeriesPoint[]>(admin, "blog_views_series", { p_from: fromISO, p_to: toISO, p_bucket: bucket }, []),
      safeRpc<RangeTotals[]>(admin, "blog_range_totals", { p_from: fromISO, p_to: toISO }, []),
      safeRpc<TopPost[]>(admin, "blog_top_posts_range", { p_from: fromISO, p_to: toISO, lim: 10 }, []),
      safeRpc<DimensionCount[]>(admin, "blog_views_by_referrer_range", { p_from: fromISO, p_to: toISO, lim: 8 }, []),
      safeRpc<DimensionCount[]>(admin, "blog_views_by_country_range", { p_from: fromISO, p_to: toISO, lim: 8 }, []),
    ]);
    totals = totalsRows[0] ?? totals;
    series = seriesRows;
    rangeTotals = rangeRows[0] ?? rangeTotals;
    top = topRows;
    referrers = refRows;
    countries = countryRows;
    // A working series function always zero-fills ≥1 bucket; empty ⇒ not migrated.
    notMigrated = series.length === 0;
  } else {
    // Demo — synthesize a believable dataset so the page is fully reviewable.
    series = demoSeries(fromDate, toDate, bucket);
    const sum = series.reduce((a, d) => a + d.views, 0);
    rangeTotals = { total: sum, unique_visitors: Math.round(sum * 0.62) };
    totals = {
      total: sum + 3120,
      today: series[series.length - 1]?.views ?? 0,
      last7: Math.round(sum * 0.3),
      last30: sum,
      unique30: Math.round(sum * 0.62),
    };
    top = [
      { post_id: "b1", title: "Why Agents Beat Pipelines", slug: "why-agents-beat-pipelines", views: 512, total: 1284 },
      { post_id: "b3", title: "Designing Interfaces for the Year 2049", slug: "interfaces-2049", views: 331, total: 842 },
      { post_id: "b2", title: "The Hidden Cost of Context Windows", slug: "hidden-cost-of-context-windows", views: 208, total: 511 },
    ];
    referrers = [
      { label: "google.com", views: 486 },
      { label: "Direct / unknown", views: 312 },
      { label: "facebook.com", views: 174 },
      { label: "x.com", views: 121 },
      { label: "linkedin.com", views: 63 },
    ];
    countries = [
      { label: "TH", views: 742 },
      { label: "US", views: 214 },
      { label: "SG", views: 96 },
      { label: "GB", views: 58 },
      { label: "JP", views: 41 },
    ];
  }

  const stats = [
    { label: "Total views", value: totals.total, hint: "all time" },
    { label: "Today", value: totals.today, hint: "so far" },
    { label: "Last 7 days", value: totals.last7, hint: "rolling" },
    { label: "Last 30 days", value: totals.last30, hint: "rolling" },
    { label: "Unique visitors", value: totals.unique30, hint: "30 days" },
  ];

  return (
    <div>
      <p className="eyebrow">// Analytics</p>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-3xl font-bold">Blog Analytics</h1>
        <span className="font-mono text-[11px] uppercase tracking-wider text-muted">
          self-hosted · privacy-first
        </span>
      </div>

      {notMigrated && (
        <div className="mb-8 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 font-mono text-xs leading-relaxed text-amber-300">
          ⚠ ยังไม่พบฟังก์ชันช่วงเวลา — รัน <code>supabase/add-analytics-ranges.sql</code> ใน
          Supabase SQL Editor เพื่อเปิดใช้การเลือกช่วงเวลา (1 วัน / 7 / 14 วัน / 3 / 6 เดือน / 1 ปี / กำหนดเอง)
        </div>
      )}

      {/* Headline counters (fixed standard windows) */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className="glass p-5">
            <p className="font-display text-3xl font-bold text-gradient">
              {s.value.toLocaleString()}
            </p>
            <p className="mt-2 font-mono text-[11px] uppercase tracking-wider text-muted">
              {s.label}
            </p>
            <p className="font-mono text-[10px] text-ink/30">{s.hint}</p>
          </div>
        ))}
      </div>

      {/* Range selector + trend chart */}
      <div className="mt-8">
        <AnalyticsRangePicker activeDays={activeDays} from={sp.from} to={sp.to} />
        <div className="mt-4">
          <ViewsChart
            data={series}
            bucket={bucket}
            label={label}
            totalInRange={rangeTotals.total}
            uniqueInRange={rangeTotals.unique_visitors}
          />
        </div>
      </div>

      {/* Top posts + breakdowns (all follow the selected range) */}
      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <h2 className="mb-4 font-display text-lg font-bold">Top posts</h2>
          <div className="glass divide-y divide-line/[0.06]">
            {top.length === 0 ? (
              <p className="p-6 font-mono text-sm text-muted">No views recorded yet.</p>
            ) : (
              top.map((p, i) => (
                <div key={p.post_id} className="flex items-center gap-4 p-4">
                  <span className="w-5 shrink-0 text-center font-mono text-sm text-cyan/50">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/blog/${p.slug}`}
                      target="_blank"
                      className="block truncate font-body hover:text-cyan"
                    >
                      {p.title}
                    </Link>
                    <p className="font-mono text-[11px] text-ink/40">
                      {p.total.toLocaleString()} all-time
                    </p>
                  </div>
                  <span className="shrink-0 font-display text-lg font-bold text-gradient">
                    {p.views.toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
          <p className="mt-2 font-mono text-[10px] text-ink/30">
            Ranked by views in {label}.
          </p>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Breakdown title="Top referrers" rows={referrers} />
          <Breakdown title="Top countries" rows={countries} />
        </div>
      </div>
    </div>
  );
}

function Breakdown({ title, rows }: { title: string; rows: DimensionCount[] }) {
  const max = Math.max(1, ...rows.map((r) => r.views));
  return (
    <div>
      <h2 className="mb-4 font-display text-lg font-bold">{title}</h2>
      <div className="glass divide-y divide-line/[0.06]">
        {rows.length === 0 ? (
          <p className="p-6 font-mono text-sm text-muted">No data yet.</p>
        ) : (
          rows.map((r) => (
            <div key={r.label} className="relative overflow-hidden p-3.5">
              <div
                className="absolute inset-y-0 left-0 bg-cyan/[0.07]"
                style={{ width: `${(r.views / max) * 100}%` }}
                aria-hidden
              />
              <div className="relative flex items-center justify-between gap-3">
                <span className="truncate font-mono text-xs text-ink/80">{r.label}</span>
                <span className="shrink-0 font-mono text-xs text-cyan/90">
                  {r.views.toLocaleString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
