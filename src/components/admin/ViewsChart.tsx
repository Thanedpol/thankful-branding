import type { SeriesPoint, Bucket } from "@/lib/types";

function fmt(iso: string, bucket: Bucket): string {
  const d = new Date(iso);
  if (bucket === "hour") return d.toLocaleTimeString("en-US", { hour: "numeric" });
  if (bucket === "month") return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * A dependency-free, responsive bar chart for a bucketed views series.
 * Pure CSS bars (no external chart lib) with a native hover tooltip per bucket.
 * Adapts its labels to the granularity (hour / day / week / month).
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
  const max = Math.max(1, ...data.map((d) => d.views));
  const peak = data.reduce(
    (a, b) => (b.views > a.views ? b : a),
    data[0] ?? { bucket_start: "", views: 0 }
  );

  return (
    <div className="glass p-6">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
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

      <div className="flex h-44 items-end gap-[3px]">
        {data.length === 0 ? (
          <p className="m-auto font-mono text-xs text-muted">No views in this range.</p>
        ) : (
          data.map((d) => {
            const h = (d.views / max) * 100;
            return (
              <div
                key={d.bucket_start}
                title={`${fmt(d.bucket_start, bucket)} — ${d.views.toLocaleString()} views`}
                className="group relative flex flex-1 flex-col justify-end"
              >
                <div
                  className="w-full rounded-t-sm bg-gradient-to-t from-cyan/25 to-cyan/80 transition-colors group-hover:from-cyan/50 group-hover:to-cyan"
                  style={{ height: `${d.views > 0 ? Math.max(h, 3) : 0}%` }}
                />
              </div>
            );
          })
        )}
      </div>

      <div className="mt-2 flex justify-between font-mono text-[10px] text-muted">
        <span>{data[0] ? fmt(data[0].bucket_start, bucket) : ""}</span>
        <span>{data.length ? fmt(data[data.length - 1].bucket_start, bucket) : ""}</span>
      </div>
    </div>
  );
}
