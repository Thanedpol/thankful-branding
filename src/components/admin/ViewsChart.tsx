import type { DailyViews } from "@/lib/types";

function label(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * A dependency-free, responsive bar chart for the daily views series.
 * Pure CSS bars (no external chart lib) with a native hover tooltip per day.
 */
export default function ViewsChart({ data }: { data: DailyViews[] }) {
  const max = Math.max(1, ...data.map((d) => d.views));
  const peak = data.reduce((a, b) => (b.views > a.views ? b : a), data[0] ?? { day: "", views: 0 });

  return (
    <div className="glass p-6">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="font-display text-lg font-bold">Views · last 30 days</h2>
        <span className="font-mono text-[11px] text-muted">
          peak {peak.views.toLocaleString()} · {peak.day ? label(peak.day) : "—"}
        </span>
      </div>

      <div className="flex h-44 items-end gap-[3px]">
        {data.map((d) => {
          const h = (d.views / max) * 100;
          return (
            <div
              key={d.day}
              title={`${label(d.day)} — ${d.views.toLocaleString()} views`}
              className="group relative flex flex-1 flex-col justify-end"
            >
              <div
                className="w-full rounded-t-sm bg-gradient-to-t from-cyan/25 to-cyan/80 transition-colors group-hover:from-cyan/50 group-hover:to-cyan"
                style={{ height: `${d.views > 0 ? Math.max(h, 3) : 0}%` }}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex justify-between font-mono text-[10px] text-muted">
        <span>{data[0] ? label(data[0].day) : ""}</span>
        <span>{data.length ? label(data[data.length - 1].day) : ""}</span>
      </div>
    </div>
  );
}
