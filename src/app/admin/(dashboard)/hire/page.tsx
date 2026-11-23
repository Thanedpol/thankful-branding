import HireManager, { type HireRow } from "@/components/admin/HireManager";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/demo-data";

export const revalidate = 0;

export default async function AdminHirePage() {
  let rows: HireRow[] = [];
  // False when the hire_works table doesn't exist yet (migration not run):
  // the manager then explains what to run, and the site keeps showing the
  // built-in clips.
  let ready = true;
  // True when the table exists but predates the link_only column.
  let needsColumn = false;

  if (isSupabaseConfigured()) {
    const db = createAdminClient();
    const read = (cols: string) =>
      db
        .from("hire_works")
        .select(cols)
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: true });
    let res = await read("id, kind, url, video_id, title, cover_url, display_order, hidden, link_only");
    if (res.error) {
      res = await read("id, kind, url, video_id, title, cover_url, display_order, hidden");
      if (res.error) ready = false;
      else needsColumn = true;
    }
    rows = (res.data as unknown as HireRow[] | null) ?? [];
  } else {
    ready = false;
  }

  return <HireManager rows={rows} ready={ready} needsColumn={needsColumn} />;
}
