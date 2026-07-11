import type { DimensionCount } from "@/lib/types";

/** A labelled bar list (referrers / countries) used on the analytics pages. */
export default function AnalyticsBreakdown({
  title,
  rows,
}: {
  title: string;
  rows: DimensionCount[];
}) {
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
