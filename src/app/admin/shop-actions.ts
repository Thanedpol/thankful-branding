"use server";

import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import { isAdminAuthed } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  DOWNLOAD_WINDOW_DAYS,
  formatPrice,
  majorToMinor,
  slugifyProduct,
} from "@/lib/shop";
import { siteOrigin } from "@/lib/stripe";
import type {
  ShopBilling,
  ShopOrder,
  ShopOrderStatus,
  ShopProduct,
  ShopProductKind,
} from "@/lib/types";

/**
 * Verify the admin passcode and return a service-role client. Writes go
 * through service-role because there's no Supabase auth session under the
 * passcode model (RLS would otherwise block them).
 */
async function assertAdmin() {
  if (!(await isAdminAuthed())) throw new Error("Unauthorized");
  return createAdminClient();
}

type Admin = ReturnType<typeof createAdminClient>;

/**
 * Guarantee a non-empty, unique product slug. Thai-only titles slugify to ""
 * (all non-ASCII stripped) and `slug` is UNIQUE NOT NULL, so without this the
 * second such product would fail to insert. Falls back to "product".
 */
async function uniqueProductSlug(
  supabase: Admin,
  base: string,
  excludeId: string | null
): Promise<string> {
  const root = base || "product";
  for (let i = 1; i <= 100; i++) {
    const candidate = i === 1 ? root : `${root}-${i}`;
    const { data } = await supabase
      .from("shop_products")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    const taken = !!data && (!excludeId || (data as { id: string }).id !== excludeId);
    if (!taken) return candidate;
  }
  return `${root}-${Date.now().toString(36)}`;
}

/** Trimmed text, or null — empty strings must not become "" in the database. */
function text(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s || null;
}

/** Baht typed into the form → satang. Blank stays null (i.e. "not set"). */
function satang(v: FormDataEntryValue | null, currency: string): number | null {
  const raw = String(v ?? "").trim().replace(/,/g, "");
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return null;
  return majorToMinor(n, currency);
}

function lines(v: FormDataEntryValue | null): string[] {
  return String(v ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

function jsonList(v: FormDataEntryValue | null): string[] {
  try {
    const parsed: unknown = JSON.parse(String(v ?? "[]"));
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string" && x.trim() !== "");
  } catch {
    return [];
  }
}

function refreshShop(slug?: string | null) {
  revalidatePath("/shop");
  revalidatePath("/admin/shop");
  revalidatePath("/admin/shop/orders");
  if (slug) revalidatePath(`/shop/${slug}`);
}

// ─── Products ───────────────────────────────────────────────────────────────
export async function saveShopProduct(formData: FormData) {
  const supabase = await assertAdmin();
  const id = (formData.get("id") as string | null) || null;

  const title = String(formData.get("title") ?? "").trim();
  const currency = String(formData.get("currency") ?? "thb").toLowerCase() || "thb";
  const kind: ShopProductKind =
    String(formData.get("kind")) === "service" ? "service" : "digital";
  const billingRaw = String(formData.get("billing") ?? "one_time");
  const billing = (["one_time", "month", "year"].includes(billingRaw)
    ? billingRaw
    : "one_time") as ShopBilling;
  const status = String(formData.get("status")) === "published" ? "published" : "draft";

  const base = slugifyProduct(String(formData.get("slug") ?? "")) || slugifyProduct(title);
  const slug = await uniqueProductSlug(supabase, base, id);

  // Blank stock means unlimited, which the schema spells as NULL — "0" is a
  // real value there (sold out), so the two can't be collapsed.
  const stockRaw = String(formData.get("stock") ?? "").trim();
  const stock = stockRaw === "" ? null : Math.max(0, Math.trunc(Number(stockRaw) || 0));

  const row = {
    slug,
    kind,
    title,
    tagline: text(formData.get("tagline")),
    description: text(formData.get("description")),
    features: lines(formData.get("features")),
    cover_image_url: text(formData.get("cover_image_url")),
    gallery: jsonList(formData.get("gallery")),
    price: satang(formData.get("price"), currency) ?? 0,
    compare_at_price: satang(formData.get("compare_at_price"), currency),
    currency,
    billing,
    // Switching a product to a service must not leave a payable file attached
    // to it — the download route would happily keep serving the old object.
    file_path: kind === "digital" ? text(formData.get("file_path")) : null,
    external_url: text(formData.get("external_url")),
    badge: text(formData.get("badge")),
    stock,
    delivery_note: text(formData.get("delivery_note")),
    status,
    featured: formData.get("featured") === "on",
    display_order: Math.trunc(Number(formData.get("display_order") ?? 0) || 0),
    updated_at: new Date().toISOString(),
  };

  if (id) await supabase.from("shop_products").update(row).eq("id", id);
  else await supabase.from("shop_products").insert(row);

  refreshShop(slug);
}

export async function deleteShopProduct(formData: FormData) {
  const supabase = await assertAdmin();
  const id = String(formData.get("id"));

  const { data } = await supabase
    .from("shop_products")
    .select("slug")
    .eq("id", id)
    .maybeSingle();

  await supabase.from("shop_products").delete().eq("id", id);
  refreshShop((data as { slug: string } | null)?.slug);
}

/** The eye button on a product row: draft ⇄ published, nothing else touched. */
export async function toggleShopProductStatus(formData: FormData) {
  const supabase = await assertAdmin();
  const id = String(formData.get("id"));

  const { data } = await supabase
    .from("shop_products")
    .select("slug, status")
    .eq("id", id)
    .maybeSingle();
  const current = data as { slug: string; status: string } | null;
  if (!current) return;

  await supabase
    .from("shop_products")
    .update({
      status: current.status === "published" ? "draft" : "published",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  refreshShop(current.slug);
}

export async function duplicateShopProduct(formData: FormData) {
  const supabase = await assertAdmin();

  const { data } = await supabase
    .from("shop_products")
    .select("*")
    .eq("id", String(formData.get("id")))
    .maybeSingle();
  const src = data as ShopProduct | null;
  if (!src) return;

  const title = `${src.title} (สำเนา)`;
  const slug = await uniqueProductSlug(supabase, slugifyProduct(src.slug || title), null);

  // A copy starts hidden and unsold: it exists to be edited, and inheriting
  // sold_count or "featured" would misreport the original's numbers.
  await supabase.from("shop_products").insert({
    slug,
    kind: src.kind,
    title,
    tagline: src.tagline,
    description: src.description,
    features: src.features,
    cover_image_url: src.cover_image_url,
    gallery: src.gallery,
    price: src.price,
    compare_at_price: src.compare_at_price,
    currency: src.currency,
    billing: src.billing,
    file_path: src.file_path,
    external_url: src.external_url,
    badge: src.badge,
    stock: src.stock,
    delivery_note: src.delivery_note,
    status: "draft",
    featured: false,
    display_order: src.display_order,
    updated_at: new Date().toISOString(),
  });

  refreshShop(slug);
}

// ─── Orders ─────────────────────────────────────────────────────────────────
const ORDER_STATUSES: ShopOrderStatus[] = [
  "pending",
  "paid",
  "fulfilled",
  "cancelled",
  "refunded",
];

export async function updateOrderStatus(formData: FormData) {
  const supabase = await assertAdmin();
  const id = String(formData.get("id"));

  const { data } = await supabase
    .from("shop_orders")
    .select("status, paid_at, fulfilled_at")
    .eq("id", id)
    .maybeSingle();
  const current = data as Pick<ShopOrder, "status" | "paid_at" | "fulfilled_at"> | null;
  if (!current) return;

  const asked = String(formData.get("status") ?? "");
  const status = (ORDER_STATUSES as string[]).includes(asked)
    ? (asked as ShopOrderStatus)
    : current.status;

  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {
    status,
    updated_at: now,
  };
  // The note field is only submitted by the note form, so an absent key must
  // leave the existing note alone rather than wiping it.
  if (formData.has("admin_note")) patch.admin_note = text(formData.get("admin_note"));

  // Timestamps record when a state was FIRST reached, so never overwrite one.
  if (status === "fulfilled" && !current.fulfilled_at) patch.fulfilled_at = now;
  if ((status === "paid" || status === "fulfilled") && !current.paid_at) patch.paid_at = now;

  await supabase.from("shop_orders").update(patch).eq("id", id);

  revalidatePath("/admin/shop");
  revalidatePath("/admin/shop/orders");
}

/**
 * Re-send the buyer's receipt — the everyday fix for "I never got the email".
 * For a paid digital order this also repairs delivery: a missing token is
 * minted and a spent window — expired or fully used — is reopened, so the link
 * in the mail actually works.
 */
export async function resendOrderEmail(
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await assertAdmin();
  const id = String(formData.get("id"));

  const { data } = await supabase
    .from("shop_orders")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  const order = data as ShopOrder | null;
  if (!order) return { ok: false, error: "ไม่พบออเดอร์นี้" };

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, error: "ยังไม่ได้ตั้งค่า RESEND_API_KEY — ส่งอีเมลไม่ได้" };

  const paid = order.status === "paid" || order.status === "fulfilled";
  let token = order.download_token;
  let expires = order.download_expires_at;

  if (paid && order.product_kind === "digital") {
    const expired = !!expires && new Date(expires) < new Date();
    // A used-up counter blocks the download route just as hard as an expired
    // window, so re-sending has to clear it too — otherwise the mail carries a
    // button that answers 403.
    const exhausted = order.download_count >= order.download_limit;
    if (!token || expired || exhausted) {
      token = token ?? crypto.randomUUID();
      expires = new Date(
        Date.now() + DOWNLOAD_WINDOW_DAYS * 24 * 60 * 60 * 1000
      ).toISOString();
      await supabase
        .from("shop_orders")
        .update({
          download_token: token,
          download_expires_at: expires,
          download_count: 0,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
    }
  }

  const downloadUrl =
    paid && order.product_kind === "digital" && token
      ? `${siteOrigin()}/api/shop/download/${token}`
      : null;

  try {
    // Resend reports a rejected send in the payload, not by throwing.
    const { error } = await new Resend(apiKey).emails.send({
      from: process.env.CONTACT_FROM_EMAIL ?? "onboarding@resend.dev",
      // The receipt tells the buyer to just hit reply, so point that at a
      // mailbox someone reads rather than at the sending domain.
      replyTo: process.env.CONTACT_NOTIFY_EMAIL || undefined,
      to: order.buyer_email,
      subject: `ใบเสร็จคำสั่งซื้อ ${order.order_no}`,
      html: receiptHtml(order, downloadUrl, expires),
    });
    if (error) return { ok: false, error: error.message };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "ส่งอีเมลไม่สำเร็จ" };
  }

  revalidatePath("/admin/shop/orders");
  return { ok: true };
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function receiptHtml(
  order: ShopOrder,
  downloadUrl: string | null,
  expiresAt: string | null
): string {
  const amount = formatPrice(order.amount_total, order.currency);
  const unit = formatPrice(order.unit_price, order.currency);
  const expiry = expiresAt
    ? new Date(expiresAt).toLocaleDateString("th-TH", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Bangkok",
      })
    : null;

  return `
    <div style="font-family:system-ui,sans-serif;background:#050508;color:#fff;padding:24px;border-radius:12px">
      <h2 style="color:#00F5FF;margin:0 0 4px">ขอบคุณสำหรับการสั่งซื้อ</h2>
      <p style="color:#8892A4;margin:0 0 20px;font-size:13px">เลขที่คำสั่งซื้อ ${escapeHtml(order.order_no)}</p>
      <p style="margin:0 0 4px"><strong>${escapeHtml(order.product_title)}</strong></p>
      <p style="color:#8892A4;margin:0 0 16px;font-size:13px">
        ${unit} × ${order.quantity} — รวม <strong style="color:#fff">${amount}</strong>
      </p>
      ${
        downloadUrl
          ? `<p style="margin:0 0 8px">
               <a href="${downloadUrl}" style="display:inline-block;background:#00F5FF;color:#050508;font-weight:600;text-decoration:none;padding:12px 20px;border-radius:8px">⬇ ดาวน์โหลดไฟล์</a>
             </p>
             <p style="color:#8892A4;font-size:12px;margin:0 0 16px">
               ดาวน์โหลดได้ ${order.download_limit} ครั้ง${expiry ? ` · ใช้ได้ถึง ${expiry}` : ""}
             </p>`
          : `<p style="color:#8892A4;font-size:13px;margin:0 0 16px">ทีมงานจะติดต่อกลับเพื่อส่งมอบงานให้เร็วที่สุด</p>`
      }
      <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:16px 0" />
      <p style="color:#8892A4;font-size:12px;margin:0">หากมีคำถาม ตอบกลับอีเมลฉบับนี้ได้เลย</p>
    </div>
  `;
}
