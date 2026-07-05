"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export type CarouselEvent = {
  title: string;
  url: string;
  image?: string;
  body?: string;
  slug?: string;
};

function hasContent(html?: string) {
  return !!html && html.replace(/<[^>]*>/g, "").trim().length > 0;
}

/**
 * A group's sessions shown one at a time as a carousel: arrows, dots, keyboard
 * ←/→, and touch-swipe move between sessions, so a group with many posts reads
 * as a slideshow instead of one long scroll.
 */
export default function SessionCarousel({
  groupName,
  events,
  backHref,
  backLabel,
}: {
  groupName: string;
  events: CarouselEvent[];
  backHref: string;
  backLabel: string;
}) {
  const total = events.length;
  const [i, setI] = useState(0);
  const touchX = useRef<number | null>(null);
  const clamp = (n: number) => Math.max(0, Math.min(total - 1, n));
  const go = (d: number) => setI((c) => clamp(c + d));

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "ArrowLeft") setI((c) => Math.max(0, c - 1));
      else if (ev.key === "ArrowRight") setI((c) => Math.min(total - 1, c + 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [total]);

  const e = events[i];

  const ArrowBtn = ({
    dir,
    className,
  }: {
    dir: -1 | 1;
    className: string;
  }) => (
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
    <>
      <Navbar />
      <main className="min-h-screen pt-32">
        <div className="mx-auto max-w-4xl px-6 pb-24">
          <Link
            href={backHref}
            className="font-mono text-xs uppercase tracking-wider text-cyan hover:text-ink"
          >
            {backLabel}
          </Link>

          <h1 className="mt-4 font-display text-3xl font-bold leading-tight md:text-4xl">
            <span className="text-gradient">{groupName}</span>
          </h1>
          <p className="mt-2 font-mono text-xs uppercase tracking-wider text-muted">
            {total} session · เลื่อน ◀ ▶ เพื่อดูทีละงาน
          </p>

          {/* Carousel */}
          <div
            className="relative mt-8"
            onTouchStart={(ev) => (touchX.current = ev.touches[0].clientX)}
            onTouchEnd={(ev) => {
              if (touchX.current == null) return;
              const dx = ev.changedTouches[0].clientX - touchX.current;
              if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
              touchX.current = null;
            }}
          >
            {/* Side arrows (desktop) */}
            <ArrowBtn
              dir={-1}
              className="absolute -left-4 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-line/15 bg-space/80 font-display text-2xl text-cyan backdrop-blur transition-colors hover:border-cyan/50 hover:text-ink disabled:pointer-events-none disabled:opacity-25 md:flex lg:-left-6"
            />
            <ArrowBtn
              dir={1}
              className="absolute -right-4 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-line/15 bg-space/80 font-display text-2xl text-cyan backdrop-blur transition-colors hover:border-cyan/50 hover:text-ink disabled:pointer-events-none disabled:opacity-25 md:flex lg:-right-6"
            />

            {/* Slide (re-keyed so it re-animates on change) */}
            <div key={i} className="carousel-slide glass p-5 md:p-8">
              {e.image && (
                <div className="relative aspect-video w-full overflow-hidden rounded-xl">
                  <Image
                    src={e.image}
                    alt={e.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 896px) 100vw, 896px"
                    priority
                  />
                </div>
              )}
              <h2 className="mt-6 font-display text-2xl font-bold leading-snug">
                {e.title}
              </h2>
              {hasContent(e.body) && (
                <div
                  className="prose-cyber mt-4"
                  dangerouslySetInnerHTML={{ __html: e.body ?? "" }}
                />
              )}
              {e.url && (
                <a
                  href={e.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-neon mt-6"
                >
                  ดูโพสต์ Facebook →
                </a>
              )}
            </div>
          </div>

          {/* Dots + counter */}
          <div className="mt-6 flex items-center justify-center gap-3">
            <ArrowBtn
              dir={-1}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-line/15 font-display text-lg text-cyan transition-colors hover:border-cyan/50 hover:text-ink disabled:opacity-25"
            />
            <div className="flex max-w-[60vw] flex-wrap justify-center gap-1.5">
              {events.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setI(idx)}
                  aria-label={`session ${idx + 1}`}
                  aria-current={idx === i}
                  className={`h-2 rounded-full transition-all ${
                    idx === i
                      ? "w-5 bg-cyan"
                      : "w-2 bg-line/25 hover:bg-line/50"
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
        </div>
      </main>
      <Footer />
    </>
  );
}
