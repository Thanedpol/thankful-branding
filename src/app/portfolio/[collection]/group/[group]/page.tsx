import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SessionCarousel, {
  type CarouselEvent,
} from "@/components/portfolio/SessionCarousel";
import { fetchCollection } from "@/lib/portfolio-collections";
import type { PortfolioCollection } from "@/lib/types";

export const revalidate = 0;

type Group = NonNullable<PortfolioCollection["data"]["groups"]>[number];

async function find(
  collectionSlug: string,
  groupParam: string
): Promise<{ c: PortfolioCollection; group: Group; idx: number } | null> {
  const c = await fetchCollection(collectionSlug);
  if (!c) return null;
  const idx = Number(groupParam);
  const group = Number.isInteger(idx) ? c.data.groups?.[idx] : undefined;
  if (!group || !group.events.length) return null;
  return { c, group, idx };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ collection: string; group: string }>;
}): Promise<Metadata> {
  const { collection, group } = await params;
  const found = await find(decodeURIComponent(collection), group);
  if (!found) return { title: "ไม่พบกลุ่มงาน — Thank Thanedpol" };
  return {
    title: `${found.group.name} — ${found.c.title} | Thank Thanedpol`,
    alternates: {
      canonical: `/portfolio/${found.c.slug}/group/${found.idx}`,
    },
  };
}

export default async function GroupCarouselPage({
  params,
}: {
  params: Promise<{ collection: string; group: string }>;
}) {
  const { collection, group } = await params;
  const found = await find(decodeURIComponent(collection), group);
  if (!found) notFound();
  return (
    <SessionCarousel
      groupName={found.group.name}
      events={found.group.events as CarouselEvent[]}
      backHref={`/portfolio/${found.c.slug}`}
      backLabel={`← กลับหน้า ${found.c.title}`}
    />
  );
}
