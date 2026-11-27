"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AI_CATEGORIES, type AiCategory, type AiOrigin, type AiTool } from "@/lib/ai-directory";

type OriginFilter = "all" | AiOrigin;

const ORIGINS: { id: OriginFilter; label: string }[] = [
  { id: "all", label: "ทั้งหมด" },
  { id: "th", label: "ฝีมือคนไทย" },
  { id: "intl", label: "ต่างประเทศ" },
];

const catLabel = (id: AiCategory) => AI_CATEGORIES.find((c) => c.id === id)?.label ?? id;

const haystack = (t: AiTool) =>
  [t.name, t.maker, t.desc, t.keys ?? "", ...t.cats.map(catLabel), t.origin === "th" ? "ไทย คนไทย thai" : "ต่างประเทศ"]
    .join(" ")
    .toLowerCase();

/** Every word typed must appear somewhere on the entry. */
function matches(text: string, query: string) {
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => text.includes(word));
}

export default function AiDirectory({ tools }: { tools: AiTool[] }) {
  const [query, setQuery] = useState("");
  const [origin, setOrigin] = useState<OriginFilter>("all");
  const [cat, setCat] = useState<AiCategory | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const ready = useRef(false);

  const indexed = useMemo(() => tools.map((t) => ({ t, text: haystack(t) })), [tools]);

  // A shared link restores its search: ?q=…&from=th&cat=voice
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const from = p.get("from");
    const c = p.get("cat");
    setQuery(p.get("q") ?? "");
    if (from === "th" || from === "intl") setOrigin(from);
    if (AI_CATEGORIES.some((x) => x.id === c)) setCat(c as AiCategory);
  }, []);

  useEffect(() => {
    if (!ready.current) {
      ready.current = true;
      return;
    }
    const p = new URLSearchParams();
    if (query.trim()) p.set("q", query.trim());
    if (origin !== "all") p.set("from", origin);
    if (cat) p.set("cat", cat);
    const qs = p.toString();
    window.history.replaceState(window.history.state, "", qs ? `?${qs}` : window.location.pathname);
  }, [query, origin, cat]);

  // "/" jumps to the search box, Esc clears it.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName);
      if (e.key === "/" && !typing) {
        e.preventDefault();
        input.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const byQuery = indexed.filter((x) => matches(x.text, query));
  const byCat = byQuery.filter((x) => !cat || x.t.cats.includes(cat));
  const shown = byCat.filter((x) => origin === "all" || x.t.origin === origin).map((x) => x.t);
  // Counts answer "what do I get if I press this", given the other filters.
  const originCount = (id: OriginFilter) => byCat.filter((x) => id === "all" || x.t.origin === id).length;
  const catCount = (id: AiCategory) =>
    byQuery.filter((x) => x.t.cats.includes(id) && (origin === "all" || x.t.origin === origin)).length;

  const filtered = query.trim() !== "" || origin !== "all" || cat !== null;
  const reset = () => {
    setQuery("");
    setOrigin("all");
    setCat(null);
    input.current?.focus();
  };

  return (
    <div>
      <div role="search" className="glass !rounded-2xl p-4 sm:p-5">
        <label htmlFor="ai-q" className="sr-only">
          ค้นหาเครื่องมือ AI
        </label>
        <div className="relative">
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" strokeLinecap="round" />
          </svg>
          <input
            ref={input}
            id="ai-q"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setQuery("");
            }}
            placeholder="อยากทำอะไร? เช่น ถอดเสียง"
            autoComplete="off"
            className="w-full rounded-xl border border-line/15 bg-surface/[0.04] py-4 pl-12 pr-4 text-base text-ink outline-none placeholder:text-muted focus:border-cyan/60 focus:ring-2 focus:ring-cyan/20 sm:text-lg"
          />
        </div>

        <div role="group" aria-label="ผู้พัฒนา" className="mt-4 grid grid-cols-3 gap-1 rounded-xl border border-line/10 p-1 sm:inline-grid">
          {ORIGINS.map((o) => (
            <button
              key={o.id}
              type="button"
              aria-pressed={origin === o.id}
              onClick={() => setOrigin(o.id)}
              className={`rounded-lg px-2 py-2.5 text-sm font-semibold transition-colors sm:px-5 ${
                origin === o.id ? "bg-cyan/15 text-cyan" : "text-muted hover:bg-surface/[0.06] hover:text-ink"
              }`}
            >
              {o.label} <span className="block font-mono text-xs font-normal sm:inline">{originCount(o.id)}</span>
            </button>
          ))}
        </div>

        {/* One swipeable row on phones so results stay near the top. */}
        <div
          role="group"
          aria-label="หมวดงาน"
          className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden"
        >
          {AI_CATEGORIES.map((c) => {
            const on = cat === c.id;
            const n = catCount(c.id);
            return (
              <button
                key={c.id}
                type="button"
                aria-pressed={on}
                onClick={() => setCat(on ? null : c.id)}
                className={`shrink-0 whitespace-nowrap rounded-full border px-3.5 py-2 text-sm transition-colors ${
                  on
                    ? "border-cyan bg-cyan/15 text-cyan"
                    : n === 0
                    ? "border-line/10 text-muted/50"
                    : "border-line/15 text-ink/85 hover:border-cyan/50 hover:text-cyan"
                }`}
              >
                {c.label} <span className="font-mono text-[11px] text-muted">{n}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 flex min-h-8 flex-wrap items-center justify-between gap-3">
        <p role="status" className="text-sm text-muted">
          พบ <span className="font-semibold text-ink">{shown.length}</span> จาก {tools.length} รายการ
        </p>
        {filtered && (
          <button type="button" onClick={reset} className="text-sm text-cyan hover:underline">
            ล้างตัวกรอง ✕
          </button>
        )}
      </div>

      {shown.length === 0 ? (
        <div className="glass mt-3 !rounded-2xl p-10 text-center">
          <p className="font-semibold text-ink">ไม่พบเครื่องมือที่ตรงกับที่ค้นหา</p>
          <p className="mt-1 text-sm text-muted">ลองใช้คำที่สั้นลง หรือเลือกหมวดงานแทน</p>
          <button type="button" onClick={reset} className="btn-ghost mt-5">
            ดูทั้งหมด
          </button>
        </div>
      ) : (
        <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((t) => (
            <li key={t.url}>
              <a
                href={t.url}
                target="_blank"
                rel="noopener noreferrer"
                className="glass group flex h-full flex-col !rounded-2xl p-5 transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"
              >
                <span className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-display text-lg font-bold ${
                      t.origin === "th" ? "bg-amber-400/15 text-amber-500" : "bg-cyan/15 text-cyan"
                    }`}
                  >
                    {t.name.charAt(0)}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-display text-base font-bold leading-snug text-ink group-hover:text-cyan">
                      {t.name}
                    </span>
                    <span className="block truncate text-xs text-muted">{t.maker}</span>
                  </span>
                </span>
                <span className="mt-3 block flex-1 text-sm leading-relaxed text-ink/80">{t.desc}</span>
                <span className="mt-4 flex items-center justify-between gap-2 text-xs">
                  <span className="flex flex-wrap gap-1.5">
                    <span
                      className={`rounded-full border px-2.5 py-1 ${
                        t.origin === "th" ? "border-amber-400/50 text-amber-500" : "border-line/20 text-muted"
                      }`}
                    >
                      {t.origin === "th" ? "ฝีมือคนไทย" : "ต่างประเทศ"}
                    </span>
                    <span className="rounded-full border border-line/15 px-2.5 py-1 text-muted">{catLabel(t.cats[0])}</span>
                  </span>
                  <span className="shrink-0 text-muted group-hover:text-cyan">
                    เปิดเว็บ ↗<span className="sr-only"> (แท็บใหม่)</span>
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
