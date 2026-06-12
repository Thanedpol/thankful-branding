import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BlogCard from "@/components/BlogCard";
import Reveal from "@/components/Reveal";
import { createClient } from "@/lib/supabase/server";
import {
  isSupabaseConfigured,
  demoBlogPreviews,
  demoProfile,
} from "@/lib/demo-data";
import type { BlogPreview, SiteProfile } from "@/lib/types";

export const revalidate = 0;

export const metadata = { title: "Blog — Thank Thanedpol" };

export default async function BlogIndex() {
  let list: BlogPreview[];
  let profile: Pick<SiteProfile, "social_links"> | null;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const [{ data: posts }, { data: prof }] = await Promise.all([
      supabase
        .from("blog_previews")
        .select("*")
        .order("published_at", { ascending: false }),
      supabase.from("site_profile").select("social_links").eq("id", 1).single(),
    ]);
    list = (posts as BlogPreview[]) ?? [];
    profile = prof as Pick<SiteProfile, "social_links"> | null;
  } else {
    list = demoBlogPreviews;
    profile = { social_links: demoProfile.social_links };
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-32">
        <div className="section-pad !py-0">
          <Reveal>
            <p className="eyebrow">// Transmissions</p>
            <h1 className="font-display text-4xl font-bold md:text-5xl">
              The <span className="text-gradient">Blog</span>
            </h1>
            <p className="mt-4 max-w-2xl text-muted">
              Notes on AI, autonomous systems, and designing software that feels
              like the future. Some posts are exclusive to members.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-6 pb-24 sm:grid-cols-2 lg:grid-cols-3">
            {list.length === 0 ? (
              <p className="font-mono text-sm text-muted">No posts yet.</p>
            ) : (
              list.map((post, i) => (
                <Reveal key={post.id} delay={i * 60}>
                  <BlogCard post={post} />
                </Reveal>
              ))
            )}
          </div>
        </div>
      </main>
      <Footer social={profile?.social_links} />
    </>
  );
}
