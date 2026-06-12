"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import Reveal from "./Reveal";
import { useT } from "@/components/providers/AppProvider";
import type { Portfolio } from "@/lib/types";

export default function PortfolioSection({ items }: { items: Portfolio[] }) {
  const t = useT();
  const [active, setActive] = useState<Portfolio | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setActive(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = active ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [active]);

  return (
    <section id="portfolio" className="section-pad scroll-mt-20">
      <Reveal>
        <p className="eyebrow">{t("portfolio.eyebrow")}</p>
        <h2 className="mb-12 font-display text-3xl font-bold md:text-4xl text-gradient">
          {t("portfolio.heading")}
        </h2>
      </Reveal>

      {items.length === 0 ? (
        <p className="font-mono text-sm text-muted">{t("portfolio.empty")}</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p, i) => (
            <Reveal key={p.id} delay={i * 80}>
              <button
                onClick={() => setActive(p)}
                className="glass glass-hover group block w-full overflow-hidden text-left"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  {p.thumbnail_url ? (
                    <Image
                      src={p.thumbnail_url}
                      alt={p.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-grid-faint bg-grid">
                      <span className="font-display text-3xl text-ink/20">
                        {p.category}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-space/80 to-transparent" />
                  <span className="absolute left-3 top-3 tag">{p.category}</span>
                </div>
                <div className="p-5">
                  <h3 className="font-display text-lg font-bold transition-colors group-hover:text-cyan">
                    {p.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">
                    {p.description}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {p.tech_tags.slice(0, 3).map((t) => (
                      <span key={t} className="tag">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            </Reveal>
          ))}
        </div>
      )}

      {/* Modal */}
      {active && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-8"
          onClick={() => setActive(null)}
        >
          <div className="absolute inset-0 bg-space/80 backdrop-blur-sm" />
          <div
            className="glass relative z-10 max-h-[90vh] w-full max-w-3xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActive(null)}
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-line/10 bg-space/60 text-cyan transition-colors hover:border-cyan/50"
              aria-label="Close"
            >
              ✕
            </button>

            {active.thumbnail_url && (
              <div className="relative aspect-video w-full overflow-hidden rounded-t-2xl">
                <Image
                  src={active.thumbnail_url}
                  alt={active.title}
                  fill
                  className="object-cover"
                  sizes="100vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-space to-transparent" />
              </div>
            )}

            <div className="p-8">
              <span className="tag">{active.category}</span>
              <h3 className="mt-3 font-display text-2xl font-bold md:text-3xl">
                {active.title}
              </h3>
              <p className="mt-4 leading-relaxed text-muted">
                {active.description}
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {active.tech_tags.map((t) => (
                  <span key={t} className="tag">
                    {t}
                  </span>
                ))}
              </div>

              {active.project_url && (
                <a
                  href={active.project_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-neon mt-8"
                >
                  {t("project.visit")}
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
