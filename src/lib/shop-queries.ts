import { createPublicClient } from "@/lib/supabase/public";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/demo-data";
import type { ShopOrder, ShopProduct } from "@/lib/types";

/**
 * Storefront reads — SERVER ONLY. There is no demo fallback for the shop: with
 * no database there is nothing to sell, so every read returns empty and the
 * pages fall back to their calm empty states.
 */

export async function listPublishedProducts(): Promise<ShopProduct[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("shop_products")
    .select("*")
    .eq("status", "published")
    .order("featured", { ascending: false })
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });
  return (data as ShopProduct[]) ?? [];
}

export async function getProductBySlug(slug: string): Promise<ShopProduct | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("shop_products")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  return (data as ShopProduct | null) ?? null;
}

/** Orders carry buyer emails and download tokens, so RLS blocks the anon role
 *  outright — the success page has to read them with the service-role key. */
export async function getOrderBySessionId(sessionId: string): Promise<ShopOrder | null> {
  if (!isSupabaseConfigured() || !sessionId) return null;
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("shop_orders")
    .select("*")
    .eq("stripe_session_id", sessionId)
    .maybeSingle();
  return (data as ShopOrder | null) ?? null;
}
