import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/demo-data";

/** Revalidated by the shop admin actions whenever a product changes. */
export const SHOP_TAG = "shop-products";

/**
 * Is there anything to buy? The Shop menu item stays hidden until there is,
 * so nobody lands on an empty store. Cached (and tag-invalidated by the admin)
 * because the root layout asks on every page.
 */
export const hasPublishedProducts = unstable_cache(
  async () => {
    if (!isSupabaseConfigured()) return false;
    const { count, error } = await createPublicClient()
      .from("shop_products")
      .select("id", { count: "exact", head: true })
      .eq("status", "published");
    return !error && (count ?? 0) > 0;
  },
  ["has-published-products"],
  { revalidate: 600, tags: [SHOP_TAG] }
);
