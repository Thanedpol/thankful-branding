import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import EmailActions from "@/components/EmailActions";
import { YouTubeGrid, TikTokGrid } from "@/components/HireCards";
import { getHireItems } from "@/lib/hire-data";
import { SITE_URL, PERSON_ID, breadcrumbJsonLd, jsonLdGraph } from "@/lib/seo";
import { YT_CHANNEL_URL } from "@/lib/youtube";
import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured, demoProfile } from "@/lib/demo-data";
import type { SiteProfile } from "@/lib/types";

/**
 * Every sample clip from the "รับงาน" section, on one page. The list is
 * edited in Admin → Hire (table hire_works); the home page shows the first few.
 */

export const revalidate = 60;

const TITLE = "ผลงานตัวอย่าง — คลิปสรุปงาน Event และแอปฯ AI | Thankful";
const DESCRIPTION =
  "รวมคลิปตัวอย่างจากช่อง Thankful ของ Thank Thanedpol: สรุปงาน Event ที่มีเรื่อง AI และคลิปสรุปแอปฯ หรือ Platform ภาษาไทย ดูแล้วติดต่อร่วมงานได้ทันที";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/work" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: `${SITE_URL}/work`, type: "website" },
};

async function getProfile(): Promise<SiteProfile | null> {
  if (!isSupabaseConfigured()) return demoProfile;
  const { data } = await createPublicClient().from("site_profile").select("*").eq("id", 1).single();
  return (data as SiteProfile | null) ?? null;
}

export default async function WorkPage() {
  const [items, profile] = await Promise.all([getHireItems(), getProfile()]);
  const youtube = items.filter((i) => i.kind === "youtube");
  const tiktok = items.filter((i) => i.kind === "tiktok");

  return (
    <>
      <JsonLd
        data={jsonLdGraph([
          {
            "@type": "CollectionPage",
            "@id": `${SITE_URL}/work#webpage`,
            url: `${SITE_URL}/work`,
            name: TITLE,
            description: DESCRIPTION,
            inLanguage: "th",
            about: { "@id": PERSON_ID },
            mainEntity: {
              "@type": "ItemList",
              numberOfItems: items.length,
              itemListElement: items.map((it, i) => ({
                "@type": "ListItem",
                position: i + 1,
                url: it.url,
                ...(it.title ? { name: it.title } : {}),
              })),
            },
          },
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Work", path: "/work" },
          ]),
        ])}
      />
      <Navbar />
      <main className="min-h-screen px-4 pb-16 pt-28 sm:px-6">
        <div className="mx-auto w-full max-w-6xl">
          <div className="space-plate mb-10">
            <p className="eyebrow">// ผลงานตัวอย่าง</p>
            <h1 className="font-display text-3xl font-bold md:text-4xl text-gradient">ผลงานทั้งหมด</h1>
            <p className="mt-3 max-w-2xl text-muted">
              คลิปตัวอย่างจากช่อง Thankful: สรุปงาน Event ที่มีเรื่อง AI และคลิปสรุปแอปฯ หรือ Platform
              เป็นภาษาไทยที่เข้าใจง่าย สนใจร่วมงาน ดู{" "}
              <Link href="/sponsor" className="text-cyan hover:underline">
                บริการและราคาเริ่มต้น
              </Link>{" "}
              หรือติดต่อด้านล่าง
            </p>
          </div>

          {items.length === 0 && <p className="text-muted">ยังไม่มีผลงานให้แสดง</p>}

          {youtube.length > 0 && (
            <section aria-labelledby="work-yt">
              <h2 id="work-yt" className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
                YouTube · {youtube.length} คลิป
              </h2>
              <YouTubeGrid items={youtube} className="lg:grid-cols-3" />
            </section>
          )}

          {tiktok.length > 0 && (
            <section aria-labelledby="work-tt" className="mt-12">
              <h2 id="work-tt" className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
                TikTok · {tiktok.length} คลิป
              </h2>
              <TikTokGrid items={tiktok} />
            </section>
          )}

          <p className="mt-10 text-sm text-muted">
            ดูคลิปทั้งหมดบน{" "}
            <a href={YT_CHANNEL_URL} target="_blank" rel="noopener noreferrer" className="text-cyan hover:underline">
              YouTube @Thankful2026
            </a>
          </p>

          <section className="mt-12 rounded-2xl border border-cyan/30 p-6 sm:p-8">
            <h2 className="font-display text-xl font-bold text-ink">สนใจร่วมงาน</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              ส่งรายละเอียดงานหรือสินค้ามาได้เลย แล้วจะส่งใบเสนอราคากลับไป
            </p>
            <EmailActions className="mt-5" subject="ติดต่อรับงาน Thankful" />
          </section>
        </div>
      </main>
      <Footer social={profile?.social_links} />
    </>
  );
}
