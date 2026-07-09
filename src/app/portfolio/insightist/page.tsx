import type { Metadata } from "next";
import CollectionView from "@/components/portfolio/CollectionView";
import JsonLd from "@/components/JsonLd";
import { collectionPageJsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { fetchCollection, collectionDefault } from "@/lib/portfolio-collections";

export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const c =
    (await fetchCollection("insightist")) ?? collectionDefault("insightist")!;
  return {
    title: `${c.title} — AI & Tech News Coverage | Thank Thanedpol`,
    description: c.intro?.replace(/<[^>]*>/g, "").trim() || undefined,
    alternates: { canonical: "/portfolio/insightist" },
  };
}

export default async function InsightistPage() {
  const c =
    (await fetchCollection("insightist")) ?? collectionDefault("insightist")!;
  return (
    <>
      <JsonLd
        data={[
          collectionPageJsonLd(c),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: c.title, path: "/portfolio/insightist" },
          ]),
        ]}
      />
      <CollectionView c={c} />
    </>
  );
}
