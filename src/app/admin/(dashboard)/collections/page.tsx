import CollectionsManager from "@/components/admin/CollectionsManager";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/demo-data";
import {
  COLLECTION_SLUGS,
  collectionDefault,
  mergeCollection,
} from "@/lib/portfolio-collections";
import type { PortfolioCollection } from "@/lib/types";

export const revalidate = 0;

export default async function AdminCollectionsPage() {
  let rows: Partial<PortfolioCollection>[] = [];
  if (isSupabaseConfigured()) {
    // Tolerant of a pre-migration DB where the table doesn't exist yet.
    const { data } = await createAdminClient()
      .from("portfolio_collections")
      .select("*");
    rows = (data as Partial<PortfolioCollection>[] | null) ?? [];
  }

  const collections = COLLECTION_SLUGS.map((slug) =>
    mergeCollection(slug, rows.find((r) => r.slug === slug) ?? null)
  ).filter((c): c is PortfolioCollection => c !== null);

  // Should never be empty (defaults always exist), but guard anyway.
  if (collections.length === 0) {
    for (const slug of COLLECTION_SLUGS) {
      const d = collectionDefault(slug);
      if (d) collections.push(d);
    }
  }

  return <CollectionsManager collections={collections} />;
}
