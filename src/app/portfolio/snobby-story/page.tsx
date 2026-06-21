import Link from "next/link";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import { snobbyStory } from "@/lib/snobby-story";

export const metadata: Metadata = {
  title: `${snobbyStory.title} — AI Cartoon Moral Stories | Thank Thanedpol`,
  description: snobbyStory.intro,
  alternates: { canonical: "/portfolio/snobby-story" },
};

export default function SnobbyStoryPage() {
  const { title, tagline, intro, tags, stories } = snobbyStory;

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
            <span className="mt-4 inline-block tag">{snobbyStory.category}</span>
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
                    <h3 className="mb-2 font-display text-lg font-bold">
                      {s.title}
                    </h3>
                  )}
                  <p className="flex-1 leading-relaxed text-muted">{s.detail}</p>
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
