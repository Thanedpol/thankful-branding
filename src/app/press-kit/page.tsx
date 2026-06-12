import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import PressDownload from "@/components/PressDownload";
import T from "@/components/T";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, demoPressKit } from "@/lib/demo-data";
import type { PressKit, LogoFile } from "@/lib/types";

export const revalidate = 0;
export const metadata = { title: "Press Kit — Thank Thanedpol" };

export default async function PressKitPage() {
  let kit: PressKit | null;
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase.from("press_kit").select("*").eq("id", 1).single();
    kit = data as PressKit | null;
  } else {
    kit = demoPressKit;
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-32">
        <div className="section-pad !pt-0">
          <Reveal>
            <p className="eyebrow"><T k="press.eyebrow" /></p>
            <h1 className="font-display text-4xl font-bold md:text-5xl text-gradient">
              <T k="press.heading" />
            </h1>
          </Reveal>

          <div className="mt-12 grid gap-12 md:grid-cols-[1fr_1.4fr]">
            {/* Headshot + contact */}
            <Reveal>
              <div className="relative mx-auto aspect-[3/4] w-full max-w-xs">
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-cyan/40 to-purple/40 opacity-40 blur-xl" />
                <div className="glass relative h-full w-full overflow-hidden">
                  {kit?.headshot_url ? (
                    <Image
                      src={kit.headshot_url}
                      alt="Thank Thanedpol headshot"
                      fill
                      className="object-cover"
                      sizes="320px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-grid-faint bg-grid">
                      <span className="font-display text-5xl text-gradient">TT</span>
                    </div>
                  )}
                </div>
              </div>
              {kit?.media_contact_email && (
                <div className="mt-6 text-center">
                  <p className="font-mono text-xs uppercase tracking-wider text-muted">
                    <T k="press.mediaContact" />
                  </p>
                  <a
                    href={`mailto:${kit.media_contact_email}`}
                    className="font-mono text-sm text-cyan hover:underline"
                  >
                    {kit.media_contact_email}
                  </a>
                </div>
              )}
            </Reveal>

            {/* Bio + awards + downloads */}
            <Reveal delay={120}>
              <div className="space-y-10">
                <div>
                  <h2 className="mb-3 font-display text-xl font-bold"><T k="press.shortBio" /></h2>
                  <p className="leading-relaxed text-muted">{kit?.short_bio}</p>
                </div>
                <div>
                  <h2 className="mb-3 font-display text-xl font-bold"><T k="press.fullBio" /></h2>
                  <p className="whitespace-pre-line leading-relaxed text-muted">
                    {kit?.long_bio}
                  </p>
                </div>

                {kit?.awards && kit.awards.length > 0 && (
                  <div>
                    <h2 className="mb-3 font-display text-xl font-bold">
                      <T k="press.awards" />
                    </h2>
                    <ul className="space-y-2">
                      {kit.awards.map((a) => (
                        <li
                          key={a}
                          className="flex items-start gap-2 text-muted"
                        >
                          <span className="mt-1 text-cyan">◢</span>
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <PressDownload
                  kitPdfPath={kit?.downloadable_kit_pdf_url ?? null}
                  logoFiles={(kit?.logo_files as LogoFile[]) ?? []}
                />
              </div>
            </Reveal>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
