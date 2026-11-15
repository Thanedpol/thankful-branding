"use client";

import { useApp } from "@/components/providers/AppProvider";
import type { SeriesFeed } from "@/lib/youtube";
import type { Localized } from "@/lib/passages";

/**
 * All the YouTube series side by side in a real <table>: group, what each one
 * covers, and its newest episode with the date. The network above is the
 * exploratory view; this is the one to scan and compare — and the one a
 * crawler or answer engine can read as rows and columns.
 */

const GROUP_KEY = { news: "cmp.news", learn: "cmp.learn", event: "cmp.event" } as const;

const fmtDate = (iso: string, locale: string) =>
  new Date(iso).toLocaleDateString(locale === "th" ? "th-TH" : locale === "zh" ? "zh-CN" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Bangkok",
  });

export default function SeriesCompare({ series, intro }: { series: SeriesFeed[]; intro: Localized }) {
  const { t, locale } = useApp();
  if (series.length === 0) return null;

  return (
    <section id="series-compare" aria-labelledby="compare-heading" className="section-pad scroll-mt-20 !pt-0">
      <div className="space-plate">
        <p className="eyebrow">{t("cmp.eyebrow")}</p>
        <h2 id="compare-heading" className="font-display text-2xl font-bold text-ink md:text-3xl">
          {t("cmp.heading")}
        </h2>
        <p id="series-summary" className="mt-3 max-w-3xl leading-relaxed text-muted">
          {intro[locale as keyof Localized] ?? intro.th}
        </p>

        {/* The table scrolls inside its own box on a phone; the page never does. */}
        <div className="mt-6 overflow-x-auto rounded-xl border border-line/10">
          <table className="w-full min-w-[44rem] border-collapse text-left text-sm">
            <caption className="sr-only">{t("cmp.heading")}</caption>
            <thead className="bg-ink/5 font-mono text-[11px] uppercase tracking-wider text-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">{t("cmp.series")}</th>
                <th scope="col" className="px-4 py-3 font-medium">{t("cmp.group")}</th>
                <th scope="col" className="px-4 py-3 font-medium">{t("cmp.about")}</th>
                <th scope="col" className="px-4 py-3 font-medium">{t("cmp.latest")}</th>
                <th scope="col" className="whitespace-nowrap px-4 py-3 font-medium">{t("cmp.date")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/10">
              {series.map((s) => {
                const v = s.videos[0];
                return (
                  <tr key={s.id} className="align-top">
                    <th scope="row" className="px-4 py-3 font-semibold text-ink">
                      <a
                        href={`https://www.youtube.com/playlist?list=${s.playlistId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-cyan hover:underline"
                      >
                        {s.title}
                      </a>
                    </th>
                    <td className="whitespace-nowrap px-4 py-3 text-muted">{t(GROUP_KEY[s.group])}</td>
                    <td className="px-4 py-3 text-muted">{s.blurb}</td>
                    <td className="px-4 py-3">
                      {v ? (
                        <a
                          href={`https://www.youtube.com/watch?v=${v.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="line-clamp-2 text-ink/90 hover:text-cyan hover:underline"
                        >
                          {v.title}
                        </a>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted">
                      {v ? <time dateTime={v.published}>{fmtDate(v.published, locale)}</time> : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
