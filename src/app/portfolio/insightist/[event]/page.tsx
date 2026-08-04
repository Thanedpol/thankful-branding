import type { Metadata } from "next";
import { notFound } from "next/navigation";
import EventDetailView, {
  type EventItem,
} from "@/components/portfolio/EventDetailView";
import JsonLd from "@/components/JsonLd";
import { creativeWorkJsonLd, breadcrumbJsonLd } from "@/lib/seo";
import {
  fetchCollectionEvent,
  getCollectionEventSlugs,
} from "@/lib/portfolio-collections";

export const revalidate = 300; // ISR — see /portfolio/insightist/page.tsx
export const maxDuration = 60; // headroom for regen (now a single-event read)

/** Pre-render every content event's detail page (static + ISR). New events added
 *  after a deploy still render on demand and get cached. */
export async function generateStaticParams() {
  const slugs = await getCollectionEventSlugs("insightist");
  return slugs.map((event) => ({ event }));
}

async function findEvent(slug: string): Promise<EventItem | null> {
  // Single-row read; throws on a query error (→ retryable 500, never a cached 404).
  const found = await fetchCollectionEvent("insightist", slug);
  return found?.e ?? null;
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
