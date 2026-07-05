import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SessionCarousel, {
  type CarouselEvent,
} from "@/components/portfolio/SessionCarousel";
import { fetchCollection, collectionDefault } from "@/lib/portfolio-collections";
import type { PortfolioCollection } from "@/lib/types";

export const revalidate = 0;

type Group = NonNullable<PortfolioCollection["data"]["groups"]>[number];

async function find(
  groupParam: string
): Promise<{ group: Group; idx: number } | null> {
  const c =
    (await fetchCollection("insightist")) ?? collectionDefault("insightist");
  const idx = Number(groupParam);
  const group = Number.isInteger(idx) ? c?.data.groups?.[idx] : undefined;
  if (!group || !group.events.length) return null;
  return { group, idx };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ group: string }>;
}): Promise<Metadata> {
  const { group } = await params;
  const found = await find(group);
  if (!found) return { title: "ไม่พบกลุ่มงาน — Thank Thanedpol" };
  return {
    title: `${found.group.name} — Insightist | Thank Thanedpol`,
    alternates: { canonical: `/portfolio/insightist/group/${found.idx}` },
  };
}

export default async function InsightistGroupCarouselPage({
  params,
}: {
  params: Promise<{ group: string }>;
}) {
  const { group } = await params;
  const found = await find(group);
  if (!found) notFound();
  return (
    <SessionCarousel
      groupName={found.group.name}
      events={found.group.events as CarouselEvent[]}
      backHref="/portfolio/insightist"
      backLabel="← กลับหน้า Insightist"
    />
  );
}
