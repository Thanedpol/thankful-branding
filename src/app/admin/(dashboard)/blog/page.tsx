import BlogManager from "@/components/admin/BlogManager";
import { createClient } from "@/lib/supabase/server";
import type { BlogPost } from "@/lib/types";

export const revalidate = 0;

export default async function AdminBlogPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .order("created_at", { ascending: false });

  return <BlogManager posts={(data as BlogPost[]) ?? []} />;
}
