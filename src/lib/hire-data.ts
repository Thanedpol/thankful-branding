import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/demo-data";
import { DEFAULT_HIRE_ITEMS, type HireItem, type HireKind } from "@/lib/hire";

type Row = {
  id: string;
  kind: HireKind;
  url: string;
  video_id: string;
  title: string | null;
  cover_url: string | null;
};

export const rowToHireItem = (r: Row): HireItem => ({
  id: r.id,
  kind: r.kind,
  url: r.url,
  videoId: r.video_id,
  title: r.title,
  cover: r.cover_url,
});

/**
 * The clips to show (hidden ones are filtered out by the table's read policy),
 * in the order set in Admin → Hire. If the table doesn't exist yet — the
 * migration hasn't been run — the built-in clips are used. A table that exists
 * and is empty means the list was emptied on purpose, and stays empty.
 */
export async function getHireItems(): Promise<HireItem[]> {
  if (!isSupabaseConfigured()) return DEFAULT_HIRE_ITEMS;
  const { data, error } = await createPublicClient()
    .from("hire_works")
    .select("id, kind, url, video_id, title, cover_url")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error || !data) return DEFAULT_HIRE_ITEMS;
  return (data as Row[]).map(rowToHireItem);
}
