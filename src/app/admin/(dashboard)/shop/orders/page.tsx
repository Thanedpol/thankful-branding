import Link from "next/link";
import ShopOrders from "@/components/admin/ShopOrders";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/demo-data";
import type { ShopOrder } from "@/lib/types";

export const revalidate = 0;

export default async function AdminShopOrdersPage() {
  let orders: ShopOrder[] = [];

  if (isSupabaseConfigured()) {
    const { data } = await createAdminClient()
      .from("shop_orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    orders = (data as ShopOrder[]) ?? [];
  }

  return (
    <div>
      <Link
        href="/admin/shop"
        className="mb-4 inline-block font-mono text-xs text-cyan/70 hover:text-cyan"
      >
        ← กลับไปหน้าสินค้า
      </Link>
      <ShopOrders orders={orders} />
    </div>
  );
}
