import BlogManager from "@/components/admin/BlogManager";
import { createAdminClient } from "@/lib/supabase/admin";
import type { BlogPost } from "@/lib/types";

export const revalidate = 0;

export default async function AdminBlogPage() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .order("created_at", { ascending: false });

  return <BlogManager posts={(data as BlogPost[]) ?? []} />;
}
