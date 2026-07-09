import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BlogList from "@/components/BlogList";
import Reveal from "@/components/Reveal";
import T from "@/components/T";
import JsonLd from "@/components/JsonLd";
import { blogListJsonLd, breadcrumbJsonLd } from "@/lib/seo";
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
      <JsonLd
        data={[
          blogListJsonLd(list),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Blog", path: "/blog" },
          ]),
        ]}
      />
      <Navbar />
      <main className="min-h-screen pt-32">
        <div className="section-pad !py-0">
          <Reveal>
            <p className="eyebrow"><T k="blog.eyebrow" /></p>
            <h1 className="font-display text-4xl font-bold md:text-5xl text-gradient">
              <T k="blogPage.heading" />
            </h1>
            <p className="mt-4 max-w-2xl text-muted">
              <T k="blogPage.subtitle" />
            </p>
          </Reveal>

          <BlogList posts={list} />
        </div>
      </main>
      <Footer social={profile?.social_links} />
    </>
  );
}
