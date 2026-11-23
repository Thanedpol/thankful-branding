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
  /** Missing until the SQL file is re-run to add the column. */
  link_only?: boolean | null;
};

export const rowToHireItem = (r: Row): HireItem => ({
  id: r.id,
  kind: r.kind,
  url: r.url,
  videoId: r.video_id,
  title: r.title,
  cover: r.cover_url,
  linkOnly: r.link_only === true,
});

/**
 * The clips to show (hidden ones are filtered out by the table's read policy),
 * in the order set in Admin → Hire. If the table doesn't exist yet — the
 * migration hasn't been run — the built-in clips are used. A table that exists
 * and is empty means the list was emptied on purpose, and stays empty.
 */
export async function getHireItems(): Promise<HireItem[]> {
  if (!isSupabaseConfigured()) return DEFAULT_HIRE_ITEMS;
  const db = createPublicClient();
  const read = (cols: string) =>
    db
      .from("hire_works")
      .select(cols)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true });
  let res = await read("id, kind, url, video_id, title, cover_url, link_only");
  // A table made before the link_only column existed still works without it.
  if (res.error) res = await read("id, kind, url, video_id, title, cover_url");
  if (res.error || !res.data) return DEFAULT_HIRE_ITEMS;
  return (res.data as unknown as Row[]).map(rowToHireItem);
}
