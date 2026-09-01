"use client";

import { useState } from "react";
import Image from "next/image";
import Reveal from "./Reveal";
import { useT } from "@/components/providers/AppProvider";
import type { SiteProfile } from "@/lib/types";

export default function About({ profile }: { profile: SiteProfile | null }) {
  const t = useT();
  const [imgOk, setImgOk] = useState(true);
  const showPhoto = !!profile?.avatar_url && imgOk;

  return (
    <section id="about" className="section-pad scroll-mt-20">
      <div className="grid items-center gap-12 md:grid-cols-[1fr_1.4fr]">
        <Reveal>
          <div className="relative mx-auto aspect-square w-full max-w-sm">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-cyan/40 to-purple/40 opacity-40 blur-xl" />
            <div className="glass relative h-full w-full overflow-hidden">
              {showPhoto ? (
                <Image
                  src={profile!.avatar_url!}
                  alt={profile?.name ?? "Thank Thanedpol"}
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="(max-width: 768px) 80vw, 400px"
                  onError={() => setImgOk(false)}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-grid-faint bg-grid">
                  <span className="font-display text-6xl text-gradient">TT</span>
                </div>
              )}
            </div>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <p className="eyebrow">{t("about.eyebrow")}</p>
          <h2 className="mb-4 font-display text-3xl font-bold md:text-4xl">
            {t("about.heading")}
          </h2>
          {/* Full portfolio as a standalone page — a static export in /public,
              so it opens instantly and stays readable on its own. */}
          <a
            href={profile?.portfolio_url || "/cv/portfolio.html"}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-neon mb-6 inline-flex !px-4 !py-2 text-xs"
          >
            {t("about.portfolio")} →
          </a>
          <p className="whitespace-pre-line text-lg leading-relaxed text-muted">
            {t("about.bio")}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
