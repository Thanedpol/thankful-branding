import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { fetchCollection, collectionDefault } from "@/lib/portfolio-collections";

export const revalidate = 0;

type EventItem = {
  title: string;
  url: string;
  image?: string;
  body?: string;
  slug?: string;
};

function hasContent(html?: string) {
  return !!html && html.replace(/<[^>]*>/g, "").trim().length > 0;
}

async function findEvent(slug: string): Promise<EventItem | null> {
  const c =
    (await fetchCollection("insightist")) ?? collectionDefault("insightist");
  for (const group of c?.data.groups ?? []) {
    for (const e of group.events as EventItem[]) {
      if (e.slug && e.slug === slug && hasContent(e.body)) return e;
    }
  }
  return null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ event: string }>;
}): Promise<Metadata> {
  const { event } = await params;
  const item = await findEvent(decodeURIComponent(event));
  if (!item) return { title: "ไม่พบเนื้อหา — Thank Thanedpol" };
  return {
    title: `${item.title} — Insightist | Thank Thanedpol`,
    alternates: { canonical: `/portfolio/insightist/${item.slug}` },
  };
}

export default async function InsightistEventPage({
  params,
}: {
  params: Promise<{ event: string }>;
}) {
  const { event } = await params;
  const item = await findEvent(decodeURIComponent(event));
  if (!item) notFound();

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-32">
        <article className="mx-auto max-w-3xl px-6 pb-24">
          <Link
            href="/portfolio/insightist"
            className="font-mono text-xs uppercase tracking-wider text-cyan hover:text-ink"
          >
            ← กลับหน้า Insightist
          </Link>

          <h1 className="mt-4 font-display text-3xl font-bold leading-tight md:text-4xl">
            {item.title}
          </h1>

          {item.image && (
            <div className="relative mt-8 aspect-video w-full overflow-hidden rounded-2xl">
              <Image
                src={item.image}
                alt={item.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 768px"
                priority
              />
            </div>
          )}

          <div
            className="prose-cyber mt-10"
            dangerouslySetInnerHTML={{ __html: item.body! }}
          />

          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-neon mt-10"
            >
              ดูโพสต์ Facebook →
            </a>
          )}
        </article>
      </main>
      <Footer />
    </>
  );
}
