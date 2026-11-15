import type { ReactNode } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { LEGAL_UPDATED, legalPageJsonLd, breadcrumbJsonLd, jsonLdGraph } from "@/lib/seo";

/** Shared frame for /privacy and /terms: a plain reading page with a dated heading. */
export default function LegalPage({
  path,
  title,
  crumb,
  children,
}: {
  path: string;
  title: string;
  crumb: string;
  children: ReactNode;
}) {
  const updated = new Date(LEGAL_UPDATED).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Bangkok",
  });
  return (
    <>
      <JsonLd
        data={jsonLdGraph([
          legalPageJsonLd(path, title),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: crumb, path },
          ]),
        ])}
      />
      <Navbar />
      <main className="min-h-screen px-4 pb-16 pt-28 sm:px-6">
        <article className="reading-surface legal-prose mx-auto w-full max-w-3xl">
          <h1 className="font-display text-3xl font-bold text-ink md:text-4xl">{title}</h1>
          <div className="mt-2 font-mono text-xs text-muted">
            ปรับปรุงล่าสุด <time dateTime={LEGAL_UPDATED}>{updated}</time>
          </div>
          {children}
        </article>
      </main>
      <Footer />
    </>
  );
}
