import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import AiDirectory from "@/components/AiDirectory";
import { AI_TOOLS, AI_CHECKED, AI_COMMUNITIES } from "@/lib/ai-directory";
import { SITE_URL, PERSON_ID, breadcrumbJsonLd, jsonLdGraph } from "@/lib/seo";
import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured, demoProfile } from "@/lib/demo-data";
import type { SiteProfile } from "@/lib/types";

export const revalidate = 3600;

const TH_COUNT = AI_TOOLS.filter((t) => t.origin === "th").length;
const TITLE = "คลัง AI — รวมเว็บ AI ฝีมือคนไทยและต่างประเทศ | Thankful";
const DESCRIPTION = `ค้นหาเว็บและเครื่องมือ AI ${AI_TOOLS.length} รายการ ฝีมือคนไทย ${TH_COUNT} รายการ และต่างประเทศ ${AI_TOOLS.length - TH_COUNT} รายการ เลือกตามงานที่อยากทำ ค้นได้ทั้งภาษาไทยและอังกฤษ`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/ai-tools" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: `${SITE_URL}/ai-tools`, type: "website" },
};

async function getProfile(): Promise<SiteProfile | null> {
  if (!isSupabaseConfigured()) return demoProfile;
  const { data } = await createPublicClient().from("site_profile").select("*").eq("id", 1).single();
  return (data as SiteProfile | null) ?? null;
}

const checkedOn = new Date(AI_CHECKED).toLocaleDateString("th-TH", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Bangkok",
});

export default async function AiToolsPage() {
  const profile = await getProfile();

  return (
    <>
      <JsonLd
        data={jsonLdGraph([
          {
            "@type": "CollectionPage",
            "@id": `${SITE_URL}/ai-tools#webpage`,
            url: `${SITE_URL}/ai-tools`,
            name: TITLE,
            description: DESCRIPTION,
            inLanguage: "th",
            dateModified: AI_CHECKED,
            author: { "@id": PERSON_ID },
            mainEntity: {
              "@type": "ItemList",
              numberOfItems: AI_TOOLS.length,
              itemListElement: AI_TOOLS.map((t, i) => ({
                "@type": "ListItem",
                position: i + 1,
                name: t.name,
                url: t.url,
              })),
            },
          },
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "AI Tools", path: "/ai-tools" },
          ]),
        ])}
      />
      <Navbar />
      <main className="min-h-screen px-4 pb-16 pt-28 sm:px-6">
        <div className="mx-auto w-full max-w-6xl">
          <div className="space-plate mb-6">
            <p className="eyebrow">// AI Directory</p>
            <h1 className="font-display text-3xl font-bold md:text-5xl text-gradient">คลัง AI</h1>
            <p className="mt-3 max-w-2xl text-muted">
              รวมเว็บและเครื่องมือ AI {AI_TOOLS.length} รายการ ฝีมือคนไทย {TH_COUNT} รายการ และต่างประเทศ{" "}
              {AI_TOOLS.length - TH_COUNT} รายการ พิมพ์สิ่งที่อยากทำ หรือกดเลือกหมวดงาน
            </p>
            <a href="#community" className="mt-3 inline-block text-sm text-cyan hover:underline">
              ชุมชนคนใช้ AI และโปรเจกต์ไทยบน GitHub ↓
            </a>
          </div>

          <AiDirectory tools={AI_TOOLS} />

          <section id="community" aria-labelledby="community-h" className="mt-14 scroll-mt-24">
            <h2 id="community-h" className="font-display text-2xl font-bold text-ink">
              ชุมชนและแหล่งรวมผลงาน
            </h2>
            <ul className="mt-4 grid gap-3 md:grid-cols-3">
              {AI_COMMUNITIES.map((c) => (
                <li key={c.name} className="glass flex flex-col !rounded-2xl p-5">
                  <h3 className="font-display text-base font-bold text-ink">{c.name}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-ink/80">{c.desc}</p>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {c.links.map((l) => (
                      <li key={l.url}>
                        <a
                          href={l.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block rounded-full border border-line/15 px-3 py-1.5 text-xs text-ink/85 transition-colors hover:border-cyan/50 hover:text-cyan"
                        >
                          {l.label} ↗
                        </a>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </section>

          <div className="mt-10 flex flex-col gap-4 rounded-2xl border border-cyan/30 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-lg font-bold text-ink">มีเว็บ AI ที่อยากให้เพิ่ม?</h2>
              <p className="mt-1 text-sm text-muted">ส่งลิงก์และชื่อผู้พัฒนามาได้ โดยเฉพาะผลงานของคนไทย</p>
            </div>
            <a href="https://m.me/Thankhuge2016" target="_blank" rel="noopener noreferrer" className="btn-neon shrink-0">
              แนะนำทาง Messenger ↗
            </a>
          </div>

          <p className="mt-6 text-xs leading-relaxed text-muted">
            ตรวจลิงก์ล่าสุดเมื่อ <time dateTime={AI_CHECKED}>{checkedOn}</time> · รายการนี้ไม่มีใครจ่ายเงินเพื่อให้ขึ้น
            และไม่ใช่การรับรองคุณภาพ · ราคาและเงื่อนไขดูที่เว็บของผู้พัฒนาแต่ละราย
          </p>
        </div>
      </main>
      <Footer social={profile?.social_links} />
    </>
  );
}
