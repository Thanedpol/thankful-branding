import type { Metadata } from "next";
import { notFound } from "next/navigation";
import EventDetailView, {
  type EventItem,
} from "@/components/portfolio/EventDetailView";
import JsonLd from "@/components/JsonLd";
import { creativeWorkJsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { fetchCollection, collectionDefault } from "@/lib/portfolio-collections";
import { eventHasContent } from "@/lib/portfolio-sessions";

export const revalidate = 300; // ISR — see /portfolio/insightist/page.tsx

/** Pre-render every event's detail page as static+ISR so the large collection
 *  JSONB is fetched once at build, not on every request. New events (added
 *  after a deploy) still render on demand and get cached. */
export async function generateStaticParams() {
  const c = await fetchCollection("insightist");
  const slugs = new Set<string>();
  for (const g of c?.data.groups ?? []) {
    for (const e of g.events as EventItem[]) {
      if (e.slug && eventHasContent(e)) slugs.add(e.slug);
    }
  }
  return [...slugs].map((event) => ({ event }));
}

async function findEvent(slug: string): Promise<EventItem | null> {
  const c =
    (await fetchCollection("insightist")) ?? collectionDefault("insightist");
  for (const group of c?.data.groups ?? []) {
    for (const e of group.events as EventItem[]) {
      if (e.slug === slug && eventHasContent(e)) return e;
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
  const path = `/portfolio/insightist/${item.slug}`;
  return (
    <>
      <JsonLd
        data={[
          creativeWorkJsonLd({
            title: item.title,
            path,
            description: item.body,
            image: item.image,
            partOf: { name: "Insightist", path: "/portfolio/insightist" },
          }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Insightist", path: "/portfolio/insightist" },
            { name: item.title, path },
          ]),
        ]}
      />
      <EventDetailView
        event={item}
        backHref="/portfolio/insightist"
        backLabel="← กลับหน้า Insightist"
      />
    </>
  );
}
