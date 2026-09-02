"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  saveShopProduct,
  deleteShopProduct,
  toggleShopProductStatus,
  duplicateShopProduct,
} from "@/app/admin/shop-actions";
import RichTextEditor from "./RichTextEditor";
import AdminSearch from "./AdminSearch";
import { useScrollJumpGuard } from "./use-scroll-jump-guard";
import PrivateFileUpload from "./PrivateFileUpload";
import { compressImage } from "@/lib/compress-image";
import {
  billingLabel,
  discountPercent,
  formatPrice,
  isSoldOut,
  majorToMinor,
  minorToMajor,
} from "@/lib/shop";
import type { ShopBilling, ShopProduct, ShopProductKind } from "@/lib/types";

/** Headline numbers for the strip across the top. Computed on the server. */
export interface ShopStats {
  currency: string;
  /** Satang, last 12 months, paid + fulfilled only. */
  revenue: number;
  /** Satang, last 30 days — the "is it still selling?" number. */
  revenue30: number;
  orders: number;
  pending: number;
  published: number;
}

const field =
  "w-full rounded-lg border border-line/10 bg-surface/[0.03] px-3 py-2 text-sm text-ink placeholder:text-ink/30 outline-none focus:border-cyan/50";

const KIND_LABEL: Record<ShopProductKind, string> = {
  digital: "ดิจิทัล",
  service: "บริการ",
};

const BILLINGS: ShopBilling[] = ["one_time", "month", "year"];

export default function ShopManager({
  products,
  stats,
}: {
  products: ShopProduct[];
  stats: ShopStats;
}) {
  const [editing, setEditing] = useState<ShopProduct | "new" | null>(null);
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const filtered = q
    ? products.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q) ||
          (p.tagline ?? "").toLowerCase().includes(q) ||
          KIND_LABEL[p.kind].includes(q)
      )
    : products;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">// Commerce</p>
          <h1 className="font-display text-3xl font-bold">ร้านค้า</h1>
        </div>
        <div className="flex w-full items-center gap-3 sm:w-auto">
          <AdminSearch value={query} onChange={setQuery} placeholder="ค้นหาสินค้า / slug…" />
          <button onClick={() => setEditing("new")} className="btn-neon shrink-0 whitespace-nowrap">
            + สินค้าใหม่
          </button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="ยอดขายรวม"
          value={formatPrice(stats.revenue, stats.currency)}
          sub={`30 วันล่าสุด ${formatPrice(stats.revenue30, stats.currency)}`}
          accent
        />
        <Stat label="ออเดอร์ทั้งหมด" value={stats.orders.toLocaleString()} sub="12 เดือนล่าสุด" />
        <Stat
          label="รอดำเนินการ"
          value={stats.pending.toLocaleString()}
          sub={stats.pending > 0 ? "ยังไม่ชำระเงิน" : "เคลียร์หมดแล้ว"}
          warn={stats.pending > 0}
        />
        <Stat
          label="สินค้าที่เผยแพร่"
          value={`${stats.published} / ${products.length}`}
          sub="ที่ลูกค้ามองเห็น"
        />
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link href="/admin/shop/orders" className="btn-ghost text-xs">
          ดูออเดอร์ทั้งหมด →
        </Link>
        <Link
          href="/shop"
          target="_blank"
          className="font-mono text-xs uppercase tracking-wider text-cyan/70 hover:text-cyan"
        >
          ↗ เปิดหน้าร้าน
        </Link>
      </div>

      {q && (
        <p className="mb-2 font-mono text-[11px] text-muted">
          พบ {filtered.length} จาก {products.length} สินค้า
        </p>
      )}

      <div className="glass divide-y divide-line/[0.06]">
        {products.length === 0 ? (
          <p className="p-6 font-mono text-sm text-muted">
            ยังไม่มีสินค้า — กด “+ สินค้าใหม่” เพื่อเริ่มขาย
          </p>
        ) : filtered.length === 0 ? (
          <p className="p-6 font-mono text-sm text-muted">ไม่พบสินค้าที่ตรงกับ “{query}”</p>
        ) : (
          filtered.map((p) => <Row key={p.id} p={p} onEdit={() => setEditing(p)} />)
        )}
      </div>

      {editing && (
        <Editor item={editing === "new" ? null : editing} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  accent,
  warn,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
  warn?: boolean;
}) {
  return (
    <div className={`glass p-4 ${accent ? "border-cyan/20" : ""}`}>
      <p className="font-mono text-[10px] uppercase tracking-wider text-muted">{label}</p>
      <p
        className={`mt-1 font-display text-2xl font-bold ${
          accent ? "text-gradient" : warn ? "text-amber-300" : ""
        }`}
      >
        {value}
      </p>
      {sub && <p className="mt-0.5 font-mono text-[10px] text-muted">{sub}</p>}
    </div>
  );
}

function Row({ p, onEdit }: { p: ShopProduct; onEdit: () => void }) {
  const off = discountPercent(p);
  const published = p.status === "published";
  const soldOut = isSoldOut(p);

  return (
    <div className="flex flex-wrap items-center gap-4 p-4">
      <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-md bg-surface/5">
        {p.cover_image_url && (
          <Image
            src={p.cover_image_url}
            alt=""
            fill
            unoptimized={p.cover_image_url.endsWith(".svg")}
            className="object-cover"
            sizes="64px"
          />
        )}
      </div>

      <div className="min-w-0 flex-1 basis-56">
        <p className="truncate font-body font-medium">
          {p.featured && <span className="mr-2 text-cyan">★</span>}
          {p.title}
        </p>
        <p className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[11px]">
          <span className="rounded border border-line/15 px-1.5 py-0.5 text-muted">
            {KIND_LABEL[p.kind]}
          </span>
          <span
            className={`rounded px-1.5 py-0.5 ${
              published
                ? "border border-green-400/30 text-green-400"
                : "border border-line/15 text-muted"
            }`}
          >
            {published ? "published" : "draft"}
          </span>
          {p.badge && (
            <span className="rounded border border-cyan/30 px-1.5 py-0.5 text-cyan/80">
              {p.badge}
            </span>
          )}
          {soldOut && (
            <span className="rounded border border-red-400/30 px-1.5 py-0.5 text-red-400">
              หมด
            </span>
          )}
          <span className="text-ink/30">/{p.slug}</span>
        </p>
      </div>

      <div className="w-28 shrink-0 text-right">
        <p className="font-body text-sm">
          {formatPrice(p.price, p.currency)}
          {p.billing !== "one_time" && (
            <span className="font-mono text-[10px] text-muted">
              {p.billing === "month" ? " /ด." : " /ปี"}
            </span>
          )}
        </p>
        {off !== null && !!p.compare_at_price && (
          <p className="font-mono text-[10px] text-muted">
            <span className="line-through">{formatPrice(p.compare_at_price, p.currency)}</span>{" "}
            <span className="text-cyan">−{off}%</span>
          </p>
        )}
      </div>

      <div className="w-24 shrink-0 text-right font-mono text-[11px] text-muted">
        <p>ขาย {p.sold_count}</p>
        <p>คงเหลือ {p.stock === null ? "∞" : p.stock}</p>
      </div>

      <p className="w-12 shrink-0 text-right font-mono text-[11px] text-ink/30">
        #{p.display_order}
      </p>

      <div className="flex shrink-0 items-center gap-3">
        <form action={toggleShopProductStatus}>
          <input type="hidden" name="id" value={p.id} />
          <button
            title={published ? "กำลังแสดงในหน้าร้าน — กดเพื่อซ่อน" : "ซ่อนอยู่ — กดเพื่อเผยแพร่"}
            aria-label={published ? "ซ่อนสินค้า" : "เผยแพร่สินค้า"}
            className={`text-sm ${published ? "opacity-100" : "opacity-45"} hover:opacity-100`}
          >
            {published ? "👁" : "🚫"}
          </button>
        </form>
        <form action={duplicateShopProduct}>
          <input type="hidden" name="id" value={p.id} />
          <button
            title="ทำสำเนาเป็นฉบับร่าง"
            className="font-mono text-xs uppercase tracking-wider text-ink/40 hover:text-cyan"
          >
            Copy
          </button>
        </form>
        <button
          onClick={onEdit}
          className="font-mono text-xs uppercase tracking-wider text-cyan/70 hover:text-cyan"
        >
          Edit
        </button>
        <form
          action={deleteShopProduct}
          onSubmit={(e) => {
            if (
              !window.confirm(
                `ลบ “${p.title}” ถาวร?\n\n` +
                  `ประวัติออเดอร์ยังอยู่ แต่ลิงก์ดาวน์โหลดของคนที่ซื้อไปแล้วจะใช้ไม่ได้อีก\n` +
                  `ถ้าแค่อยากเอาออกจากหน้าร้าน ให้กดปุ่มรูปตาซ่อนแทน`
              )
            )
              e.preventDefault();
          }}
        >
          <input type="hidden" name="id" value={p.id} />
          <button className="font-mono text-xs uppercase tracking-wider text-red-400/70 hover:text-red-400">
            Delete
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Editor ─────────────────────────────────────────────────────────────────
function Editor({ item, onClose }: { item: ShopProduct | null; onClose: () => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useScrollJumpGuard(scrollRef);

  const currency = item?.currency ?? "thb";
  const [kind, setKind] = useState<ShopProductKind>(item?.kind ?? "digital");
  const [price, setPrice] = useState(
    item ? String(minorToMajor(item.price, currency)) : ""
  );
  const [compare, setCompare] = useState(
    item?.compare_at_price ? String(minorToMajor(item.compare_at_price, currency)) : ""
  );
  const [billing, setBilling] = useState<ShopBilling>(item?.billing ?? "one_time");
  const [saving, setSaving] = useState(false);

  return (
    <div
      ref={scrollRef}
      className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto p-4 sm:p-8"
    >
      <div className="absolute inset-0 bg-space" onClick={onClose} />
      <form
        action={async (fd) => {
          setSaving(true);
          try {
            await saveShopProduct(fd);
            onClose();
          } finally {
            // A rejected save (expired passcode) would otherwise leave the
            // button disabled for good, stranding the admin's unsaved work.
            setSaving(false);
          }
        }}
        className="glass relative z-10 my-4 w-full max-w-2xl space-y-6 bg-space-light p-6"
      >
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-xl font-bold">
            {item ? "แก้ไขสินค้า" : "สินค้าใหม่"}
          </h2>
          {item && (
            <Link
              href={`/shop/${item.slug}`}
              target="_blank"
              className="font-mono text-[11px] text-cyan/70 hover:text-cyan"
            >
              ↗ ดูหน้าสินค้า
            </Link>
          )}
        </div>
        {item && <input type="hidden" name="id" value={item.id} />}
        <input type="hidden" name="currency" value={currency} />

        <Section title="ข้อมูลสินค้า">
          <Label l="ชื่อสินค้า">
            <input name="title" required defaultValue={item?.title} className={field} />
          </Label>
          <div className="grid gap-4 sm:grid-cols-2">
            <Label l="Slug (เว้นว่างให้สร้างอัตโนมัติ)">
              <input
                name="slug"
                defaultValue={item?.slug}
                placeholder="my-product"
                className={`${field} font-mono text-xs`}
              />
            </Label>
            <Label l="ป้ายกำกับ (badge)">
              <input
                name="badge"
                defaultValue={item?.badge ?? ""}
                placeholder="ขายดี / ใหม่ / ลด 40%"
                className={field}
              />
            </Label>
          </div>
          <Label l="คำโปรย (แสดงใต้ชื่อบนการ์ด)">
            <input
              name="tagline"
              defaultValue={item?.tagline ?? ""}
              placeholder="เทมเพลตพร้อมใช้ 40 หน้า"
              className={field}
            />
          </Label>
          <Label l="ประเภท">
            <select
              name="kind"
              value={kind}
              onChange={(e) => setKind(e.target.value as ShopProductKind)}
              className={field}
            >
              <option value="digital" className="bg-space">
                ดิจิทัล — ส่งไฟล์อัตโนมัติหลังชำระเงิน
              </option>
              <option value="service" className="bg-space">
                บริการ — ติดต่อส่งมอบเอง
              </option>
            </select>
          </Label>
        </Section>

        <Section title="รายละเอียด">
          {/* Not wrapped in <Label> — a <label> would forward toolbar clicks
              into the editor's first control instead of firing the button. */}
          <div>
            <span className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-muted">
              คำอธิบาย
            </span>
            <RichTextEditor name="description" defaultValue={item?.description ?? ""} />
          </div>
          <Label l="สิ่งที่ลูกค้าจะได้รับ (บรรทัดละ 1 ข้อ)">
            <textarea
              name="features"
              rows={5}
              defaultValue={item?.features.join("\n") ?? ""}
              placeholder={"ไฟล์ PDF 120 หน้า\nอัปเดตฟรีตลอดชีพ\nกลุ่มถาม-ตอบส่วนตัว"}
              className={`${field} resize-y font-mono text-xs leading-relaxed`}
            />
          </Label>
        </Section>

        <Section title="ราคา">
          <div className="grid gap-4 sm:grid-cols-3">
            <Label l="ราคาขาย (บาท)">
              <BahtInput name="price" value={price} onChange={setPrice} required />
            </Label>
            <Label l="ราคาก่อนลด (บาท)">
              <BahtInput name="compare_at_price" value={compare} onChange={setCompare} />
            </Label>
            <Label l="รอบการเรียกเก็บ">
              <select
                name="billing"
                value={billing}
                onChange={(e) => setBilling(e.target.value as ShopBilling)}
                className={field}
              >
                {BILLINGS.map((b) => (
                  <option key={b} value={b} className="bg-space">
                    {billingLabel(b)}
                  </option>
                ))}
              </select>
            </Label>
          </div>
          <PricePreview price={price} compare={compare} billing={billing} currency={currency} />
        </Section>

        <Section title="รูปภาพ">
          <CoverImageField name="cover_image_url" defaultValue={item?.cover_image_url ?? ""} />
          <GalleryEditor defaultValue={item?.gallery ?? []} />
        </Section>

        <Section title="การส่งมอบ">
          {kind === "digital" ? (
            <PrivateFileUpload
              name="file_path"
              defaultValue={item?.file_path ?? ""}
              bucket="shop-files"
              label="ไฟล์ที่ลูกค้าจะได้รับ (ดาวน์โหลดได้เฉพาะคนที่จ่ายแล้ว)"
              hint="เก็บเป็น path ใน bucket “shop-files” ไม่ใช่ลิงก์สาธารณะ — เปิดตรง ๆ ไม่ได้ อัปได้ถึง 50MB"
            />
          ) : (
            <Label l="วิธีส่งมอบ (บอกลูกค้าว่าจะเกิดอะไรขึ้นหลังชำระเงิน)">
              <textarea
                name="delivery_note"
                rows={2}
                defaultValue={item?.delivery_note ?? ""}
                placeholder="ทีมงานติดต่อกลับทางอีเมลภายใน 24 ชั่วโมงเพื่อนัดเวลา"
                className={`${field} resize-none`}
              />
            </Label>
          )}
          {kind === "digital" && (
            <Label l="ข้อความหลังชำระเงิน">
              <input
                name="delivery_note"
                defaultValue={item?.delivery_note ?? ""}
                placeholder="ส่งลิงก์ดาวน์โหลดทันทีทางอีเมล"
                className={field}
              />
            </Label>
          )}
          <Label l="ขายที่อื่นแทน (ใส่ลิงก์แล้วปุ่มซื้อจะพาออกไปหน้านั้น)">
            <input
              type="url"
              name="external_url"
              defaultValue={item?.external_url ?? ""}
              placeholder="https://shopee.co.th/…"
              className={`${field} font-mono text-xs`}
            />
          </Label>
        </Section>

        <Section title="การขาย">
          <div className="grid gap-4 sm:grid-cols-3">
            <Label l="สต็อก (เว้นว่าง = ไม่จำกัด)">
              <input
                type="number"
                min={0}
                name="stock"
                defaultValue={item?.stock ?? ""}
                placeholder="∞"
                className={field}
              />
            </Label>
            <Label l="ลำดับการแสดง">
              <input
                type="number"
                name="display_order"
                defaultValue={item?.display_order ?? 0}
                className={field}
              />
            </Label>
            <Label l="สถานะ">
              <select name="status" defaultValue={item?.status ?? "draft"} className={field}>
                <option value="draft" className="bg-space">
                  ฉบับร่าง (ซ่อน)
                </option>
                <option value="published" className="bg-space">
                  เผยแพร่
                </option>
              </select>
            </Label>
          </div>
          <label className="flex items-center gap-2 font-mono text-xs text-muted">
            <input
              type="checkbox"
              name="featured"
              defaultChecked={item?.featured}
              className="accent-cyan"
            />
            ปักหมุดเป็นสินค้าแนะนำ
          </label>
          {item && (
            <p className="font-mono text-[10px] text-ink/30">
              ขายไปแล้ว {item.sold_count} ชิ้น · แก้ไขล่าสุด{" "}
              {new Date(item.updated_at).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}
            </p>
          )}
        </Section>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="btn-neon flex-1 disabled:opacity-50">
            {saving ? "กำลังบันทึก…" : "บันทึก"}
          </button>
          <button type="button" onClick={onClose} className="btn-ghost">
            ยกเลิก
          </button>
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4 rounded-xl border border-line/10 p-4">
      <legend className="px-2 font-mono text-[11px] uppercase tracking-wider text-cyan/70">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

function Label({ l, children }: { l: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-muted">
        {l}
      </span>
      {children}
    </label>
  );
}

function BahtInput({
  name,
  value,
  onChange,
  required,
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-ink/40">
        ฿
      </span>
      <input
        type="number"
        min={0}
        step="0.01"
        name={name}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
        className={`${field} pl-7`}
      />
    </div>
  );
}

/**
 * Prices are stored in satang but typed in baht, and a slipped decimal turns
 * ฿1,490 into ฿14.90 without anything looking wrong. Echo back exactly what a
 * buyer will see, computed through the same helper the storefront uses.
 */
function PricePreview({
  price,
  compare,
  billing,
  currency,
}: {
  price: string;
  compare: string;
  billing: ShopBilling;
  currency: string;
}) {
  const p = Number(price);
  const c = Number(compare);
  if (!price.trim() || !Number.isFinite(p)) {
    return <p className="font-mono text-[11px] text-muted">ใส่ราคาเพื่อดูตัวอย่าง</p>;
  }

  const minor = majorToMinor(p, currency);
  const compareMinor = compare.trim() && Number.isFinite(c) ? majorToMinor(c, currency) : null;
  const off = discountPercent({ price: minor, compare_at_price: compareMinor });
  const suffix = billing === "month" ? " / เดือน" : billing === "year" ? " / ปี" : "";

  return (
    <p className="flex flex-wrap items-baseline gap-2 rounded-lg border border-cyan/20 bg-cyan/[0.04] px-3 py-2 font-mono text-[11px] text-muted">
      ลูกค้าจะเห็นราคานี้:
      <span className="font-display text-base font-bold text-ink">
        {formatPrice(minor, currency)}
        {suffix}
      </span>
      {compareMinor !== null && (
        <span className="line-through text-ink/30">{formatPrice(compareMinor, currency)}</span>
      )}
      {off !== null && <span className="text-cyan">ลด {off}%</span>}
      <span className="text-ink/25">({minor.toLocaleString()} สตางค์)</span>
    </p>
  );
}

/** Public URL for an object we uploaded but only got a storage path back for. */
function publicUrlFor(bucket: string, path: string) {
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/+$/, "");
  return `${base}/storage/v1/object/public/${bucket}/${path}`;
}

/**
 * Cover picker for the public "shop-images" bucket. /api/admin-upload only
 * returns a ready-made `publicUrl` for the buckets it was written against, so
 * fall back to building the URL from the object path it always returns —
 * otherwise an upload here appears to succeed and stores an empty cover.
 */
function CoverImageField({ name, defaultValue }: { name: string; defaultValue: string }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(defaultValue);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setErr(null);

    const upload = await compressImage(file).catch(() => file);
    const fd = new FormData();
    fd.append("file", upload);
    fd.append("bucket", "shop-images");
    try {
      const res = await fetch("/api/admin-upload", { method: "POST", body: fd });
      const data = await res.json();
      const next = res.ok
        ? data.publicUrl || (data.path ? publicUrlFor("shop-images", data.path) : "")
        : "";
      if (next) setUrl(next);
      else setErr(data.error || "อัปโหลดไม่สำเร็จ");
    } catch {
      setErr("อัปโหลดไม่สำเร็จ");
    }
    setBusy(false);
  }

  return (
    <div>
      <span className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-muted">
        รูปหน้าปก
      </span>
      <input type="hidden" name={name} value={url} />

      <div className="flex items-start gap-3">
        <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-md border border-line/10 bg-surface/5">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-mono text-[10px] text-ink/30">
              no image
            </div>
          )}
        </div>

        <div className="flex-1 space-y-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="rounded-lg border border-cyan/40 bg-cyan/10 px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-cyan transition-colors hover:bg-cyan/20 disabled:opacity-50"
          >
            {busy ? "กำลังอัปโหลด…" : "⬆ อัปโหลดรูป"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={onFile}
            className="hidden"
          />
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="หรือวางลิงก์รูป https://…"
            className={`${field} font-mono text-xs`}
          />
          {err && <p className="font-mono text-[10px] text-red-400">⚠ {err}</p>}
        </div>
      </div>
    </div>
  );
}

function GalleryEditor({ defaultValue }: { defaultValue: string[] }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [urls, setUrls] = useState<string[]>(defaultValue);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const set = (i: number, v: string) =>
    setUrls((prev) => prev.map((u, idx) => (idx === i ? v : u)));
  const remove = (i: number) => setUrls((prev) => prev.filter((_, idx) => idx !== i));

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    setBusy(true);
    setErr(null);

    for (const file of files) {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("bucket", "shop-images");
      try {
        const res = await fetch("/api/admin-upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) {
          setErr(data.error || "อัปโหลดไม่สำเร็จ");
          break;
        }
        const url = data.publicUrl || (data.path ? publicUrlFor("shop-images", data.path) : "");
        if (url) setUrls((prev) => [...prev, url]);
      } catch {
        setErr("อัปโหลดไม่สำเร็จ");
        break;
      }
    }
    setBusy(false);
  }

  return (
    <div>
      <span className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-muted">
        แกลเลอรี ({urls.length} รูป)
      </span>
      <input type="hidden" name="gallery" value={JSON.stringify(urls)} />

      <div className="space-y-2">
        {urls.map((u, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="relative h-10 w-14 shrink-0 overflow-hidden rounded border border-line/10 bg-surface/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {u && <img src={u} alt="" className="h-full w-full object-cover" />}
            </div>
            <input
              value={u}
              onChange={(e) => set(i, e.target.value)}
              placeholder="https://…"
              className={`${field} font-mono text-xs`}
            />
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label="ลบรูปนี้"
              className="shrink-0 px-2 font-mono text-xs text-ink/40 hover:text-red-400"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="rounded-lg border border-cyan/40 bg-cyan/10 px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-cyan transition-colors hover:bg-cyan/20 disabled:opacity-50"
        >
          {busy ? "กำลังอัปโหลด…" : "⬆ อัปโหลดรูป"}
        </button>
        <button
          type="button"
          onClick={() => setUrls((prev) => [...prev, ""])}
          className="btn-ghost text-xs"
        >
          + เพิ่มลิงก์
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          onChange={onFile}
          className="hidden"
        />
      </div>
      {err && <p className="mt-1 font-mono text-[10px] text-red-400">⚠ {err}</p>}
    </div>
  );
}

