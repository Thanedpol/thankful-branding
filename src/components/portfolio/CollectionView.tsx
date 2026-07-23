import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import type { PortfolioCollection } from "@/lib/types";
import { eventHasContent, inlineEmojiImages } from "@/lib/portfolio-sessions";

/** Compact number for metric chips: 1250 → "1.2K", 2_400_000 → "2.4M". */
function fmtNum(n?: number): string | null {
  if (typeof n !== "number" || !Number.isFinite(n)) return null;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

/** Full portfolio collection page — renders a stories layout (Snobby-style) or
 *  a grouped-events layout (Insightist-style) from the same data shape. Shared
 *  by the fixed pages and the dynamic /portfolio/[collection] route. */
export default function CollectionView({ c }: { c: PortfolioCollection }) {
  const stories = c.data.stories;
  const groups = c.data.groups;
  const total = groups
    ? groups.filter((g) => !g.popular).reduce((n, g) => n + g.events.length, 0)
    : 0;

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
            {c.category && <span className="mt-4 inline-block tag">{c.category}</span>}
            <h1 className="mt-3 font-display text-4xl font-bold md:text-5xl">
              <span className="text-gradient">{c.title}</span>
            </h1>
            {c.tagline && <p className="mt-4 max-w-2xl text-lg text-muted">{c.tagline}</p>}
            {c.intro && (
              <div
                className="prose-cyber mt-3 max-w-2xl"
                dangerouslySetInnerHTML={{ __html: inlineEmojiImages(c.intro) }}
              />
            )}
            <div className="mt-5 flex flex-wrap gap-2">
              {c.tags.map((t) => (
                <span key={t} className="tag">
                  {t}
                </span>
              ))}
              {groups && (
                <span className="tag !border-cyan/40 !text-cyan">{total} งาน</span>
              )}
            </div>
          </Reveal>

          {/* Stories layout */}
          {stories && (
            <div className="mt-12 grid gap-6 pb-24 sm:grid-cols-2 lg:grid-cols-3">
              {stories.map((s, i) => (
                <Reveal key={i} delay={i * 70} className="h-full">
                  <div className="glass glass-hover flex h-full flex-col p-6">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-cyan/30 bg-cyan/10 font-display text-lg font-bold text-cyan">
                      {i + 1}
                    </div>
                    {s.title && (
                      <h3 className="mb-2 font-display text-lg font-bold">{s.title}</h3>
                    )}
                    <div
                      className="prose-cyber flex-1"
                      dangerouslySetInnerHTML={{ __html: inlineEmojiImages(s.detail) }}
                    />
                    <div className="mt-5">
                      {s.youtubeUrl ? (
                        <a
                          href={s.youtubeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-neon w-full"
                        >
                          ▶ ดูบน YouTube
                        </a>
                      ) : (
                        <span className="inline-flex w-full items-center justify-center rounded-lg border border-line/10 px-6 py-3 font-mono text-xs uppercase tracking-wider text-muted">
                          วิดีโอเร็วๆ นี้
                        </span>
                      )}
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          )}

          {/* Grouped-events layout */}
          {groups && (
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
                    {group.events.map((e, ei) => {
                      const cover = e.image && (
                        <div className="relative aspect-video w-full shrink-0 overflow-hidden">
                          <Image
                            src={e.image}
                            alt={e.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            sizes="(max-width: 768px) 100vw, 33vw"
                          />
                        </div>
                      );
                      const inner = (label: string) => (
                        <>
                          {cover}
                          <div className="flex flex-1 flex-col justify-between gap-4 p-5">
                            <div className="space-y-2.5">
                              <p className="font-body font-medium leading-snug transition-colors group-hover:text-cyan">
                                {e.title}
                              </p>
                              {e.metrics && (
                                <div className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-xs text-muted">
                                  {fmtNum(e.metrics.reactions) && (
                                    <span title="รีแอกชัน">❤️ {fmtNum(e.metrics.reactions)}</span>
                                  )}
                                  {fmtNum(e.metrics.comments) && (
                                    <span title="คอมเมนต์">💬 {fmtNum(e.metrics.comments)}</span>
                                  )}
                                  {fmtNum(e.metrics.shares) && (
                                    <span title="แชร์">🔄 {fmtNum(e.metrics.shares)}</span>
                                  )}
                                </div>
                              )}
                            </div>
                            <span className="font-mono text-xs uppercase tracking-wider text-cyan group-hover:text-ink">
                              {label}
                            </span>
                          </div>
                        </>
                      );

                      if (eventHasContent(e) && e.slug) {
                        return (
                          <Link
                            key={e.slug + ei}
                            href={`/portfolio/${c.slug}/${e.slug}`}
                            className="glass glass-hover group flex h-full flex-col overflow-hidden"
                          >
                            {inner("อ่านเนื้อหา →")}
                          </Link>
                        );
                      }
                      return (
                        <a
                          key={e.url + ei}
                          href={e.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="glass glass-hover group flex h-full flex-col overflow-hidden"
                        >
                          {inner("ดูโพสต์ Facebook →")}
                        </a>
                      );
                    })}
                  </div>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
