import type { ShopBilling, ShopOrder, ShopOrderStatus, ShopProduct } from "@/lib/types";

/**
 * Shared shop helpers. Everything here is pure and runs on both the server and
 * the client, so the storefront, the admin console and the Stripe routes all
 * agree on price maths, availability and labels.
 */

/** Zero-decimal currencies bill in whole units; every other one in 1/100. */
const ZERO_DECIMAL = new Set(["jpy", "krw", "vnd", "clp", "isk"]);

export function minorUnitsPerMajor(currency: string): number {
  return ZERO_DECIMAL.has(currency.toLowerCase()) ? 1 : 100;
}

/** 149000 satang → "฿1,490". Fractions only show when there are any. */
export function formatPrice(minor: number, currency = "thb"): string {
  const div = minorUnitsPerMajor(currency);
  const major = minor / div;
  const hasFraction = div > 1 && minor % div !== 0;
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: hasFraction ? 2 : 0,
  }).format(major);
}

/** Baht typed into the admin form → satang for storage. */
export function majorToMinor(major: number, currency = "thb"): number {
  return Math.round(major * minorUnitsPerMajor(currency));
}

export function minorToMajor(minor: number, currency = "thb"): number {
  return minor / minorUnitsPerMajor(currency);
}

/** Whole-percent discount, or null when there is nothing to advertise. */
export function discountPercent(p: Pick<ShopProduct, "price" | "compare_at_price">): number | null {
  const was = p.compare_at_price;
  if (!was || was <= p.price) return null;
  return Math.round(((was - p.price) / was) * 100);
}

export function isSoldOut(p: Pick<ShopProduct, "stock">): boolean {
  return p.stock !== null && p.stock <= 0;
}

/** A product can be bought on-site only when it has a price and stock, and
 *  isn't just a link to somewhere else. */
export function isBuyable(p: ShopProduct): boolean {
  return p.status === "published" && !p.external_url && !isSoldOut(p) && p.price > 0;
}

export function billingSuffix(billing: ShopBilling): string {
  return billing === "month" ? " / เดือน" : billing === "year" ? " / ปี" : "";
}

export function billingLabel(billing: ShopBilling): string {
  return billing === "month"
    ? "รายเดือน"
    : billing === "year"
      ? "รายปี"
      : "จ่ายครั้งเดียว";
}

export const ORDER_STATUS_LABEL: Record<ShopOrderStatus, string> = {
  pending: "รอชำระเงิน",
  paid: "ชำระแล้ว",
  fulfilled: "ส่งมอบแล้ว",
  cancelled: "ยกเลิก",
  refunded: "คืนเงินแล้ว",
};

/** Tailwind classes per status — one source of truth for every badge. */
export const ORDER_STATUS_STYLE: Record<ShopOrderStatus, string> = {
  pending: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  paid: "border-cyan/40 bg-cyan/10 text-cyan",
  fulfilled: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  cancelled: "border-line/20 bg-surface/5 text-muted",
  refunded: "border-red-500/40 bg-red-500/10 text-red-300",
};

/** Counts toward revenue — a pending or cancelled order never does. */
export function isRevenue(status: ShopOrderStatus): boolean {
  return status === "paid" || status === "fulfilled";
}

/** Short, human-quotable order number: TK-<base36 time><random>. */
export function newOrderNo(): string {
  const stamp = Date.now().toString(36).toUpperCase().slice(-6);
  const rand = Math.random().toString(36).toUpperCase().slice(2, 5);
  return `TK-${stamp}${rand}`;
}

/** A paid digital order still entitled to the file. */
export function canDownload(order: Pick<ShopOrder,
  "status" | "download_token" | "download_count" | "download_limit" | "download_expires_at">
): boolean {
  if (!order.download_token) return false;
  if (order.status !== "paid" && order.status !== "fulfilled") return false;
  if (order.download_count >= order.download_limit) return false;
  if (order.download_expires_at && new Date(order.download_expires_at) < new Date()) return false;
  return true;
}

/** How long a buyer keeps access to a digital file after paying. */
export const DOWNLOAD_WINDOW_DAYS = 30;

export function slugifyProduct(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}
