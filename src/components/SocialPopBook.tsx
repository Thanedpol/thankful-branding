"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useT } from "@/components/providers/AppProvider";
import { SOCIAL_PROFILES, type SocialProfile } from "@/lib/social";

/**
 * Social profiles as a 3D pop-up book: the spread opens as it scrolls into
 * view and a phone for each profile folds up off the page, one after another,
 * its screen lit in the platform's colours with a holographic sweep and
 * sparkles around the book. Pure CSS 3D — no extra library.
 *
 * Each phone is a real link, and the same links repeat as plain text below
 * the book, because a phone screen this size is decoration first.
 */

// Fixed positions so the server render and the browser agree.
const SPARKLES = [
  [6, 18, 0], [14, 72, 1.2], [22, 8, 2.1], [31, 88, 0.6], [44, 4, 1.7], [52, 92, 2.6],
  [61, 12, 0.3], [70, 80, 1.4], [78, 6, 2.3], [86, 70, 0.9], [93, 22, 1.9], [97, 58, 2.8],
  [38, 60, 3.1], [66, 40, 3.4], [12, 44, 2.7], [88, 44, 0.2],
] as const;

export default function SocialPopBook() {
  const t = useT();
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

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

  return (
    <div ref={ref} className="relative mx-auto w-full max-w-[560px]">
      <p className="mb-3 text-center font-mono text-[11px] uppercase tracking-[0.3em] text-[#ffd77a]">
        {t("social.heading")}
      </p>

      <div className={`popbook-scene ${open ? "is-open" : ""}`}>
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
            {SOCIAL_PROFILES.map((p, i) => (
              <Phone key={p.url} profile={p} index={i} />
            ))}
          </div>
        </div>
      </div>

      {/* readable, accessible copies of the same links */}
      <ul className="mt-4 flex flex-wrap justify-center gap-2">
        {SOCIAL_PROFILES.map((p) => (
          <li key={p.url}>
            <a
              href={p.url}
              target="_blank"
              rel="noopener noreferrer me"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-[#050a18]/85 px-3 py-1.5 text-xs text-white/85 backdrop-blur-md transition-colors hover:border-white/40 hover:text-white"
            >
              <PlatformIcon platform={p.platform} className="h-3.5 w-3.5" />
              {p.handle}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Phone({ profile: p, index }: { profile: SocialProfile; index: number }) {
  return (
    <a
      href={p.url}
      target="_blank"
      rel="noopener noreferrer me"
      aria-label={`${p.label} — ${p.handle}`}
      className={`popbook-phone popbook-phone--${p.platform}`}
      style={{ ["--i" as string]: index }}
    >
      <span className="popbook-phone-body">
        <span className="popbook-notch" aria-hidden />
        <span className="popbook-screen">
          <span className="popbook-screen-top">
            <PlatformIcon platform={p.platform} />
          </span>
          <span className="popbook-avatar">
            <Image src="/thankful-logo.png" alt="" fill sizes="64px" className="object-cover" />
          </span>
          <span className="popbook-name">{p.label}</span>
          <span className="popbook-handle">{p.handle}</span>
          <span className="popbook-follow">ติดตาม</span>
          <span className="popbook-sheen" aria-hidden />
        </span>
      </span>
      {/* the paper fold that holds the phone up off the page */}
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
