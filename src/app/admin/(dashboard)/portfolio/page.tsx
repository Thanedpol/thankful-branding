import PortfolioManager from "@/components/admin/PortfolioManager";
import { createClient } from "@/lib/supabase/server";
import type { Portfolio } from "@/lib/types";

export const revalidate = 0;

export default async function AdminPortfolioPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("portfolio")
    .select("*")
    .order("display_order", { ascending: true });

  return <PortfolioManager items={(data as Portfolio[]) ?? []} />;
}
