import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/demo-data";
import ViewsChart from "@/components/admin/ViewsChart";
import AnalyticsRangePicker from "@/components/admin/AnalyticsRangePicker";
import AnalyticsBreakdown from "@/components/admin/AnalyticsBreakdown";
import { resolveRange, demoSeries, safeRpc } from "@/lib/analytics-range";
import type { SeriesPoint, RangeTotals, DimensionCount } from "@/lib/types";

export const revalidate = 0;

export default async function PostAnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const r = resolveRange(sp);

  let title = decodeURIComponent(slug);
  let totalAllTime = 0;
  let series: SeriesPoint[] = [];
  let rangeTotals: RangeTotals = { total: 0, unique_visitors: 0 };
  let referrers: DimensionCount[] = [];
  let countries: DimensionCount[] = [];
  let notMigrated = false;

  if (isSupabaseConfigured()) {
    const admin = createAdminClient();
    const { data: post } = await admin
      .from("blog_posts")
      .select("id, title, view_count")
      .eq("slug", slug)
      .maybeSingle();
    if (!post) notFound();

    const p = post as { id: string; title: string; view_count?: number };
    title = p.title;
    totalAllTime = p.view_count ?? 0;

    const [seriesRows, totalsRows, refRows, countryRows] = await Promise.all([
      safeRpc<SeriesPoint[]>(admin, "blog_views_series_post", { p_post_id: p.id, p_from: r.fromISO, p_to: r.toISO, p_bucket: r.bucket }, []),
      safeRpc<RangeTotals[]>(admin, "blog_range_totals_post", { p_post_id: p.id, p_from: r.fromISO, p_to: r.toISO }, []),
      safeRpc<DimensionCount[]>(admin, "blog_views_by_referrer_post", { p_post_id: p.id, p_from: r.fromISO, p_to: r.toISO, lim: 8 }, []),
      safeRpc<DimensionCount[]>(admin, "blog_views_by_country_post", { p_post_id: p.id, p_from: r.fromISO, p_to: r.toISO, lim: 8 }, []),
    ]);
    series = seriesRows;
    rangeTotals = totalsRows[0] ?? rangeTotals;
    referrers = refRows;
    countries = countryRows;
    notMigrated = series.length === 0;
  } else {
    series = demoSeries(r.fromDate, r.toDate, r.bucket);
    const sum = series.reduce((a, d) => a + d.views, 0);
    rangeTotals = { total: sum, unique_visitors: Math.round(sum * 0.62) };
    totalAllTime = sum + 420;
    referrers = [
      { label: "google.com", views: 214 },
      { label: "Direct / unknown", views: 168 },
      { label: "facebook.com", views: 96 },
      { label: "x.com", views: 44 },
    ];
    countries = [
      { label: "TH", views: 402 },
      { label: "US", views: 96 },
      { label: "SG", views: 41 },
    ];
  }

  const stats = [
    { label: "Total views", value: totalAllTime, hint: "all time" },
    { label: `Views · ${r.label}`, value: rangeTotals.total, hint: "in range" },
    { label: "Unique visitors", value: rangeTotals.unique_visitors, hint: "in range" },
  ];

  return (
    <div>
      <Link
        href="/admin/analytics"
        className="font-mono text-xs uppercase tracking-wider text-cyan/70 hover:text-cyan"
      >
        ← Blog Analytics
      </Link>

      <p className="eyebrow mt-4">// Post analytics</p>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <h1 className="max-w-3xl font-display text-2xl font-bold leading-snug md:text-3xl">
          {title}
        </h1>
        <Link
          href={`/blog/${slug}`}
          target="_blank"
          className="shrink-0 font-mono text-xs uppercase tracking-wider text-muted hover:text-cyan"
        >
          ดูโพสต์ ↗
        </Link>
      </div>

      {notMigrated && (
        <div className="mb-8 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 font-mono text-xs leading-relaxed text-amber-300">
          ⚠ ยังไม่พบฟังก์ชันสถิติรายโพสต์ — รัน <code>supabase/add-post-analytics.sql</code> ใน
          Supabase SQL Editor เพื่อเปิดใช้หน้านี้
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="glass p-5">
            <p className="font-display text-3xl font-bold text-gradient">
              {s.value.toLocaleString()}
            </p>
            <p className="mt-2 truncate font-mono text-[11px] uppercase tracking-wider text-muted">
              {s.label}
            </p>
            <p className="font-mono text-[10px] text-ink/30">{s.hint}</p>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <AnalyticsRangePicker activeDays={r.activeDays} from={sp.from} to={sp.to} />
        <div className="mt-4">
          <ViewsChart
            data={series}
            bucket={r.bucket}
            label={r.label}
            totalInRange={rangeTotals.total}
            uniqueInRange={rangeTotals.unique_visitors}
          />
        </div>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <AnalyticsBreakdown title="Top referrers" rows={referrers} />
        <AnalyticsBreakdown title="Top countries" rows={countries} />
      </div>
    </div>
  );
}
