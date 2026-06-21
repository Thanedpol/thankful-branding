import PortfolioManager from "@/components/admin/PortfolioManager";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Portfolio } from "@/lib/types";

export const revalidate = 0;

export default async function AdminPortfolioPage() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("portfolio")
    .select("*")
    .order("display_order", { ascending: true });

  return <PortfolioManager items={(data as Portfolio[]) ?? []} />;
}
