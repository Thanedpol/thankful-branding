"use client";

import Link from "next/link";
import Reveal from "./Reveal";
import { YouTubeGrid, TikTokGrid } from "./HireCards";
import { useT } from "@/components/providers/AppProvider";
import { HIRE_CONTACT_EMAIL, HIRE_SERVICES, type HireItem } from "@/lib/hire";

// A bare mailto: does nothing without a mail app, so open a Gmail draft;
// the full set of options (copy, mail app) is on /sponsor#contact.
const HIRE_GMAIL_URL = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(HIRE_CONTACT_EMAIL)}&su=${encodeURIComponent("ติดต่อรับงาน Thankful")}`;

/**
 * "รับงาน" — services and a few sample clips, shown just before the featured
 * portfolio. The full list lives on /work; both are edited in Admin → Hire.
 */
const HOME_YOUTUBE = 4;
const HOME_TIKTOK = 4;

export default function HireSection({ items }: { items: HireItem[] }) {
  const t = useT();
  const youtube = items.filter((i) => i.kind === "youtube");
  const tiktok = items.filter((i) => i.kind === "tiktok");
  if (items.length === 0) return null;

  return (
    <section id="hire" className="section-pad scroll-mt-20 !pb-0">
      <Reveal className="space-plate mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{t("hire.eyebrow")}</p>
          <h2 className="font-display text-3xl font-bold md:text-4xl text-gradient">{t("hire.heading")}</h2>
          <p className="mt-3 max-w-xl text-muted">{t("hire.sub")}</p>
        </div>
        <a href={HIRE_GMAIL_URL} target="_blank" rel="noopener noreferrer" className="btn-neon shrink-0">
          {t("hire.contact")} →
        </a>
      </Reveal>

      <Reveal className="mb-10">
        <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">{t("hire.services")}</h3>
        <ol className="mt-4 grid gap-4 md:grid-cols-2">
          {HIRE_SERVICES.map((key, i) => (
            <li key={key} className="glass flex flex-col gap-3 rounded-2xl p-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-4">
                <span className="font-mono text-sm text-cyan">0{i + 1}</span>
                <div>
                  <p className="font-display text-lg font-bold leading-snug">{t(`hire.${key}.title`)}</p>
                  <p className="mt-1 text-sm text-muted">{t(`hire.${key}.detail`)}</p>
                </div>
              </div>
              <p className="shrink-0 pl-8 sm:pl-0 sm:text-right">
                <span className="block font-mono text-[11px] text-muted">{t("hire.from")}</span>
                <span className="font-display text-xl font-bold text-cyan">{t(`hire.${key}.price`)}</span>
              </p>
            </li>
          ))}
        </ol>
      </Reveal>

      <Reveal className="space-y-4">
        <YouTubeGrid items={youtube.slice(0, HOME_YOUTUBE)} />
        <TikTokGrid items={tiktok.slice(0, HOME_TIKTOK)} />
      </Reveal>
      <p className="mt-3 font-mono text-[11px] text-muted">{t("hire.hint")}</p>
      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
        <Link href="/work" className="btn-ghost">
          {t("hire.all")} ({items.length}) →
        </Link>
        <Link href="/sponsor" className="font-mono text-xs text-cyan hover:underline">
          {t("hire.mediakit")} →
        </Link>
      </div>
    </section>
  );
}
