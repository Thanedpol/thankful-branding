import Image from "next/image";
import Reveal from "./Reveal";
import type { SiteProfile } from "@/lib/types";

export default function About({ profile }: { profile: SiteProfile | null }) {
  const bio =
    profile?.long_bio ??
    "I design and ship AI systems at the intersection of research and product.";

  return (
    <section id="about" className="section-pad scroll-mt-20">
      <div className="grid items-center gap-12 md:grid-cols-[1fr_1.4fr]">
        <Reveal>
          <div className="relative mx-auto aspect-square w-full max-w-sm">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-cyan/40 to-purple/40 opacity-40 blur-xl" />
            <div className="glass relative h-full w-full overflow-hidden">
              {profile?.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 80vw, 400px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-grid-faint bg-grid">
                  <span className="font-display text-6xl text-gradient">TT</span>
                </div>
              )}
            </div>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <p className="eyebrow">// About</p>
          <h2 className="mb-6 font-display text-3xl font-bold md:text-4xl">
            {profile?.headline ?? "Engineering intelligence"}
          </h2>
          <p className="whitespace-pre-line text-lg leading-relaxed text-muted">
            {bio}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
