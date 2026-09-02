import ShopManager, { type ShopStats } from "@/components/admin/ShopManager";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/demo-data";
import { isRevenue } from "@/lib/shop";
import type { ShopOrder, ShopProduct } from "@/lib/types";

export const revalidate = 0;

const DAY = 24 * 60 * 60 * 1000;

export default async function AdminShopPage() {
  let products: ShopProduct[] = [];
  let orders: Pick<ShopOrder, "status" | "amount_total" | "created_at">[] = [];

  if (isSupabaseConfigured()) {
    const supabase = createAdminClient();
    const since = new Date(Date.now() - 365 * DAY).toISOString();

    const [productRes, orderRes] = await Promise.all([
      // Drafts included — this is the back-office, not the storefront.
      supabase
        .from("shop_products")
        .select("*")
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false }),
      supabase
        .from("shop_orders")
        .select("status, amount_total, created_at")
        .gte("created_at", since),
    ]);

    products = (productRes.data as ShopProduct[]) ?? [];
    orders = (orderRes.data as typeof orders) ?? [];
  }

  const cutoff30 = Date.now() - 30 * DAY;
  const stats: ShopStats = {
    currency: products[0]?.currency ?? "thb",
    revenue: orders.reduce((sum, o) => (isRevenue(o.status) ? sum + o.amount_total : sum), 0),
    revenue30: orders.reduce(
      (sum, o) =>
        isRevenue(o.status) && new Date(o.created_at).getTime() >= cutoff30
          ? sum + o.amount_total
          : sum,
      0
    ),
    orders: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    published: products.filter((p) => p.status === "published").length,
  };

  return <ShopManager products={products} stats={stats} />;
}
