import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import Prism from "@/components/naqid/Prism";
import { SITE_URL, PERSON_ID } from "@/lib/seo";
import { HIRE_CONTACT_EMAIL } from "@/lib/hire";

/**
 * NAQID Group — the founder's deep-tech group, still being set up.
 * Content is the public part of the NAQID business plan and group chart:
 * brand, name, thesis, the three pillars, values and the data firewall.
 * Left out on purpose: financial projections, fundraising, market sizing,
 * the legal-entity and shareholding chart, tax notes and risks.
 * The company is not registered and nothing is on sale yet, so the page says
 * so and labels every unit as a plan ("say the real number").
 */

const PAGE_URL = `${SITE_URL}/naqid`;
const TITLE = "NAQID Group — กลุ่มบริษัท Deep Tech ที่กำลังก่อตั้ง";
const DESCRIPTION =
  "NAQID (นาคิด) คือกลุ่มบริษัท Deep Tech ที่ Thank Thanedpol กำลังก่อตั้ง สร้างเทคโนโลยีระดับแนวหน้าด้วยต้นทุนที่ธุรกิจไทยจ่ายไหว ผ่านสามเสาหลัก: Labs สร้าง · Entertainment เล่า · Signal วัด";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/naqid" },
  icons: { icon: "/naqid-mark.svg" },
  openGraph: {
    type: "website",
    url: PAGE_URL,
    siteName: "NAQID Group",
    title: TITLE,
    description: DESCRIPTION,
    locale: "th_TH",
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const ORG_ID = `${PAGE_URL}#org`;

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": ORG_ID,
      name: "NAQID Group",
      alternateName: ["NAQID", "นาคิด"],
      url: PAGE_URL,
      slogan: "We build technology worth thanking for.",
      description: DESCRIPTION,
      founder: { "@id": PERSON_ID },
      email: `mailto:${HIRE_CONTACT_EMAIL}`,
    },
    {
      "@type": "WebPage",
      "@id": `${PAGE_URL}#webpage`,
      url: PAGE_URL,
      name: TITLE,
      description: DESCRIPTION,
      inLanguage: "th",
      about: { "@id": ORG_ID },
    },
  ],
};

const LETTERS = [
  { l: "N", en: "New", th: "ความใหม่ที่เป็นระบบ ไม่ใช่ความใหม่ที่ตามกระแส" },
  { l: "A", en: "Artificial", th: "ปัญญาประดิษฐ์" },
  { l: "Q", en: "Quantum", th: "ควอนตัม และการหาคำตอบที่ดีที่สุด" },
  { l: "I", en: "Intelligence", th: "ความฉลาดที่วัดผลได้ ไม่ใช่ความฉลาดที่เล่าได้" },
  { l: "D", en: "Deep-Tech", th: "เทคโนโลยีที่มีฐานวิทยาศาสตร์ ไม่ใช่แค่แอปพลิเคชัน" },
];

type Unit = { name: string; what: string; later?: boolean };
type Pillar = {
  id: string;
  verb: string;
  name: string;
  promise: string;
  color: string;
  units: Unit[];
};

const PILLARS: Pillar[] = [
  {
    id: "labs",
    verb: "สร้าง",
    name: "NAQID Labs",
    promise: "ทำให้เทคโนโลยีระดับแนวหน้าถูกลง จนธุรกิจใช้ได้จริง",
    color: "var(--nq-teal)",
    units: [
      { name: "Edge", what: "โมเดลภาษาขนาดเล็กที่ปรับจูนภาษาไทย ติดตั้งในองค์กร ข้อมูลไม่ออกนอกบ้าน" },
      { name: "Ops", what: "เอเจนต์ทำงานหลังบ้าน เช่น ตรวจเคลม จัดเส้นทาง ตรวจคุณภาพด้วยภาพ" },
      { name: "Green", what: "วัดพลังงานและคาร์บอนต่อหนึ่งผลลัพธ์ แล้วใส่เป็นตัวเลขในใบเสนอราคา" },
      { name: "Q", what: "หาคำตอบที่ดีที่สุดด้วยวิธีที่ยืมจากควอนตัม รันบนคอมพิวเตอร์ปกติได้", later: true },
      { name: "Lumen", what: "จอโฮโลแกรมและการแสดงผลเชิงพื้นที่ พร้อม AI ที่โต้ตอบได้", later: true },
    ],
  },
  {
    id: "entertainment",
    verb: "เล่า",
    name: "NAQID Entertainment",
    promise: "ทำให้เรื่องยากสนุก จนคุณดูจบ",
    color: "var(--nq-amber)",
    units: [
      { name: "Studio", what: "ผลิตรายการ คลิปสั้น และ Branded Content ถ่ายหนึ่งวัน แตกได้หลายชิ้น" },
      { name: "PROMPT MASTER", what: "คลิปสั้นที่ย้อนหาคำสั่งจากผลลัพธ์ของ AI" },
      {
        name: "เครื่องคิด",
        what: "รายการเรือธง ผู้แข่งใช้ AI ได้ แต่ทุกครั้งที่ใช้ต้องเสีย “พลังงาน” จากมิเตอร์กลางเวที",
        later: true,
      },
      { name: "Live", what: "งานสด นิทรรศการ และการแข่งขันระดับมหาวิทยาลัย", later: true },
    ],
  },
  {
    id: "signal",
    verb: "วัด",
    name: "NAQID Signal",
    promise: "เราไม่ทำข่าว AI เราทำตัวเลขที่ข่าว AI ต้องอ้างอิง",
    color: "var(--nq-violet)",
    units: [
      { name: "Arena", what: "ดัชนีวัดโมเดล AI บนงานภาษาไทย เผยแพร่ให้ใช้ฟรี" },
      { name: "Wire", what: "ข่าว AI ภาษาไทยที่แนบแหล่งที่มาให้ตรวจได้ทุกข่าว" },
      { name: "Signal Data", what: "ฐานข้อมูลการใช้ AI ในเอเชียตะวันออกเฉียงใต้ สำหรับองค์กร", later: true },
    ],
  },
];

const VALUES = [
  { th: "ก้าวหน้า", en: "Forward by default", what: "เลือกวิธีใหม่ที่ดีกว่าเสมอ แม้วิธีเดิมยังพอใช้ได้" },
  { th: "คุ้มค่า", en: "Frugal by design", what: "วัดทุกเทคโนโลยีด้วยต้นทุนต่อผลลัพธ์ ไม่ใช่ความหวือหวา" },
  { th: "ไม่ตกขบวน", en: "Always current", what: "เฝ้าดูเทคโนโลยีเป็นงานประจำ ไม่รอให้ข่าวมาถึง" },
  { th: "เบาต่อโลก", en: "Light on the planet", what: "วัดและเปิดเผยพลังงานต่อการใช้งานเป็นตัวเลข" },
  { th: "คนโตก่อนบริษัท", en: "People compound", what: "ทุกโปรเจกต์ต้องทิ้งทักษะใหม่ไว้กับทีม ไม่ใช่แค่ส่งมอบงาน" },
  { th: "พูดจริง", en: "Say the real number", what: "ไม่ขายความสามารถที่ยังไม่มี ไม่ปัดตัวเลขเข้าข้างตัวเอง" },
];

const FIREWALL = [
  "ข้อมูลลูกค้าของ NAQID Labs จะไม่ไหลเข้า NAQID Signal แม้ในรูปแบบที่ไม่ระบุชื่อ",
  "Arena จะไม่จัดอันดับผลิตภัณฑ์ของ NAQID Labs",
  "ทุกหน้าที่มีการจัดอันดับ จะบอกผู้จ่ายเงินทุกราย และบอกว่า Signal อยู่ในเครือเดียวกับ Labs",
];

const NAV = [
  { href: "#idea", label: "แนวคิด" },
  { href: "#pillars", label: "สามเสาหลัก" },
  { href: "#values", label: "ค่านิยม" },
  { href: "#status", label: "สถานะ" },
];

export default function NaqidPage() {
  return (
    <>
      <JsonLd data={jsonLd} />

      {/* ── Top bar ─────────────────────────────────────────────── */}
      <header className="nq-hairline sticky top-0 z-30 border-b bg-[rgba(245,242,234,0.9)] backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <a href="#top" className="flex items-center gap-3" aria-label="NAQID Group — ขึ้นบนสุด">
            <Prism size={28} />
            <span className="nq-disp text-[17px] font-light tracking-[0.32em]">NAQID</span>
          </a>
          <nav aria-label="NAQID" className="hidden items-center gap-7 text-[14px] md:flex">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="text-[color:var(--nq-ink-2)] transition-colors hover:text-[color:var(--nq-ink)]">
                {n.label}
              </a>
            ))}
          </nav>
          <Link href="/" className="nq-btn nq-btn-line !px-4 !py-2 text-[13px]">
            <span aria-hidden>←</span> Thank Thanedpol
          </Link>
        </div>
      </header>

      <main id="top">
        {/* ── Hero ──────────────────────────────────────────────── */}
        <section className="relative overflow-hidden">
          <div aria-hidden className="nq-grid pointer-events-none absolute inset-0" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-16 sm:px-6 md:grid-cols-[1.15fr_0.85fr] md:pb-28 md:pt-24">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-[rgba(138,90,0,0.4)] px-3 py-1 text-[13px] text-[color:var(--nq-amber-ink)]">
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[color:var(--nq-amber)]" />
                กำลังก่อตั้ง · ยังไม่ได้จดทะเบียนบริษัท
              </p>
              <p className="nq-mono mt-8 text-[color:var(--nq-teal-ink)]">NAQID Group · Deep Tech จากประเทศไทย</p>
              <h1 className="mt-4 text-[clamp(2.2rem,6vw,4.1rem)] font-medium leading-[1.25] tracking-tight">
                เทคโนโลยีที่คนอยากขอบคุณ
              </h1>
              <p className="nq-disp mt-3 text-[clamp(1.1rem,2.4vw,1.5rem)] font-extralight text-[color:var(--nq-ink-2)]">
                We build technology worth thanking for.
              </p>
              <p className="mt-8 max-w-xl text-[17px] text-[color:var(--nq-ink-2)]">
                NAQID คือกลุ่มบริษัท Deep Tech ที่ Thank Thanedpol กำลังก่อตั้ง
                เราตั้งใจสร้างเทคโนโลยีระดับแนวหน้าด้วยต้นทุนที่ธุรกิจไทยจ่ายไหว ใช้พลังงานน้อย และอธิบายให้เข้าใจได้
                แล้วทำให้คนอยากใช้มันผ่านรายการและคอนเทนต์
              </p>
              <div className="mt-10 flex flex-wrap gap-3">
                <a href="#pillars" className="nq-btn nq-btn-solid">
                  ดูสามเสาหลัก <span aria-hidden>↓</span>
                </a>
                <a href={`mailto:${HIRE_CONTACT_EMAIL}?subject=NAQID%20Group`} className="nq-btn nq-btn-line">
                  ติดต่อผู้ก่อตั้ง
                </a>
              </div>
            </div>
            <div className="flex justify-center md:justify-end">
              <Prism size={340} animate title="สัญลักษณ์ปริซึมของ NAQID: แสงหนึ่งลำแยกเป็นสามสาย" className="h-auto w-[68vw] max-w-[340px]" />
            </div>
          </div>
        </section>

        {/* ── Name ──────────────────────────────────────────────── */}
        <section aria-labelledby="name-h" className="nq-hairline border-t">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-24">
            <p className="nq-mono text-[color:var(--nq-ink-2)]">ชื่อและความหมาย</p>
            <h2 id="name-h" className="mt-3 text-[clamp(1.7rem,3.6vw,2.5rem)] font-medium leading-snug">
              NAQID อ่านว่า “นา-<span className="text-[color:var(--nq-teal-ink)]">คิด</span>”
            </h2>
            <p className="mt-4 max-w-2xl text-[17px] text-[color:var(--nq-ink-2)]">
              มีคำว่า “คิด” อยู่ในชื่อ และแต่ละตัวอักษรบอกสิ่งที่เราทำ
            </p>
            <dl className="mt-12 grid gap-px overflow-hidden rounded-2xl border nq-hairline bg-[color:var(--nq-line)] sm:grid-cols-5">
              {LETTERS.map((x) => (
                <div key={x.l} className="bg-[color:var(--nq-bone)] p-6">
                  <dt>
                    <span className="nq-disp block text-[56px] font-extralight leading-none">{x.l}</span>
                    <span className="nq-disp mt-3 block text-[15px] font-medium">{x.en}</span>
                  </dt>
                  <dd className="mt-2 text-[15px] leading-[1.8] text-[color:var(--nq-ink-2)]">{x.th}</dd>
                </div>
              ))}
            </dl>
            <figure className="mt-14 max-w-3xl border-l-2 border-[color:var(--nq-amber)] pl-6">
              <blockquote className="text-[clamp(1.15rem,2.2vw,1.45rem)] font-normal leading-[1.8]">
                “เทคโนโลยีที่ดี คือเทคโนโลยีที่คนอยากขอบคุณ ไม่ใช่เทคโนโลยีที่คนต้องทน”
              </blockquote>
              <figcaption className="mt-3 text-[15px] text-[color:var(--nq-ink-2)]">
                ที่มาของคำว่า “Thank” — ถ้าลูกค้าใช้แล้วไม่อยากบอกต่อ แปลว่าเรายังทำไม่เสร็จ
              </figcaption>
            </figure>
          </div>
        </section>

        {/* ── Idea ──────────────────────────────────────────────── */}
        <section id="idea" aria-labelledby="idea-h" className="nq-hairline scroll-mt-16 border-t bg-[color:var(--nq-bone-2)]">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 md:grid-cols-2 md:py-24">
            <div>
              <p className="nq-mono text-[color:var(--nq-ink-2)]">แนวคิด</p>
              <h2 id="idea-h" className="mt-3 text-[clamp(1.7rem,3.6vw,2.5rem)] font-medium leading-snug">
                ไม่แข่งสร้าง AI ที่ใหญ่ที่สุด
                <br />
                แต่ทำ AI ที่คุ้มที่สุดต่อหนึ่งผลลัพธ์
              </h2>
            </div>
            <ol className="space-y-8">
              {[
                ["โมเดลเล็ก ทำงานเฉพาะเรื่อง", "ปรับจูนให้ตรงงาน ทำงานบนเครื่องเดียว ต้นทุนต่อการเรียกใช้ต่ำกว่าบริการ AI ขนาดใหญ่"],
                ["ข้อมูลอยู่ในประเทศ", "ติดตั้งในองค์กรได้ ข้อมูลของลูกค้าไม่ต้องออกนอกบ้าน"],
                ["ประหยัดกับรักษ์โลกคือเรื่องเดียวกัน", "โมเดลที่เล็กลงกินไฟน้อยลงและถูกลง เราจึงวัดพลังงานเป็นตัวเลขเสมอ"],
              ].map(([h, p], i) => (
                <li key={h} className="flex gap-5">
                  <span className="nq-disp text-[28px] font-extralight leading-none text-[color:var(--nq-teal-ink)]">0{i + 1}</span>
                  <div>
                    <h3 className="text-[18px] font-medium">{h}</h3>
                    <p className="mt-1 text-[16px] text-[color:var(--nq-ink-2)]">{p}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── Pillars (Void band) ───────────────────────────────── */}
        <section id="pillars" aria-labelledby="pillars-h" className="nq-dark scroll-mt-16">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-28">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="nq-mono text-[color:var(--nq-slate)]">สามเสาหลัก</p>
                <h2 id="pillars-h" className="mt-3 text-[clamp(1.7rem,3.6vw,2.6rem)] font-medium leading-snug">
                  สร้าง · เล่า · วัด
                </h2>
                <p className="mt-3 max-w-xl text-[16px] text-[color:var(--nq-slate)]">
                  แสงหนึ่งลำเข้าปริซึม แล้วแยกเป็นสามสาย ทุกหน่วยด้านล่างเป็นแผน ยังไม่เปิดให้บริการ
                </p>
              </div>
              <Prism size={64} tone="dark" />
            </div>

            <div className="mt-14 grid gap-6 lg:grid-cols-3">
              {PILLARS.map((p) => (
                <article
                  key={p.id}
                  aria-labelledby={`${p.id}-h`}
                  className="nq-hairline flex flex-col rounded-2xl border bg-[rgba(15,24,54,0.6)] p-7"
                  style={{ borderTop: `2px solid ${p.color}` }}
                >
                  <p className="nq-mono" style={{ color: p.color }}>
                    {p.verb}
                  </p>
                  <h3 id={`${p.id}-h`} className="nq-disp mt-2 text-[24px] font-light">
                    {p.name}
                  </h3>
                  <p className="mt-3 text-[16px] leading-[1.8]">{p.promise}</p>
                  <ul className="nq-hairline mt-7 space-y-5 border-t pt-6">
                    {p.units.map((u) => (
                      <li key={u.name}>
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="nq-disp text-[15px] font-medium">{u.name}</span>
                          <span className="shrink-0 text-[12px] text-[color:var(--nq-slate)]">{u.later ? "ระยะถัดไป" : "ระยะแรก"}</span>
                        </div>
                        <p className="mt-1 text-[14.5px] leading-[1.8] text-[color:var(--nq-slate)]">{u.what}</p>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>

            <div className="mt-16 grid gap-10 md:grid-cols-2">
              <div>
                <h3 className="text-[19px] font-medium">สามเสาทำงานต่อกัน</h3>
                <ul className="mt-5 space-y-4 text-[15.5px] leading-[1.8] text-[color:var(--nq-slate)]">
                  <li>
                    <span style={{ color: "var(--nq-teal)" }}>Labs</span> สร้างเทคโนโลยี แล้ว{" "}
                    <span style={{ color: "var(--nq-amber)" }}>Entertainment</span> ใช้มันออกอากาศจริง เป็นการพิสูจน์ต่อหน้าคนดู
                  </li>
                  <li>คลิปและชื่อเสียงจากรายการ ช่วยให้องค์กรตัดสินใจซื้อจาก Labs ได้เร็วขึ้น</li>
                  <li>
                    <span style={{ color: "var(--nq-violet)" }}>Signal</span> ให้ประเด็นและข้อมูลกับรายการ ส่วนรายการพาคนดูมารู้จัก Signal
                  </li>
                </ul>
              </div>
              <div className="nq-hairline rounded-2xl border p-7">
                <h3 className="text-[19px] font-medium">กำแพงข้อมูล ที่เราตั้งไว้ก่อนเปิด</h3>
                <ul className="mt-5 space-y-4">
                  {FIREWALL.map((f) => (
                    <li key={f} className="flex gap-3 text-[15.5px] leading-[1.8] text-[color:var(--nq-slate)]">
                      <span aria-hidden className="mt-[0.7em] h-px w-4 shrink-0 bg-[color:var(--nq-slate)]" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── Values ────────────────────────────────────────────── */}
        <section id="values" aria-labelledby="values-h" className="scroll-mt-16">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-24">
            <p className="nq-mono text-[color:var(--nq-ink-2)]">ค่านิยม</p>
            <h2 id="values-h" className="mt-3 text-[clamp(1.7rem,3.6vw,2.5rem)] font-medium leading-snug">
              หกข้อที่ใช้ตัดสินใจจริง
            </h2>
            <ul className="mt-12 grid gap-px overflow-hidden rounded-2xl border nq-hairline bg-[color:var(--nq-line)] sm:grid-cols-2 lg:grid-cols-3">
              {VALUES.map((v) => (
                <li key={v.th} className="bg-[color:var(--nq-bone)] p-7">
                  <h3 className="text-[20px] font-medium">{v.th}</h3>
                  <p className="nq-disp text-[14px] font-light text-[color:var(--nq-teal-ink)]">{v.en}</p>
                  <p className="mt-3 text-[15.5px] text-[color:var(--nq-ink-2)]">{v.what}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── Status ────────────────────────────────────────────── */}
        <section id="status" aria-labelledby="status-h" className="nq-hairline scroll-mt-16 border-t bg-[color:var(--nq-bone-2)]">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 md:grid-cols-[1fr_1fr] md:py-24">
            <div>
              <p className="nq-mono text-[color:var(--nq-amber-ink)]">พูดจริง</p>
              <h2 id="status-h" className="mt-3 text-[clamp(1.7rem,3.6vw,2.5rem)] font-medium leading-snug">
                ตอนนี้ NAQID อยู่ตรงไหน
              </h2>
              <ul className="mt-8 space-y-4 text-[16.5px] text-[color:var(--nq-ink-2)]">
                <li>— ยังไม่ได้จดทะเบียนบริษัท</li>
                <li>— ยังไม่มีสินค้าหรือบริการที่เปิดขาย ทุกหน่วยในหน้านี้คือแผน</li>
                <li>
                  — ผู้ก่อตั้งเล่าข่าว AI และธุรกิจเป็นภาษาไทยอยู่แล้วที่ช่อง Thankful{" "}
                  <Link href="/about" className="nq-link text-[color:var(--nq-ink)]">
                    ดูประวัติ Thank Thanedpol
                  </Link>
                </li>
              </ul>
            </div>
            <div className="flex flex-col justify-center rounded-2xl bg-[color:var(--nq-void)] p-8 text-[color:var(--nq-bone)] sm:p-10">
              <h3 className="text-[22px] font-medium leading-snug">อยากเป็นลูกค้ารายแรก พันธมิตร หรือร่วมทีม</h3>
              <p className="mt-3 text-[15.5px] text-[color:var(--nq-slate)]">
                เล่าโจทย์ของคุณมาได้ โดยเฉพาะงานที่ AI ช่วยได้แต่ตอนนี้ยังแพงเกินไป
              </p>
              <a
                href={`mailto:${HIRE_CONTACT_EMAIL}?subject=NAQID%20Group`}
                className="nq-btn mt-7 self-start bg-[color:var(--nq-teal)] text-[color:var(--nq-void)] hover:bg-[color:var(--nq-bone)]"
              >
                {HIRE_CONTACT_EMAIL} <span aria-hidden>→</span>
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="nq-dark">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-12 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <Prism size={30} tone="dark" />
            <div>
              <p className="nq-disp text-[15px] font-light tracking-[0.3em]">NAQID GROUP</p>
              <p className="text-[13px] text-[color:var(--nq-slate)]">© {new Date().getFullYear()} NAQID Group · กำลังก่อตั้ง</p>
            </div>
          </div>
          <nav aria-label="NAQID footer" className="flex flex-wrap gap-x-6 gap-y-2 text-[14px] text-[color:var(--nq-slate)]">
            <Link href="/" className="transition-colors hover:text-[color:var(--nq-bone)]">
              Thank Thanedpol
            </Link>
            <Link href="/about" className="transition-colors hover:text-[color:var(--nq-bone)]">
              ผู้ก่อตั้ง
            </Link>
            <a href={`mailto:${HIRE_CONTACT_EMAIL}`} className="transition-colors hover:text-[color:var(--nq-bone)]">
              ติดต่อ
            </a>
          </nav>
        </div>
      </footer>
    </>
  );
}
