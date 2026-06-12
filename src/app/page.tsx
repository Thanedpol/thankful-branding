import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import PortfolioSection from "@/components/PortfolioSection";
import BlogPreview from "@/components/BlogPreview";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import {
  isSupabaseConfigured,
  demoProfile,
  demoPortfolio,
  demoBlogPreviews,
} from "@/lib/demo-data";
import type { Portfolio, BlogPreview as BlogPreviewType, SiteProfile } from "@/lib/types";

export const revalidate = 0; // always reflect latest admin edits

export default async function HomePage() {
  let profile: SiteProfile | null;
  let featured: Portfolio[];
  let posts: BlogPreviewType[];

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const [p, f, b] = await Promise.all([
      supabase.from("site_profile").select("*").eq("id", 1).single(),
      supabase
        .from("portfolio")
        .select("*")
        .eq("featured", true)
        .order("display_order", { ascending: true })
        .limit(6),
      supabase
        .from("blog_previews")
        .select("*")
        .order("published_at", { ascending: false })
        .limit(3),
    ]);
    profile = p.data as SiteProfile | null;
    featured = (f.data as Portfolio[]) ?? [];
    posts = (b.data as BlogPreviewType[]) ?? [];
  } else {
    profile = demoProfile;
    featured = demoPortfolio;
    posts = demoBlogPreviews;
  }

  return (
    <>
      <Navbar />
      <main>
        <Hero profile={profile} />
        <About profile={profile} />
        <PortfolioSection items={featured} />
        <BlogPreview posts={posts} />
      </main>
      <Footer social={profile?.social_links} />
    </>
  );
}
