import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import { fetchCollection, collectionDefault } from "@/lib/portfolio-collections";

export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const c =
    (await fetchCollection("insightist")) ?? collectionDefault("insightist")!;
  return {
    title: `${c.title} — AI & Tech News Coverage | Thank Thanedpol`,
    description: c.intro ?? undefined,
    alternates: { canonical: "/portfolio/insightist" },
  };
}

export default async function InsightistPage() {
  const c =
    (await fetchCollection("insightist")) ?? collectionDefault("insightist")!;
  const { title, tagline, intro, tags, category } = c;
  const groups = c.data.groups ?? [];
  const total = groups
    .filter((g) => !g.popular)
    .reduce((n, g) => n + g.events.length, 0);

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-32">
        <div className="section-pad !pt-0">
          <Reveal>
            <Link
              href="/#portfolio"
              className="font-mono text-xs uppercase tracking-wider text-cyan hover:text-ink"
            >
              ← ผลงานทั้งหมด
            </Link>
            {category && <span className="mt-4 inline-block tag">{category}</span>}
            <h1 className="mt-3 font-display text-4xl font-bold md:text-5xl">
              <span className="text-gradient">{title}</span>
            </h1>
            {tagline && <p className="mt-4 max-w-2xl text-lg text-muted">{tagline}</p>}
            {intro && (
              <p className="mt-3 max-w-2xl leading-relaxed text-muted">{intro}</p>
            )}
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
              <Reveal key={group.name + gi} delay={gi * 60}>
                <h2 className="mb-5 font-display text-xl font-bold text-cyan">
                  {group.popular && <span className="text-purple">★ </span>}
                  {group.name}
                  <span className="ml-2 font-mono text-xs text-muted">
                    ({group.events.length})
                  </span>
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {group.events.map((e, ei) => (
                    <a
                      key={e.url + ei}
                      href={e.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="glass glass-hover group flex h-full flex-col overflow-hidden"
                    >
                      {e.image && (
                        <div className="relative aspect-video w-full shrink-0 overflow-hidden">
                          <Image
                            src={e.image}
                            alt={e.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            sizes="(max-width: 768px) 100vw, 33vw"
                          />
                        </div>
                      )}
                      <div className="flex flex-1 flex-col justify-between gap-4 p-5">
                        <p className="font-body font-medium leading-snug transition-colors group-hover:text-cyan">
                          {e.title}
                        </p>
                        <span className="font-mono text-xs uppercase tracking-wider text-cyan group-hover:text-ink">
                          ดูโพสต์ Facebook →
                        </span>
                      </div>
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
