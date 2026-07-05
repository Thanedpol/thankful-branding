"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { EventSession } from "@/lib/portfolio-sessions";
import { hasContent, inlineEmojiImages } from "@/lib/portfolio-sessions";

/**
 * Carousel of an event's sub-sessions (sub-blogs): each slide is one session
 * (title, image, rich body, optional link). Arrows, clickable dots, a counter,
 * keyboard ←/→ and touch-swipe move between them. With a single session the
 * controls are hidden and it just renders the one slide.
 */
export default function SessionCarousel({ items }: { items: EventSession[] }) {
  const total = items.length;
  const [i, setI] = useState(0);
  const touchX = useRef<number | null>(null);
  const clamp = (n: number) => Math.max(0, Math.min(total - 1, n));
  const go = (d: number) => setI((c) => clamp(c + d));
  const many = total > 1;

  useEffect(() => {
    if (!many) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "ArrowLeft") setI((c) => Math.max(0, c - 1));
      else if (ev.key === "ArrowRight") setI((c) => Math.min(total - 1, c + 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [total, many]);

  const s = items[i];

  const ArrowBtn = ({ dir, className }: { dir: -1 | 1; className: string }) => (
    <button
      type="button"
      onClick={() => go(dir)}
      disabled={dir === -1 ? i === 0 : i === total - 1}
      aria-label={dir === -1 ? "ก่อนหน้า" : "ถัดไป"}
      className={className}
    >
      {dir === -1 ? "‹" : "›"}
    </button>
  );

  return (
    <div>
      {many && (
        <p className="mb-3 font-mono text-xs uppercase tracking-wider text-muted">
          {total} session · เลื่อน ◀ ▶ เพื่อดูทีละอัน
        </p>
      )}

      <div
        className="relative"
        onTouchStart={(ev) => (touchX.current = ev.touches[0].clientX)}
        onTouchEnd={(ev) => {
          if (touchX.current == null) return;
          const dx = ev.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
          touchX.current = null;
        }}
      >
        {many && (
          <>
            <ArrowBtn
              dir={-1}
              className="absolute -left-4 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-line/15 bg-space/80 font-display text-2xl text-cyan backdrop-blur transition-colors hover:border-cyan/50 hover:text-ink disabled:pointer-events-none disabled:opacity-25 md:flex lg:-left-6"
            />
            <ArrowBtn
              dir={1}
              className="absolute -right-4 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-line/15 bg-space/80 font-display text-2xl text-cyan backdrop-blur transition-colors hover:border-cyan/50 hover:text-ink disabled:pointer-events-none disabled:opacity-25 md:flex lg:-right-6"
            />
          </>
        )}

        {/* Slide (re-keyed so it re-animates on change) */}
        <div key={i} className="carousel-slide glass p-5 md:p-8">
          {s.title && s.title.trim() && (
            <h2 className="mb-4 font-display text-2xl font-bold leading-snug">
              {s.title}
            </h2>
          )}
          {s.image && (
            <div className="relative aspect-video w-full overflow-hidden rounded-xl">
              <Image
                src={s.image}
                alt={s.title || ""}
                fill
                className="object-cover"
                sizes="(max-width: 896px) 100vw, 896px"
              />
            </div>
          )}
          {hasContent(s.body) && (
            <div
              className={`prose-cyber ${s.image ? "mt-6" : ""}`}
              dangerouslySetInnerHTML={{ __html: inlineEmojiImages(s.body) }}
            />
          )}
          {s.url && (
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-neon mt-6"
            >
              ดูโพสต์ Facebook →
            </a>
          )}
        </div>
      </div>

      {many && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <ArrowBtn
            dir={-1}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-line/15 font-display text-lg text-cyan transition-colors hover:border-cyan/50 hover:text-ink disabled:opacity-25"
          />
          <div className="flex max-w-[60vw] flex-wrap justify-center gap-1.5">
            {items.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setI(idx)}
                aria-label={`session ${idx + 1}`}
                aria-current={idx === i}
                className={`h-2 rounded-full transition-all ${
                  idx === i ? "w-5 bg-cyan" : "w-2 bg-line/25 hover:bg-line/50"
                }`}
              />
            ))}
          </div>
          <ArrowBtn
            dir={1}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-line/15 font-display text-lg text-cyan transition-colors hover:border-cyan/50 hover:text-ink disabled:opacity-25"
          />
          <span className="ml-1 shrink-0 font-mono text-xs text-muted">
            {i + 1} / {total}
          </span>
        </div>
      )}
    </div>
  );
}
