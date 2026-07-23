import type { Metadata } from "next";
import { notFound } from "next/navigation";
import EventDetailView, {
  type EventItem,
} from "@/components/portfolio/EventDetailView";
import JsonLd from "@/components/JsonLd";
import { creativeWorkJsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { fetchCollection } from "@/lib/portfolio-collections";
import { eventHasContent } from "@/lib/portfolio-sessions";
import type { PortfolioCollection } from "@/lib/types";

export const revalidate = 300; // ISR — see /portfolio/insightist/page.tsx

async function find(
  collectionSlug: string,
  eventSlug: string
): Promise<{ c: PortfolioCollection; e: EventItem } | null> {
  const c = await fetchCollection(collectionSlug);
  if (!c) return null;
  for (const group of c.data.groups ?? []) {
    for (const e of group.events as EventItem[]) {
      if (e.slug === eventSlug && eventHasContent(e)) return { c, e };
    }
  }
  return null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ collection: string; event: string }>;
}): Promise<Metadata> {
  const { collection, event } = await params;
  const found = await find(
    decodeURIComponent(collection),
    decodeURIComponent(event)
  );
  if (!found) return { title: "ไม่พบเนื้อหา — Thank Thanedpol" };
  return {
    title: `${found.e.title} — ${found.c.title} | Thank Thanedpol`,
    alternates: {
      canonical: `/portfolio/${found.c.slug}/${found.e.slug}`,
    },
  };
}

export default async function CollectionEventPage({
  params,
}: {
  params: Promise<{ collection: string; event: string }>;
}) {
  const { collection, event } = await params;
  const found = await find(
    decodeURIComponent(collection),
    decodeURIComponent(event)
  );
  if (!found) notFound();
  const path = `/portfolio/${found.c.slug}/${found.e.slug}`;
  return (
    <>
      <JsonLd
        data={[
          creativeWorkJsonLd({
            title: found.e.title,
            path,
            description: found.e.body,
            image: found.e.image,
            partOf: { name: found.c.title, path: `/portfolio/${found.c.slug}` },
          }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: found.c.title, path: `/portfolio/${found.c.slug}` },
            { name: found.e.title, path },
          ]),
        ]}
      />
      <EventDetailView
        event={found.e}
        backHref={`/portfolio/${found.c.slug}`}
        backLabel={`← กลับหน้า ${found.c.title}`}
      />
    </>
  );
}
