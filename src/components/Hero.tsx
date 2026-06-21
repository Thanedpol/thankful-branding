"use client";

import Link from "next/link";
import ParticleField from "./ParticleField";
import GlitchText from "./GlitchText";
import { useT } from "@/components/providers/AppProvider";
import type { SiteProfile } from "@/lib/types";

export default function Hero({ profile }: { profile: SiteProfile | null }) {
  const t = useT();
  const name = profile?.name ?? "Thank Thanedpol";

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-grid-faint bg-grid opacity-60" />
      <div className="absolute inset-0 bg-radial-fade" />
      <ParticleField />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-space" />

      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        <h1 className="text-5xl font-bold leading-[1.05] tracking-tight sm:text-7xl md:text-8xl">
          <GlitchText text={name} />
        </h1>

        <p className="mx-auto mt-8 max-w-2xl text-lg text-muted md:text-xl">
          {t("hero.tagline")}
        </p>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
          <Link href="/#portfolio" className="btn-neon">
            {t("hero.viewWork")}
          </Link>
          <Link href="/press-kit" className="btn-ghost">
            {t("hero.pressKit")}
          </Link>
        </div>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-float">
        <div className="flex h-10 w-6 items-start justify-center rounded-full border border-cyan/30 p-1.5">
          <div className="h-2 w-1 rounded-full bg-cyan animate-pulse-glow" />
        </div>
      </div>
    </section>
  );
}
