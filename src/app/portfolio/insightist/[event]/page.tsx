import type { Metadata } from "next";
import { notFound } from "next/navigation";
import EventDetailView, {
  type EventItem,
} from "@/components/portfolio/EventDetailView";
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
  return (
    <EventDetailView
      event={item}
      backHref="/portfolio/insightist"
      backLabel="← กลับหน้า Insightist"
    />
  );
}
