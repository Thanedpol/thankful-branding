import type { Metadata } from "next";
import { notFound } from "next/navigation";
import EventDetailView, {
  type EventItem,
} from "@/components/portfolio/EventDetailView";
import { fetchCollection } from "@/lib/portfolio-collections";
import type { PortfolioCollection } from "@/lib/types";

export const revalidate = 0;

function hasContent(html?: string) {
  return !!html && html.replace(/<[^>]*>/g, "").trim().length > 0;
}

async function find(
  collectionSlug: string,
  eventSlug: string
): Promise<{ c: PortfolioCollection; e: EventItem } | null> {
  const c = await fetchCollection(collectionSlug);
  if (!c) return null;
  for (const group of c.data.groups ?? []) {
    for (const e of group.events as EventItem[]) {
      if (e.slug === eventSlug && hasContent(e.body)) return { c, e };
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
  return (
    <EventDetailView
      event={found.e}
      backHref={`/portfolio/${found.c.slug}`}
      backLabel={`← กลับหน้า ${found.c.title}`}
    />
  );
}
