import type { Metadata } from "next";
import { notFound } from "next/navigation";
import EventDetailView, {
  type EventItem,
} from "@/components/portfolio/EventDetailView";
import JsonLd from "@/components/JsonLd";
import { creativeWorkJsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { fetchCollection, collectionDefault } from "@/lib/portfolio-collections";
import { eventHasContent } from "@/lib/portfolio-sessions";

export const revalidate = 0;

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
