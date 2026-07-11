import { createAdminClient } from "@/lib/supabase/admin";
import type { Bucket, SeriesPoint } from "@/lib/types";

// Shared analytics helpers used by the site-wide dashboard and the per-post one.

export const DAY_MS = 86_400_000;
export const PRESET_DAYS = [1, 7, 14, 90, 180, 365];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Pick a sensible bucket granularity for a span (in days). */
export function bucketFor(spanDays: number): Bucket {
  if (spanDays <= 2) return "hour";
  if (spanDays <= 45) return "day";
  if (spanDays <= 183) return "week";
  return "month";
}

/** Human label for the chart header. */
export function rangeLabel(days: number | null, from?: string, to?: string): string {
  if (days === null) return `${from} → ${to}`;
  if (days === 1) return "last 24 hours";
  if (days < 30) return `last ${days} days`;
  if (days < 365) return `last ${Math.round(days / 30)} months`;
  return "last 12 months";
}

export interface ResolvedRange {
  activeDays: number | null;
  fromDate: Date;
  toDate: Date;
  spanDays: number;
  bucket: Bucket;
  label: string;
  fromISO: string;
  toISO: string;
}

/** Turn ?range=/?from=&to= search params into a concrete window + bucket. */
export function resolveRange(sp: {
  range?: string;
  from?: string;
  to?: string;
}): ResolvedRange {
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
  return {
    activeDays,
    fromDate,
    toDate,
    spanDays,
    bucket,
    label: rangeLabel(activeDays, sp.from, sp.to),
    fromISO: fromDate.toISOString(),
    toISO: toDate.toISOString(),
  };
}

// ─── Demo series (renders the dashboard with no backend) ─────────────────────
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
export function demoSeries(from: Date, to: Date, bucket: Bucket): SeriesPoint[] {
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

/** Any RPC failure (incl. "migration not run") → fallback, never throws. */
export async function safeRpc<T>(
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
