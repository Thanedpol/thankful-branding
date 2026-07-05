import type { Metadata } from "next";
import CollectionView from "@/components/portfolio/CollectionView";
import { fetchCollection, collectionDefault } from "@/lib/portfolio-collections";

export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const c =
    (await fetchCollection("snobby-story")) ?? collectionDefault("snobby-story")!;
  return {
    title: `${c.title} — AI Cartoon Moral Stories | Thank Thanedpol`,
    description: c.intro?.replace(/<[^>]*>/g, "").trim() || undefined,
    alternates: { canonical: "/portfolio/snobby-story" },
  };
}

export default async function SnobbyStoryPage() {
  const c =
    (await fetchCollection("snobby-story")) ?? collectionDefault("snobby-story")!;
  return <CollectionView c={c} />;
}
