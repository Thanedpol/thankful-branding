import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import {
  SITE_URL,
  NAME_TH,
  WHO_IS_TH,
  WHO_IS_EN,
  CREDENTIALS,
  ABOUT_UPDATED,
  aboutPageJsonLd,
  personJsonLd,
  breadcrumbJsonLd,
  jsonLdGraph,
} from "@/lib/seo";
import { SERIES, YT_CHANNEL_URL } from "@/lib/youtube";
import { SOCIAL_PROFILES, LINKEDIN_URL, GITHUB_URL } from "@/lib/social";
import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured, demoProfile } from "@/lib/demo-data";
import type { SiteProfile } from "@/lib/types";

/**
 * The fact page for the person: names and spellings, work, the YouTube series,
 * certificates and every profile, in plain server-rendered text. It is the
 * page answer engines should land on for "who is Thank Thanedpol", and the
 * page the Person node's mainEntityOfPage points to.
 */

export const revalidate = 3600;

const TITLE = `เกี่ยวกับ Thank Thanedpol (${NAME_TH}) — ประวัติและข้อมูล`;
const DESCRIPTION =
  "ข้อมูลของคุณแต้ง ธเนศพล เดชาดวงสกุล (Thank Thanedpol) คอนเทนต์ครีเอเตอร์เล่าข่าว AI และธุรกิจภาษาไทย เจ้าของช่อง YouTube Thankful — ชื่อที่สะกดถูกต้อง งาน ซีรีส์ ใบรับรอง และช่องทางติดต่อ";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/about" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: `${SITE_URL}/about`, type: "profile" },
};

async function getProfile(): Promise<SiteProfile | null> {
  if (!isSupabaseConfigured()) return demoProfile;
  const { data } = await createPublicClient().from("site_profile").select("*").eq("id", 1).single();
  return (data as SiteProfile | null) ?? null;
}

const FACTS: { label: string; value: React.ReactNode }[] = [
  { label: "ชื่อ-นามสกุล", value: NAME_TH },
  { label: "ชื่อเล่น", value: "แต้ง (คุณแต้ง)" },
  { label: "ชื่อภาษาอังกฤษ", value: "Thank Thanedpol · Thanedpol Dechaduangsakul" },
  { label: "สะกดผิดที่พบบ่อย", value: "ไม่ใช่ \"ธนรรถพล\" และไม่ใช่ \"แธงค์\"" },
  { label: "งาน", value: "คอนเทนต์ครีเอเตอร์ — ข่าว AI และธุรกิจ วิทยาศาสตร์และเทคโนโลยี" },
  {
    label: "สังกัด",
    value: "ทีมข่าวเทคโนโลยีและ AI — Insightist AI Transformation Thailand (Solution Insight Transformation Co., Ltd.)",
  },
  {
    label: "ช่อง YouTube",
    value: (
      <a href={YT_CHANNEL_URL} target="_blank" rel="noopener noreferrer me" className="text-cyan hover:underline">
        Thankful (@Thankful2026) — {SERIES.length} ซีรีส์
      </a>
    ),
  },
  {
    label: "บทความ",
    value: (
      <Link href="/blog" className="text-cyan hover:underline">
        บทความภาษาไทยบนบล็อกของเว็บนี้
      </Link>
    ),
  },
  {
    label: "ติดต่อ",
    value: (
      <a href="mailto:thank.2643@gmail.com" className="text-cyan hover:underline">
        thank.2643@gmail.com
      </a>
    ),
  },
];

const PROFILES = [
  { label: "YouTube", handle: "@Thankful2026", url: YT_CHANNEL_URL },
  ...SOCIAL_PROFILES.map((p) => ({ label: p.label, handle: p.handle, url: p.url })),
  { label: "LinkedIn", handle: "Thanedpol Dechaduangsakul", url: LINKEDIN_URL },
  { label: "GitHub", handle: "Thanedpol", url: GITHUB_URL },
];

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Bangkok" });

export default async function AboutPage() {
  const profile = await getProfile();

  return (
    <>
      <JsonLd
        data={jsonLdGraph([
          aboutPageJsonLd(),
          personJsonLd(profile),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "About", path: "/about" },
          ]),
        ])}
      />
      <Navbar />
      <main className="min-h-screen px-4 pb-16 pt-28 sm:px-6">
        <article className="reading-surface mx-auto w-full max-w-3xl">
          <div className="eyebrow">// เกี่ยวกับ</div>
          <h1 className="font-display text-3xl font-bold leading-tight text-ink md:text-4xl">
            Thank Thanedpol <span className="block text-2xl text-muted md:text-3xl">({NAME_TH} · คุณแต้ง)</span>
          </h1>
          <div className="mt-2 font-mono text-xs text-muted">
            ปรับปรุงข้อมูลล่าสุด <time dateTime={ABOUT_UPDATED}>{formatDate(ABOUT_UPDATED)}</time>
          </div>

          <p id="who-is-thank" className="mt-8 text-lg leading-relaxed text-ink/90">
            {WHO_IS_TH}
          </p>
          <p lang="en" className="mt-4 leading-relaxed text-muted">
            {WHO_IS_EN}
          </p>

          <h2 className="mt-12 font-display text-2xl font-bold text-ink">ข้อมูลโดยสรุป</h2>
          <dl className="mt-4 divide-y divide-line/10 border-y border-line/10">
            {FACTS.map((f) => (
              <div key={f.label} className="grid gap-1 py-3 sm:grid-cols-[10rem_1fr] sm:gap-4">
                <dt className="text-sm font-semibold text-ink">{f.label}</dt>
                <dd className="text-sm leading-relaxed text-muted">{f.value}</dd>
              </div>
            ))}
          </dl>

          <h2 className="mt-12 font-display text-2xl font-bold text-ink">
            ซีรีส์บน YouTube ({SERIES.length} ซีรีส์)
          </h2>
          <ul className="mt-4 space-y-3">
            {SERIES.map((s) => (
              <li key={s.playlistId} className="leading-relaxed">
                <a
                  href={`https://www.youtube.com/playlist?list=${s.playlistId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-cyan hover:underline"
                >
                  {s.title}
                </a>
                <span className="text-muted"> — {s.blurb}</span>
              </li>
            ))}
          </ul>

          <h2 className="mt-12 font-display text-2xl font-bold text-ink">
            ใบรับรอง ({CREDENTIALS.length} รายการ)
          </h2>
          <ul className="mt-4 list-disc space-y-1.5 pl-5 text-muted">
            {CREDENTIALS.map((c) => (
              <li key={c.name}>
                <span className="text-ink/90">{c.name}</span> — {c.by}
              </li>
            ))}
          </ul>

          <h2 className="mt-12 font-display text-2xl font-bold text-ink">โปรไฟล์ทางการ</h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {PROFILES.map((p) => (
              <li key={p.url}>
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer me"
                  className="flex items-baseline gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-ink/5"
                >
                  <span className="font-semibold text-ink">{p.label}</span>
                  <span className="truncate text-sm text-muted">{p.handle}</span>
                </a>
              </li>
            ))}
          </ul>

          <h2 className="mt-12 font-display text-2xl font-bold text-ink">ร่วมงาน</h2>
          <p className="mt-4 leading-relaxed text-muted">
            ดูตัวอย่างผลงานได้ที่หัวข้อ{" "}
            <Link href="/#hire" className="text-cyan hover:underline">
              รับงาน
            </Link>{" "}
            บนหน้าแรก แล้วติดต่อทางอีเมล{" "}
            <a href="mailto:thank.2643@gmail.com" className="text-cyan hover:underline">
              thank.2643@gmail.com
            </a>{" "}
            ข้อมูลสำหรับสื่อ (ประวัติ รูป โลโก้) อยู่ที่{" "}
            <Link href="/press-kit" className="text-cyan hover:underline">
              Press Kit
            </Link>{" "}
            และคำถามที่พบบ่อยอยู่ที่{" "}
            <Link href="/#faq" className="text-cyan hover:underline">
              หน้าแรก
            </Link>
          </p>
        </article>
      </main>
      <Footer social={profile?.social_links} />
    </>
  );
}
