import CollectionsManager from "@/components/admin/CollectionsManager";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/demo-data";
import { mergeAdminCollections } from "@/lib/portfolio-collections";
import type { PortfolioCollection } from "@/lib/types";

export const revalidate = 0;

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
      collections={mergeAdminCollections(rows)}
      portfolios={portfolios}
    />
  );
}
