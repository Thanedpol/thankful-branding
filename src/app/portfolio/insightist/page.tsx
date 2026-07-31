import type { Metadata } from "next";
import CollectionView from "@/components/portfolio/CollectionView";
import JsonLd from "@/components/JsonLd";
import { collectionPageJsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { fetchCollection, collectionDefault } from "@/lib/portfolio-collections";

// ISR: the collection JSONB is large, so serve from cache instead of
// re-fetching + re-rendering on every request (avoids serverless timeouts).
// Admin edits call revalidatePath; the 5-min window is a backstop.
export const revalidate = 300;
// The collection JSONB is ~4 MB; give ISR regeneration room so the fetch never
// times out and falls back to the tiny seed (which lacks event slugs → 404).
export const maxDuration = 60;

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
