import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CollectionView from "@/components/portfolio/CollectionView";
import { fetchCollection } from "@/lib/portfolio-collections";

export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ collection: string }>;
}): Promise<Metadata> {
  const { collection } = await params;
  const c = await fetchCollection(decodeURIComponent(collection));
  if (!c) return { title: "ไม่พบผลงาน — Thank Thanedpol" };
  return {
    title: `${c.title} — Thank Thanedpol`,
    description: c.intro?.replace(/<[^>]*>/g, "").trim() || undefined,
    alternates: { canonical: `/portfolio/${c.slug}` },
  };
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ collection: string }>;
}) {
  const { collection } = await params;
  const c = await fetchCollection(decodeURIComponent(collection));
  if (!c) notFound();
  return <CollectionView c={c} />;
}
