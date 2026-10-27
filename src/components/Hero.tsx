"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import EarthPlaceholder from "./space/EarthPlaceholder";
import { useT } from "@/components/providers/AppProvider";
import type { SiteProfile } from "@/lib/types";

const PILLARS = ["AI", "SCIENCE", "BUSINESS", "TECHNOLOGY"];

// three.js only runs in the browser and is heavy; load it after the copy so
// the headline paints first, with a glowing placeholder in its place.
const EarthScene = dynamic(() => import("./space/EarthScene"), {
  ssr: false,
  loading: () => (
    <div className="relative aspect-square w-full">
      <EarthPlaceholder />
    </div>
  ),
});

/**
 * Space-themed hero: a 3D Earth in golden orbits and the curve of the planet
 * glowing along the bottom edge. The starfield itself is the page-wide
 * SpaceBackdrop, so the hero is transparent and the sky runs on unbroken
 * into the sections below.
 */
export default function Hero({ profile }: { profile: SiteProfile | null }) {
  const t = useT();
  const name = profile?.name ?? "Thank Thanedpol";

  return (
    <section className="relative isolate flex min-h-screen items-center overflow-hidden pb-24 pt-28 text-white md:pt-24">
      {/* a far galaxy, turning very slowly — squashed on the outer box so the
          spin on the inner one doesn't overwrite the tilt */}
      <div
        aria-hidden
        className="pointer-events-none absolute right-[3%] top-[14%] -z-10 hidden aspect-square w-[11vw] max-w-[170px] opacity-80 md:block"
        style={{ transform: "scaleY(0.55) rotate(-20deg)" }}
      >
        <div
          className="space-spin h-full w-full rounded-full"
          style={{
            ["--dur" as string]: "160s",
            background:
              "radial-gradient(circle, #fff 0%, #ffd8f0 6%, rgba(220,120,255,0.55) 16%, transparent 34%)," +
              "conic-gradient(from 0deg, transparent 0deg, rgba(190,120,255,0.55) 40deg, transparent 90deg, rgba(120,150,255,0.45) 200deg, transparent 250deg)",
            filter: "blur(2px)",
          }}
        />
      </div>

      {/* the curve of the planet along the bottom, with a sunrise on its rim */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[46%]">
        <div
          className="absolute left-[-35%] top-[38%] h-[220%] w-[150%] rounded-[50%]"
          style={{
            background:
              "radial-gradient(ellipse 50% 50% at 50% 50%, #071027 0%, #050b1c 60%, #03060f 100%)",
            boxShadow:
              "0 -2px 0 rgba(140,200,255,0.55), 0 -10px 40px rgba(70,150,255,0.55), 0 -40px 120px rgba(40,110,255,0.35)",
          }}
        />
        <div
          className="space-flare absolute left-[38%] top-[38%] h-40 -translate-x-1/2 -translate-y-1/2 w-[34rem] max-w-[70vw] rounded-full"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(255,240,210,0.95) 0%, rgba(255,190,90,0.55) 12%, rgba(255,150,60,0.18) 35%, transparent 65%)",
            filter: "blur(1px)",
          }}
        />
      </div>

      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-6 px-6 md:grid-cols-[1.05fr_1fr] md:gap-4">
        {/* copy — on a feathered dark plate so it never sinks into the stars */}
        <div className="relative order-2 md:order-1">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-x-10 -inset-y-12 -z-10 rounded-[3rem]"
            style={{
              background:
                "radial-gradient(ellipse 70% 62% at 42% 50%, rgba(3,6,15,0.78) 0%, rgba(3,6,15,0.55) 55%, transparent 100%)",
            }}
          />
          <p className="space-rise font-mono text-xs uppercase tracking-[0.55em] text-[#f5c45e] sm:text-sm">
            Thankful
          </p>

          <h1
            className="space-rise mt-5 font-display font-bold leading-[1.02] tracking-tight"
            style={{ animationDelay: "0.08s" }}
          >
            <span className="block text-[2.6rem] text-white drop-shadow-[0_0_24px_rgba(120,180,255,0.35)] sm:text-6xl lg:text-7xl">
              BEYOND AI<span className="text-[#f5c45e]">.</span>
            </span>
            <span className="mt-1 block bg-gradient-to-r from-[#ffd77a] via-[#f5b941] to-[#ffcf6b] bg-clip-text text-[2.15rem] text-transparent sm:text-5xl lg:text-[4rem]">
              EXPLORE THE UNIVERSE.
            </span>
            <span className="sr-only"> — {name}</span>
          </h1>

          <p
            className="space-rise mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] tracking-[0.42em] text-white/85 sm:text-sm"
            style={{ animationDelay: "0.16s" }}
          >
            {PILLARS.map((p, i) => (
              <span key={p} className="flex items-center gap-3">
                {i > 0 && <span className="text-white/50">•</span>}
                {p}
              </span>
            ))}
          </p>

          <p
            className="space-rise mt-5 max-w-xl text-sm leading-relaxed text-white/75 sm:text-base"
            style={{ animationDelay: "0.22s" }}
          >
            {t("hero.tagline")}
          </p>

          <div className="space-rise mt-9 flex flex-wrap items-center gap-4" style={{ animationDelay: "0.3s" }}>
            <Link
              href="/blog"
              className="group inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-[#1f6bff] to-[#3c8dff] py-2.5 pl-2.5 pr-7 font-semibold text-white shadow-[0_0_28px_rgba(50,130,255,0.55)] transition-shadow hover:shadow-[0_0_40px_rgba(70,150,255,0.8)]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-white/10 transition-transform group-hover:translate-x-0.5">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                  <path d="M7 17 17 7M9 7h8v8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              {t("hero.explore")}
            </Link>
            <Link
              href="/#portfolio"
              className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-[#050a18]/80 px-7 py-3.5 font-semibold text-white backdrop-blur-md transition-colors hover:border-white hover:bg-[#0b1530]/90"
            >
              {t("hero.viewWork")}
            </Link>
          </div>
        </div>

        {/* the solar system */}
        <div className="order-1 mx-auto w-[min(92vw,440px)] md:order-2 md:w-full md:max-w-[680px]">
          <EarthScene />
        </div>
      </div>

    </section>
  );
}
