"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Wraps children in a fade-up-on-scroll reveal via IntersectionObserver. */
export default function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const show = () => el.classList.add("in-view");
    if (typeof IntersectionObserver === "undefined") {
      show(); // no observer support — never leave content hidden
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        });
      },
      // threshold 0 — fire as soon as any part of the block enters the viewport.
      // A ratio threshold is unusable here: a block taller than
      // viewport / threshold can never expose that fraction of itself, so it
      // would stay at opacity 0 forever. The Insightist "AI Tools" group hit
      // exactly that once its 60 cards gained cover images (6334px tall vs a
      // 720px viewport — 11% visible at most, under the old 0.15).
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
