"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useT } from "@/components/providers/AppProvider";
import { SOCIAL_PROFILES, type SocialProfile } from "@/lib/social";

/**
 * Social profiles as a 3D pop-up book with a carousel on its pages: one phone
 * stands centre stage at full opacity while its neighbours lean away behind it
 * at 25%. Drag (mouse or finger), use the arrows, the dots or the keyboard to
 * turn it; opacity follows the live position, so a phone brightens as it
 * slides into the middle and dims as it passes. Pure CSS 3D — no library.
 */

const N = SOCIAL_PROFILES.length;
const SIDE_OPACITY = 0.25;

// Fixed positions so the server render and the browser agree.
const SPARKLES = [
  [6, 18, 0], [14, 72, 1.2], [22, 8, 2.1], [31, 88, 0.6], [44, 4, 1.7], [52, 92, 2.6],
  [61, 12, 0.3], [70, 80, 1.4], [78, 6, 2.3], [86, 70, 0.9], [93, 22, 1.9], [97, 58, 2.8],
  [38, 60, 3.1], [66, 40, 3.4], [12, 44, 2.7], [88, 44, 0.2],
] as const;

/** Signed distance from the centre, wrapped so the ring has no ends: −N/2…N/2. */
function offsetOf(i: number, pos: number) {
  let d = (((i - pos) % N) + N) % N;
  if (d > N / 2) d -= N;
  return d;
}

export default function SocialPopBook() {
  const t = useT();
  const ref = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(0); // fractional carousel position; integer = a phone centred

  const posRef = useRef(0);
  const anim = useRef<number | null>(null);
  const drag = useRef<{ x: number; start: number; moved: number; id: number } | null>(null);
  const lastDragMoved = useRef(0); // survives pointerup, read by the click that follows
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setOpen(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setOpen(true);
          io.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => () => void (anim.current && cancelAnimationFrame(anim.current)), []);

  const apply = (p: number) => {
    posRef.current = p;
    setPos(p);
  };

  /** Ease to a resting index (unbounded — the ring wraps visually). */
  const glideTo = useCallback((target: number) => {
    if (anim.current) cancelAnimationFrame(anim.current);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return apply(target);
    const step = () => {
      const p = posRef.current;
      const next = p + (target - p) * 0.18;
      if (Math.abs(target - next) < 0.002) {
        apply(target);
        anim.current = null;
        return;
      }
      apply(next);
      anim.current = requestAnimationFrame(step);
    };
    anim.current = requestAnimationFrame(step);
  }, []);

  const go = (delta: number) => glideTo(Math.round(posRef.current) + delta);
  const goToIndex = (i: number) => {
    const p = posRef.current;
    glideTo(p + offsetOf(i, p)); // shortest way round
  };

  // ─ dragging ─
  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (anim.current) cancelAnimationFrame(anim.current);
    drag.current = { x: e.clientX, start: posRef.current, moved: 0, id: e.pointerId };
    lastDragMoved.current = 0;
  }
  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    d.moved = Math.max(d.moved, Math.abs(dx));
    // Capture only once it is really a drag: capturing on pointerdown would
    // retarget the click to the stage, and tapping a phone would stop opening it.
    if (d.moved > 6 && !e.currentTarget.hasPointerCapture(d.id)) {
      e.currentTarget.setPointerCapture(d.id);
      setDragging(true);
    }
    // one phone's travel ≈ 28% of the stage width
    const w = sceneRef.current?.offsetWidth ?? 500;
    apply(d.start - dx / (w * 0.28));
  }
  function endDrag() {
    if (!drag.current) return;
    lastDragMoved.current = drag.current.moved;
    drag.current = null;
    setDragging(false);
    glideTo(Math.round(posRef.current));
  }

  const active = ((Math.round(pos) % N) + N) % N;

  return (
    <div ref={ref} className="relative mx-auto w-full max-w-[560px]">
      <p className="mb-3 text-center font-mono text-[11px] uppercase tracking-[0.3em] text-[#ffd77a]">
        {t("social.heading")}
      </p>

      <div
        ref={sceneRef}
        className={`popbook-scene select-none ${open ? "is-open" : ""}`}
        style={{ touchAction: "pan-y", cursor: dragging ? "grabbing" : "grab" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onLostPointerCapture={endDrag}
        role="region"
        aria-roledescription="carousel"
        aria-label={t("social.heading")}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") go(1);
          else if (e.key === "ArrowLeft") go(-1);
        }}
      >
        {SPARKLES.map(([x, y, d], i) => (
          <span
            key={i}
            aria-hidden
            className="popbook-sparkle"
            style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${d}s` }}
          />
        ))}

        <div className="popbook">
          <div className="popbook-page popbook-page--left" aria-hidden />
          <div className="popbook-page popbook-page--right" aria-hidden />
          <div className="popbook-spine" aria-hidden />

          <div className="popbook-phones">
            {SOCIAL_PROFILES.map((p, i) => {
              const d = offsetOf(i, pos);
              const a = Math.abs(d);
              // full at the centre, 25% one step out; the phone wrapping round
              // the back fades away so it never jumps across the stage
              const o = a <= 1 ? 1 - (1 - SIDE_OPACITY) * a : SIDE_OPACITY * Math.max(0, 1 - (a - 1) * 1.6);
              return (
                <div
                  key={p.url}
                  className="popbook-slot"
                  style={{
                    ["--x" as string]: `${d * 95}%`,
                    ["--y" as string]: `${-Math.min(a, 1.5) * 26}%`, // back along the page, away from the viewer
                    ["--ry" as string]: `${-d * 32}deg`,
                    ["--s" as string]: 1 - Math.min(a, 1.5) * 0.16,
                    ["--o" as string]: o,
                    zIndex: Math.round(10 - a * 3),
                    pointerEvents: a > 1.5 ? "none" : undefined,
                  }}
                >
                  <Phone
                    profile={p}
                    index={i}
                    centred={a < 0.5}
                    onPick={() => {
                      // a drag must not count as a tap
                      if (lastDragMoved.current > 6) return false;
                      if (a >= 0.5) {
                        goToIndex(i);
                        return false; // side phone: bring it to the centre first
                      }
                      return true;
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <button type="button" aria-label="ก่อนหน้า" className="popbook-arrow popbook-arrow--prev" onPointerDown={(e) => e.stopPropagation()} onClick={() => go(-1)}>
          ‹
        </button>
        <button type="button" aria-label="ถัดไป" className="popbook-arrow popbook-arrow--next" onPointerDown={(e) => e.stopPropagation()} onClick={() => go(1)}>
          ›
        </button>
      </div>

      {/* the centred profile, readable, plus dots to jump */}
      <div className="mt-3 flex flex-col items-center gap-2.5">
        <a
          href={SOCIAL_PROFILES[active].url}
          target="_blank"
          rel="noopener noreferrer me"
          className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-[#050a18]/85 px-4 py-2 text-sm text-white backdrop-blur-md transition-colors hover:border-white/50"
        >
          <PlatformIcon platform={SOCIAL_PROFILES[active].platform} className="h-4 w-4" />
          <span className="font-semibold">{SOCIAL_PROFILES[active].label}</span>
          <span className="text-white/70">{SOCIAL_PROFILES[active].handle}</span>
          <span aria-hidden>↗</span>
        </a>
        <div className="flex gap-2" role="tablist" aria-label="เลือกช่องทาง">
          {SOCIAL_PROFILES.map((p, i) => (
            <button
              key={p.url}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`${p.label} ${p.handle}`}
              onClick={() => goToIndex(i)}
              className={`h-2 rounded-full transition-all ${i === active ? "w-6 bg-[#ffd77a]" : "w-2 bg-white/30 hover:bg-white/60"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Phone({
  profile: p,
  index,
  centred,
  onPick,
}: {
  profile: SocialProfile;
  index: number;
  centred: boolean;
  onPick: () => boolean;
}) {
  return (
    <a
      href={p.url}
      target="_blank"
      rel="noopener noreferrer me"
      aria-label={`${p.label} — ${p.handle}`}
      tabIndex={centred ? 0 : -1}
      draggable={false}
      onClick={(e) => {
        if (!onPick()) e.preventDefault();
      }}
      className={`popbook-phone popbook-phone--${p.platform} ${centred ? "is-centred" : ""}`}
      style={{ ["--i" as string]: index }}
    >
      {/* turns the phone about its own upright axis, after it has stood up */}
      <span className="popbook-yaw">
      <span className="popbook-phone-body">
        <span className="popbook-notch" aria-hidden />
        <span className="popbook-screen">
          <span className="popbook-screen-top">
            <PlatformIcon platform={p.platform} />
          </span>
          <span className="popbook-avatar">
            <Image src="/thankful-logo.png" alt="" fill sizes="96px" className="object-cover" draggable={false} />
          </span>
          <span className="popbook-name">{p.label}</span>
          <span className="popbook-handle">{p.handle}</span>
          <span className="popbook-follow">ติดตาม</span>
          <span className="popbook-sheen" aria-hidden />
        </span>
      </span>
      </span>
      <span className="popbook-hinge" aria-hidden />
    </a>
  );
}

function PlatformIcon({ platform, className = "" }: { platform: SocialProfile["platform"]; className?: string }) {
  if (platform === "instagram")
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4.2" />
        <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
      </svg>
    );
  if (platform === "facebook")
    return (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
        <path d="M13.5 21v-7.6h2.6l.4-3h-3V8.5c0-.9.3-1.5 1.6-1.5h1.6V4.3c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.9v3h2.6V21h3z" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M16.6 3c.4 2 1.6 3.3 3.6 3.5v3.2c-1.3.1-2.5-.3-3.6-1v6.1c0 3.4-2.7 6.2-6.2 6.2S4.2 18.2 4.2 14.8s2.8-6.1 6.3-6.1c.3 0 .6 0 .9.1v3.3a3 3 0 0 0-.9-.1 2.9 2.9 0 1 0 2.9 2.9V3h3.2z" />
    </svg>
  );
}
