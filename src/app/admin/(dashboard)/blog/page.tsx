import BlogManager from "@/components/admin/BlogManager";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/demo-data";
import type { BlogPost } from "@/lib/types";

export const revalidate = 0;

export default async function AdminBlogPage() {
  let posts: BlogPost[] = [];
  if (isSupabaseConfigured()) {
    const { data } = await createAdminClient()
      .from("blog_posts")
      .select("*")
      .order("created_at", { ascending: false });
    posts = (data as BlogPost[]) ?? [];
  }

  return <BlogManager posts={posts} />;
}
