import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { SITE_URL, PERSON_ID, breadcrumbJsonLd, jsonLdGraph } from "@/lib/seo";
import { YT_CHANNEL_URL, SERIES } from "@/lib/youtube";
import EmailActions from "@/components/EmailActions";
import { AUDIENCE, YOUTUBE, YT_PERIOD, EVENTS_COVERED, type Stat } from "@/lib/sponsor";
import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured, demoProfile } from "@/lib/demo-data";
import type { SiteProfile } from "@/lib/types";

/**
 * Sponsor / media kit page: who the audience is, real dated numbers, the
 * services with starting prices, how a sponsored job works, and contact.
 * Numbers live in src/lib/sponsor.ts so they can be refreshed in one place.
 */

export const revalidate = 3600;

const TITLE = "เปิดรับสปอนเซอร์ — Media Kit ของ Thankful (Thank Thanedpol)";
const DESCRIPTION =
  "ช่อง Thankful ของ Thank Thanedpol เปิดรับสปอนเซอร์ สรุปงาน Event ที่มีเรื่อง AI เริ่มต้น 5,000 บาท และคลิปสรุปแอปฯ หรือ Platform เริ่มต้น 2,000 บาทต่อคลิป พร้อมตัวเลขผู้ติดตามและยอดวิวจริง";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/sponsor" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: `${SITE_URL}/sponsor`, type: "website" },
};

async function getProfile(): Promise<SiteProfile | null> {
  if (!isSupabaseConfigured()) return demoProfile;
  const { data } = await createPublicClient().from("site_profile").select("*").eq("id", 1).single();
  return (data as SiteProfile | null) ?? null;
}

const SERVICES = [
  {
    name: "สรุปงาน Event ที่มีเรื่อง AI",
    detail: "รับทั้งงานครึ่งวันและเต็มวัน ไปงานจริง แล้วเล่าเป็นคลิปให้คนที่ไม่ได้ไปเข้าใจ",
    price: 5000,
    unit: "บาท",
  },
  {
    name: "สรุปแอปฯ และ Platform ของแต่ละบริษัท",
    detail: "เล่าที่มาและความหมายของแอปฯ หรือ Platform นั้น เป็นภาษาไทยที่เข้าใจง่าย",
    price: 2000,
    unit: "บาท / คลิป",
  },
];

// Why work with Thankful — each point rests on something checkable on this
// site or the channel (topics, language, events already covered).
const WHY = [
  [
    "คนดูที่สนใจเรื่องนี้จริง",
    "ทุกคลิปของช่องเป็นเรื่อง AI ธุรกิจ และเทคโนโลยี คนที่ติดตามจึงเป็นคนที่อยากรู้เรื่องพวกนี้อยู่แล้ว",
  ],
  [
    "เล่าเรื่องยากเป็นภาษาไทยที่เข้าใจง่าย",
    "แปลศัพท์เทคนิคเป็นภาษาคน บอกว่าใช้ทำอะไร และมีผลกับธุรกิจอย่างไร ให้คนดูจบแล้วเอาไปใช้ต่อได้",
  ],
  [
    "ไปงานจริง สรุปจริง",
    "เคยสรุปงานมาแล้วหลายงาน ตั้งแต่งานธนาคารและงานนวัตกรรมองค์กร ไปจนถึงงานการตลาดและงานออกแบบ UX/UI ดูรายชื่อได้ด้านล่าง",
  ],
];

const STEPS = [
  ["ส่งรายละเอียด", "ทางอีเมล: งานหรือสินค้าคืออะไร อยากให้คนดูรู้อะไร และวันที่ต้องการ"],
  ["รับใบเสนอราคา", "ระบุชิ้นงาน ช่องทางที่ลง และราคา ตกลงกันก่อนเริ่มงาน"],
  ["ผลิตและเผยแพร่", "ลงในช่องทางที่ตกลงกัน พร้อมบอกคนดูว่าเป็นงานที่ได้รับการสนับสนุน"],
];

const thb = (n: number) => n.toLocaleString("th-TH");

// Opens an Instagram DM thread with @newerathank.
const IG_DM_URL = "https://ig.me/m/newerathank";

function StatGrid({ stats }: { stats: Stat[] }) {
  return (
    <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line/10 bg-line/10 sm:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className="bg-space p-4">
          <dt className="text-xs text-muted">{s.label}</dt>
          <dd className="mt-1">
            <span className="font-display text-2xl font-bold text-ink">{s.value}</span>
            <span className="mt-1 block font-mono text-[11px] text-muted">{s.note}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}

export default async function SponsorPage() {
  const profile = await getProfile();

  return (
    <>
      <JsonLd
        data={jsonLdGraph([
          {
            "@type": "WebPage",
            "@id": `${SITE_URL}/sponsor#webpage`,
            url: `${SITE_URL}/sponsor`,
            name: TITLE,
            description: DESCRIPTION,
            inLanguage: "th",
            about: { "@id": PERSON_ID },
          },
          ...SERVICES.map((s) => ({
            "@type": "Service",
            name: s.name,
            description: s.detail,
            provider: { "@id": PERSON_ID },
            areaServed: "TH",
            offers: {
              "@type": "Offer",
              priceSpecification: { "@type": "PriceSpecification", minPrice: s.price, priceCurrency: "THB" },
            },
          })),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Sponsor", path: "/sponsor" },
          ]),
        ])}
      />
      <Navbar />
      <main className="min-h-screen px-4 pb-16 pt-28 sm:px-6">
        <article className="reading-surface mx-auto w-full max-w-3xl">
          <div className="eyebrow">// Open for sponsors · Media Kit</div>
          <h1 className="font-display text-3xl font-bold leading-tight text-ink md:text-4xl">
            เปิดรับสปอนเซอร์
            <span className="mt-1 block text-2xl text-muted md:text-3xl">ให้คนไทยที่สนใจ AI รู้จักงานและแอปของคุณ</span>
          </h1>

          <p className="mt-8 text-lg leading-relaxed text-ink/90">
            ผมแต้ง (Thank Thanedpol) จากช่อง Thankful เล่าข่าว AI และธุรกิจเป็นภาษาไทยบน YouTube และ TikTok
            ให้คนที่สนใจ AI เข้าใจเรื่องใหม่ได้เร็ว และเอาไปใช้ได้จริง ถ้าคุณมีงาน Event แอปฯ หรือ Platform
            ที่อยากให้คนกลุ่มนี้รู้จัก มาร่วมงานกันครับ
          </p>
          <p lang="en" className="mt-4 leading-relaxed text-muted">
            Thai-language AI and business news creator. Sponsored event recaps and app or platform explainers for a
            Thai audience interested in AI, business and technology.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#contact" className="btn-neon">
              ติดต่อร่วมงาน ↓
            </a>
            <Link href="/work" className="btn-ghost">
              ดูตัวอย่างผลงาน
            </Link>
          </div>

          <h2 className="mt-14 font-display text-2xl font-bold text-ink">ทำไมต้อง Thankful</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-3">
            {WHY.map(([h, p]) => (
              <li key={h} className="rounded-xl border border-line/10 p-5">
                <h3 className="font-display text-base font-bold leading-snug text-ink">{h}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{p}</p>
              </li>
            ))}
          </ul>

          <h2 className="mt-12 font-display text-2xl font-bold text-ink">ผู้ติดตาม</h2>
          <StatGrid stats={AUDIENCE} />

          <h2 className="mt-12 font-display text-2xl font-bold text-ink">ผลงานบน YouTube</h2>
          <p className="mt-1 font-mono text-xs text-muted">{YT_PERIOD}</p>
          <StatGrid stats={YOUTUBE} />

          <h2 className="mt-12 font-display text-2xl font-bold text-ink">บริการและราคาเริ่มต้น</h2>
          <ul className="mt-4 space-y-3">
            {SERVICES.map((s, i) => (
              <li
                key={s.name}
                className="flex flex-col gap-3 rounded-xl border border-line/10 p-5 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="flex gap-4">
                  <span className="font-mono text-sm text-cyan">0{i + 1}</span>
                  <div>
                    <h3 className="font-display text-lg font-bold leading-snug text-ink">{s.name}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{s.detail}</p>
                  </div>
                </div>
                <p className="shrink-0 pl-8 sm:pl-0 sm:text-right">
                  <span className="block font-mono text-[11px] text-muted">เริ่มต้น</span>
                  <span className="font-display text-xl font-bold text-cyan">
                    {thb(s.price)} {s.unit}
                  </span>
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-muted">
            อยากได้หลายชิ้นรวมกัน เช่น คลิปยาว + Shorts + โพสต์ TikTok และ Instagram ส่งรายละเอียดมาเพื่อขอใบเสนอราคา
          </p>
          <p
            role="note"
            className="mt-4 flex items-start gap-3 rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm leading-relaxed text-ink/90"
          >
            <span aria-hidden className="mt-0.5">
              ⚠
            </span>
            <span>
              <strong className="font-semibold">ยังไม่เปิดรับรีวิวสินค้าเกี่ยวกับ Gadget AI</strong>
            </span>
          </p>

          <h2 className="mt-12 font-display text-2xl font-bold text-ink">งาน Event ที่เคยสรุป</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {EVENTS_COVERED.map((e) => (
              <li key={e} className="rounded-full border border-line/15 px-3 py-1 text-sm text-ink/90">
                {e}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            ดูทุกซีรีส์ ({SERIES.length} ซีรีส์) ได้ที่{" "}
            <a href={YT_CHANNEL_URL} target="_blank" rel="noopener noreferrer" className="text-cyan hover:underline">
              YouTube @Thankful2026
            </a>
          </p>

          <h2 className="mt-12 font-display text-2xl font-bold text-ink">วิธีทำงานร่วมกัน</h2>
          <ol className="mt-4 space-y-4">
            {STEPS.map(([h, p], i) => (
              <li key={h} className="flex gap-4">
                <span className="font-mono text-sm text-cyan">{i + 1}</span>
                <div>
                  <h3 className="font-semibold text-ink">{h}</h3>
                  <p className="mt-0.5 text-sm leading-relaxed text-muted">{p}</p>
                </div>
              </li>
            ))}
          </ol>

          <h2 className="mt-12 font-display text-2xl font-bold text-ink">กติกาที่ยึดเสมอ</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted">
            <li>ทุกงานที่ได้รับการสนับสนุน บอกคนดูชัดเจน ทั้งในคลิปและคำอธิบาย และติ๊ก “มีการโปรโมทแบบชำระเงิน” ในแพลตฟอร์ม</li>
            <li>เล่าตามจริง รวมถึงข้อจำกัดของสินค้า เพราะความน่าเชื่อถือคือสิ่งที่ทำให้คนดูฟัง</li>
          </ul>

          <section id="support" aria-labelledby="support-h" className="mt-14 scroll-mt-28 rounded-2xl border border-line/15 p-6 sm:p-8">
            <h2 id="support-h" className="font-display text-xl font-bold text-ink">
              สนับสนุนช่องแบบรายบุคคล
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              ถ้าคลิปของ Thankful ช่วยให้คุณเข้าใจ AI มากขึ้น และอยากช่วยให้มีคลิปใหม่ต่อไป สนับสนุนได้ทุกจำนวน
              ทักมาทางอีเมลหรือ DM ทาง Instagram แล้วจะส่ง QR พร้อมเพย์ให้ครับ
            </p>
            {/* Fan support: no QR on the page yet — people ask and get one privately. */}
            <EmailActions
              className="mt-5"
              label="ขอ QR ทาง Gmail"
              subject="สนับสนุนช่อง Thankful"
              body="สวัสดีครับคุณแต้ง อยากสนับสนุนช่อง Thankful ขอ QR พร้อมเพย์หน่อยครับ"
            />
            <a
              href={IG_DM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block text-sm text-cyan hover:underline"
            >
              หรือทัก DM ทาง Instagram ↗
            </a>
          </section>

          <section id="contact" className="mt-8 scroll-mt-28 rounded-2xl border border-cyan/30 p-6 sm:p-8">
            <h2 className="font-display text-xl font-bold text-ink">เริ่มคุยกันได้เลย</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              ส่งรายละเอียดงานมาที่อีเมล ข้อมูลสำหรับสื่อ (ประวัติ รูป โลโก้) อยู่ที่{" "}
              <Link href="/press-kit" className="text-cyan hover:underline">
                Press Kit
              </Link>
            </p>
            <EmailActions className="mt-5" subject="Sponsor / ร่วมงานกับ Thankful" />
          </section>
        </article>
      </main>
      <Footer social={profile?.social_links} />
    </>
  );
}
