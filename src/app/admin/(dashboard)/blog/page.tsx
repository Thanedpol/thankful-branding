import BlogManager from "@/components/admin/BlogManager";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/demo-data";
import type { BlogPost } from "@/lib/types";

export const revalidate = 0;

export default async function AdminBlogPage() {
  let posts: BlogPost[] = [];
  if (isSupabaseConfigured()) {
    const admin = createAdminClient();
    const { data } = await admin
      .from("blog_posts")
      .select("*")
      .order("created_at", { ascending: false });
    posts = (data as BlogPost[]) ?? [];

    // Merge in members-only bodies for editing (service role bypasses RLS).
    // Tolerant of a pre-migration DB where the table doesn't exist yet.
    const { data: mc } = await admin
      .from("blog_member_content")
      .select("post_id, member_body");
    if (mc) {
      const map = new Map(
        (mc as { post_id: string; member_body: string | null }[]).map((r) => [
          r.post_id,
          r.member_body,
        ])
      );
      posts = posts.map((p) => ({ ...p, member_body: map.get(p.id) ?? null }));
    }
  }

  return <BlogManager posts={posts} />;
}
