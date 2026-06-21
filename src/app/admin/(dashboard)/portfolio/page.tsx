import PortfolioManager from "@/components/admin/PortfolioManager";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/demo-data";
import type { Portfolio } from "@/lib/types";

export const revalidate = 0;

export default async function AdminPortfolioPage() {
  let items: Portfolio[] = [];
  if (isSupabaseConfigured()) {
    const { data } = await createAdminClient()
      .from("portfolio")
      .select("*")
      .order("display_order", { ascending: true });
    items = (data as Portfolio[]) ?? [];
  }

  return <PortfolioManager items={items} />;
}
