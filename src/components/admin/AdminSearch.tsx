"use client";

/**
 * Compact search box for admin list views. Controlled — the parent owns the
 * query string and filters its own list. Sits next to the "+ New" button.
 */
export default function AdminSearch({
  value,
  onChange,
  placeholder = "ค้นหา…",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative w-full sm:w-72">
      <svg
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-line/10 bg-surface/[0.03] py-2 pl-9 pr-8 text-sm text-ink placeholder:text-ink/30 outline-none focus:border-cyan/50"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="ล้างการค้นหา"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-1 font-mono text-xs text-ink/40 hover:text-cyan"
        >
          ✕
        </button>
      )}
    </div>
  );
}
