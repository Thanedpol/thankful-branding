import Link from "next/link";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import { fetchCollection, collectionDefault } from "@/lib/portfolio-collections";

export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const c =
    (await fetchCollection("snobby-story")) ?? collectionDefault("snobby-story")!;
  return {
    title: `${c.title} — AI Cartoon Moral Stories | Thank Thanedpol`,
    description: c.intro ?? undefined,
    alternates: { canonical: "/portfolio/snobby-story" },
  };
}

export default async function SnobbyStoryPage() {
  const c =
    (await fetchCollection("snobby-story")) ?? collectionDefault("snobby-story")!;
  const { title, tagline, intro, tags, category } = c;
  const stories = c.data.stories ?? [];

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
              <div
                className="prose-cyber mt-3 max-w-2xl"
                dangerouslySetInnerHTML={{ __html: intro }}
              />
            )}
            <div className="mt-5 flex flex-wrap gap-2">
              {tags.map((t) => (
                <span key={t} className="tag">
                  {t}
                </span>
              ))}
            </div>
          </Reveal>

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
                    dangerouslySetInnerHTML={{ __html: s.detail }}
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
        </div>
      </main>
      <Footer />
    </>
  );
}
