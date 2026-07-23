import type { Metadata } from "next";
import CollectionView from "@/components/portfolio/CollectionView";
import JsonLd from "@/components/JsonLd";
import { collectionPageJsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { fetchCollection, collectionDefault } from "@/lib/portfolio-collections";

export const revalidate = 300; // ISR — see /portfolio/insightist/page.tsx

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
  return (
    <>
      <JsonLd
        data={[
          collectionPageJsonLd(c),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: c.title, path: "/portfolio/snobby-story" },
          ]),
        ]}
      />
      <CollectionView c={c} />
    </>
  );
}
