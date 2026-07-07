import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/demo-data";
import ViewsChart from "@/components/admin/ViewsChart";
import type {
  BlogViewTotals,
  DailyViews,
  TopPost,
  DimensionCount,
} from "@/lib/types";

export const revalidate = 0;

// ─── Demo data (renders the full dashboard with no backend) ──────────────────
function demoDaily(): DailyViews[] {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const views = 18 + Math.round(34 * Math.abs(Math.sin(i / 3.2))) + (i % 5);
    return { day: d.toISOString().slice(0, 10), views };
  });
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

export default async function AnalyticsPage() {
  let totals: BlogViewTotals = { total: 0, today: 0, last7: 0, last30: 0, unique30: 0 };
  let daily: DailyViews[] = [];
  let top: TopPost[] = [];
  let referrers: DimensionCount[] = [];
  let countries: DimensionCount[] = [];
  let notMigrated = false;

  if (isSupabaseConfigured()) {
    const admin = createAdminClient();
    const [totalsRows, dailyRows, topRows, refRows, countryRows] = await Promise.all([
      safeRpc<BlogViewTotals[]>(admin, "blog_view_totals", {}, []),
      safeRpc<DailyViews[]>(admin, "blog_views_daily", { days: 30 }, []),
      safeRpc<TopPost[]>(admin, "blog_top_posts", { days: 30, lim: 10 }, []),
      safeRpc<DimensionCount[]>(admin, "blog_views_by_referrer", { days: 30, lim: 8 }, []),
      safeRpc<DimensionCount[]>(admin, "blog_views_by_country", { days: 30, lim: 8 }, []),
    ]);
    totals = totalsRows[0] ?? totals;
    daily = dailyRows;
    top = topRows;
    referrers = refRows;
    countries = countryRows;
    // If every RPC came back empty, the migration probably hasn't been applied.
    notMigrated = daily.length === 0;
  } else {
    // Demo — synthesize a believable dataset so the page is fully reviewable.
    daily = demoDaily();
    const sum = daily.reduce((a, d) => a + d.views, 0);
    totals = {
      total: sum + 3120,
      today: daily[daily.length - 1].views,
      last7: daily.slice(-7).reduce((a, d) => a + d.views, 0),
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
          ⚠ ยังไม่พบตาราง analytics — รัน <code>supabase/add-blog-analytics.sql</code> ใน
          Supabase SQL Editor ก่อน แล้วยอด Views จะเริ่มถูกบันทึกและแสดงผลที่นี่
        </div>
      )}

      {/* Headline counters */}
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

      {/* Trend chart */}
      <div className="mt-8">
        <ViewsChart data={daily} />
      </div>

      {/* Top posts + breakdowns */}
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
            Ranked by views in the last 30 days.
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
