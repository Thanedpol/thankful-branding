import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import YouTubeNetwork from "@/components/YouTubeNetwork";
import LatestUpdates from "@/components/LatestUpdates";
import HireSection from "@/components/HireSection";
import { getSeriesFeeds } from "@/lib/youtube-feeds";
import About from "@/components/About";
import PortfolioSection from "@/components/PortfolioSection";
import BlogPreview from "@/components/BlogPreview";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import FaqSection from "@/components/FaqSection";
import SeriesCompare from "@/components/SeriesCompare";
import { seriesPassage, blogPassage } from "@/lib/passages";
import {
  personJsonLd,
  websiteJsonLd,
  faqJsonLd,
  brandJsonLd,
  youtubeSeriesJsonLd,
  homePageJsonLd,
  jsonLdGraph,
  WHO_IS,
} from "@/lib/seo";
import { createPublicClient } from "@/lib/supabase/public";
import {
  isSupabaseConfigured,
  demoProfile,
  demoPortfolio,
  demoBlogPreviews,
} from "@/lib/demo-data";
import type { Portfolio, BlogPreview as BlogPreviewType, SiteProfile } from "@/lib/types";

// ISR for instant navigation. Admin edits still reflect immediately because
// refreshPublic() in admin/actions.ts calls revalidatePath("/"); the 60s window
// is just a backstop.
export const revalidate = 60;

export default async function HomePage() {
  let profile: SiteProfile | null;
  let portfolios: Portfolio[];
  let posts: BlogPreviewType[];
  let postTotal: number;
  // Fetched alongside the database reads; cached an hour, never fatal.
  const feedsPromise = getSeriesFeeds();

  if (isSupabaseConfigured()) {
    const supabase = createPublicClient();
    const [p, f, b, c] = await Promise.all([
      supabase.from("site_profile").select("*").eq("id", 1).single(),
      // Every portfolio (not just featured), ordered by display order.
      supabase
        .from("portfolio")
        .select("*")
        .order("display_order", { ascending: true })
        .limit(12),
      supabase
        .from("blog_previews")
        .select("*")
        .order("published_at", { ascending: false })
        .limit(3),
      // Just the count, for the blog section's intro.
      supabase.from("blog_previews").select("id", { count: "exact", head: true }),
    ]);
    profile = p.data as SiteProfile | null;
    portfolios = (f.data as Portfolio[]) ?? [];
    posts = (b.data as BlogPreviewType[]) ?? [];
    postTotal = c.count ?? posts.length;
  } else {
    profile = demoProfile;
    portfolios = demoPortfolio;
    posts = demoBlogPreviews;
    postTotal = demoBlogPreviews.length;
  }

  const feeds = await feedsPromise;

  // The page changes whenever an episode or article lands; say so, so
  // engines that weigh freshness see a date instead of none.
  const dateModified = [
    ...feeds.series.flatMap((s) => s.videos.map((v) => v.published)),
    ...posts.map((p) => p.published_at ?? ""),
  ]
    .filter(Boolean)
    .sort()
    .at(-1);

  return (
    <>
      <JsonLd
        data={jsonLdGraph([
          homePageJsonLd(dateModified),
          websiteJsonLd(),
          personJsonLd(profile),
          brandJsonLd(),
          youtubeSeriesJsonLd(feeds.series),
          faqJsonLd(),
        ])}
      />
      <Navbar />
      <main className="relative text-ink">
        <Hero profile={profile} />
        <LatestUpdates series={feeds.series} posts={posts} />
        <YouTubeNetwork series={feeds.series} shared={feeds.shared} />
        <SeriesCompare series={feeds.series} intro={seriesPassage(feeds.series)} />
        <About profile={profile} whoIs={WHO_IS} />
        <HireSection />
        <PortfolioSection
          items={portfolios}
          cvThUrl={profile?.cv_th_url}
          cvEnUrl={profile?.cv_en_url}
          showResume={profile?.show_resume === true}
        />
        <BlogPreview posts={posts} intro={blogPassage(postTotal, posts.length, posts[0]?.published_at)} />
        <FaqSection />
      </main>
      <Footer social={profile?.social_links} />
    </>
  );
}
