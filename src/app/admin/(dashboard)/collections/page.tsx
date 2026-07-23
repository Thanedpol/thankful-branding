import CollectionsManager from "@/components/admin/CollectionsManager";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/demo-data";
import { mergeAdminCollections, stripSessionBodies } from "@/lib/portfolio-collections";
import type { PortfolioCollection } from "@/lib/types";

export const revalidate = 0;
// Saving the large Insightist collection round-trips a ~4 MB blob (read the
// stored bodies + write them back), which can exceed the default serverless
// timeout. Give the save action room so it doesn't silently fail.
export const maxDuration = 60;

type PortfolioLink = { id: string; title: string; project_url: string | null };

export default async function AdminCollectionsPage() {
  let rows: Partial<PortfolioCollection>[] = [];
  let portfolios: PortfolioLink[] = [];

  if (isSupabaseConfigured()) {
    const admin = createAdminClient();
    // Tolerant of a pre-migration DB where portfolio_collections doesn't exist.
    const [{ data: cRows }, { data: pRows }] = await Promise.all([
      admin.from("portfolio_collections").select("*"),
      admin
        .from("portfolio")
        .select("id, title, project_url")
        .order("display_order", { ascending: true }),
    ]);
    rows = (cRows as Partial<PortfolioCollection>[] | null) ?? [];
    portfolios = (pRows as PortfolioLink[] | null) ?? [];
  }

  return (
    <CollectionsManager
      collections={stripSessionBodies(mergeAdminCollections(rows))}
      portfolios={portfolios}
    />
  );
}
