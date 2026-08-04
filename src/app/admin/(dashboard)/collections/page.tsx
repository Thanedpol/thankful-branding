import CollectionsManager from "@/components/admin/CollectionsManager";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/demo-data";
import { COLLECTION_SLUGS, fetchCollection } from "@/lib/portfolio-collections";
import type { PortfolioCollection } from "@/lib/types";

export const revalidate = 0;
export const maxDuration = 60;

type PortfolioLink = { id: string; title: string; project_url: string | null };

export default async function AdminCollectionsPage() {
  let collections: PortfolioCollection[] = [];
  let portfolios: PortfolioLink[] = [];

  if (isSupabaseConfigured()) {
    const admin = createAdminClient();
    // Light load: only the collection SLUGS + portfolio cards here. Each
    // collection's structure is assembled from its per-event rows (header +
    // groups_meta + light event list) — never the multi-MB blob. Session bodies
    // are lazy-loaded per event inside the editor.
    const [{ data: cRows }, { data: pRows }] = await Promise.all([
      admin.from("portfolio_collections").select("slug"),
      admin
        .from("portfolio")
        .select("id, title, project_url")
        .order("display_order", { ascending: true }),
    ]);
    portfolios = (pRows as PortfolioLink[] | null) ?? [];

    const dbSlugs = ((cRows as { slug: string }[] | null) ?? []).map((r) => r.slug);
    const slugs = [...new Set([...COLLECTION_SLUGS, ...dbSlugs])];
    collections = (await Promise.all(slugs.map((s) => fetchCollection(s)))).filter(
      (c): c is PortfolioCollection => !!c
    );
  }

  return <CollectionsManager collections={collections} portfolios={portfolios} />;
}
