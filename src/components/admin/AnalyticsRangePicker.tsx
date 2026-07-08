"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const PRESETS = [
  { days: 1, label: "1 วัน" },
  { days: 7, label: "7 วัน" },
  { days: 14, label: "14 วัน" },
  { days: 90, label: "3 เดือน" },
  { days: 180, label: "6 เดือน" },
  { days: 365, label: "1 ปี" },
];

const field =
  "rounded-lg border border-line/10 bg-surface/[0.03] px-3 py-2 text-sm text-ink outline-none focus:border-cyan/50 [color-scheme:dark]";

const pill = (active: boolean) =>
  `rounded-full border px-3.5 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors ${
    active
      ? "border-cyan/60 bg-cyan/15 text-cyan"
      : "border-line/10 text-muted hover:border-cyan/40 hover:text-cyan"
  }`;

/**
 * Time-range selector for the analytics dashboard. Presets and the custom
 * from/to range are stored in the URL (?range= or ?from=&to=) so the server
 * component re-queries on navigation — no client data fetching.
 */
export default function AnalyticsRangePicker({
  activeDays,
  from,
  to,
}: {
  activeDays: number | null; // preset days, or null when a custom range is active
  from?: string;
  to?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isCustom = activeDays === null;
  const [open, setOpen] = useState(isCustom);
  const [f, setF] = useState(from ?? "");
  const [t, setT] = useState(to ?? "");

  function selectPreset(days: number) {
    setOpen(false);
    router.push(`${pathname}?range=${days}`);
  }
  function applyCustom() {
    if (!f || !t || f > t) return;
    router.push(`${pathname}?from=${f}&to=${t}`);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="ช่วงเวลา">
        {PRESETS.map((p) => (
          <button
            key={p.days}
            type="button"
            onClick={() => selectPreset(p.days)}
            aria-pressed={!isCustom && activeDays === p.days}
            className={pill(!isCustom && activeDays === p.days)}
          >
            {p.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-pressed={isCustom}
          className={pill(isCustom)}
        >
          กำหนดเอง
        </button>
      </div>

      {open && (
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted">จาก</span>
            <input
              type="date"
              value={f}
              max={t || undefined}
              onChange={(e) => setF(e.target.value)}
              className={field}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted">ถึง</span>
            <input
              type="date"
              value={t}
              min={f || undefined}
              onChange={(e) => setT(e.target.value)}
              className={field}
            />
          </label>
          <button
            type="button"
            onClick={applyCustom}
            disabled={!f || !t || f > t}
            className="btn-neon !px-4 !py-2 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ดูข้อมูล
          </button>
        </div>
      )}
    </div>
  );
}
