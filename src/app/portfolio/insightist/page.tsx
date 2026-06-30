import Link from "next/link";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import { insightist } from "@/lib/insightist";

const total = insightist.groups.reduce((n, g) => n + g.events.length, 0);

export const metadata: Metadata = {
  title: `${insightist.title} — AI & Tech News Coverage | Thank Thanedpol`,
  description: insightist.intro,
  alternates: { canonical: "/portfolio/insightist" },
};

export default function InsightistPage() {
  const { title, tagline, intro, tags, groups } = insightist;

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-32">
        <div className="section-pad !pt-0">
          <Reveal>
            <Link
              href="/#portfolio"
              className="font-mono text-xs uppercase tracking-wider text-cyan/70 hover:text-cyan"
            >
              ← ผลงานทั้งหมด
            </Link>
            <span className="mt-4 inline-block tag">{insightist.category}</span>
            <h1 className="mt-3 font-display text-4xl font-bold md:text-5xl">
              <span className="text-gradient">{title}</span>
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-muted">{tagline}</p>
            <p className="mt-3 max-w-2xl leading-relaxed text-muted">{intro}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {tags.map((t) => (
                <span key={t} className="tag">
                  {t}
                </span>
              ))}
              <span className="tag !border-cyan/40 !text-cyan">{total} งาน</span>
            </div>
          </Reveal>

          <div className="mt-12 space-y-12 pb-24">
            {groups.map((group, gi) => (
              <Reveal key={group.name} delay={gi * 60}>
                <h2 className="mb-5 font-display text-xl font-bold text-cyan">
                  {group.name}
                  <span className="ml-2 font-mono text-xs text-muted">
                    ({group.events.length})
                  </span>
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {group.events.map((e) => (
                    <a
                      key={e.url}
                      href={e.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="glass glass-hover group flex h-full flex-col justify-between gap-4 p-5"
                    >
                      <p className="font-body font-medium leading-snug transition-colors group-hover:text-cyan">
                        {e.title}
                      </p>
                      <span className="font-mono text-xs uppercase tracking-wider text-cyan/70 group-hover:text-cyan">
                        ดูโพสต์ Facebook →
                      </span>
                    </a>
                  ))}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
