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

  if (isSupabaseConfigured()) {
    const { data, error } = await createAdminClient()
      .from("hire_works")
      .select("id, kind, url, video_id, title, cover_url, display_order, hidden")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) ready = false;
    rows = (data as HireRow[] | null) ?? [];
  } else {
    ready = false;
  }

  return <HireManager rows={rows} ready={ready} />;
}
