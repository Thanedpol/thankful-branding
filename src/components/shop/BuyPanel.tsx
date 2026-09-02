"use client";

import { useState } from "react";
import { billingLabel, billingSuffix, discountPercent, formatPrice } from "@/lib/shop";
import type { ShopProduct } from "@/lib/types";

const field =
  "w-full rounded-lg border border-line/10 bg-surface/[0.03] px-3 py-2 text-sm text-ink placeholder:text-ink/30 outline-none focus:border-cyan/50";

export default function BuyPanel({ product }: { product: ShopProduct }) {
  // A subscription is always one seat — Stripe bills the recurring price itself.
  const isSubscription = product.billing !== "one_time";
  const max = product.stock ?? 99;

  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const qty = isSubscription ? 1 : quantity;
  const total = product.price * qty;
  const off = discountPercent(product);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const data = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;

    try {
      const res = await fetch("/api/shop/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: product.slug,
          quantity: qty,
          buyer: {
            name: data.name || undefined,
            email: data.email,
            phone: data.phone || undefined,
            note: data.note || undefined,
          },
        }),
      });
      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !json.url) {
        throw new Error(json.error || "เปิดหน้าชำระเงินไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      }
      // Leave the button disabled: the browser is already on its way to Stripe.
      window.location.href = json.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass space-y-4 p-6">
      <div>
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="font-display text-3xl font-bold text-ink">
            {formatPrice(product.price, product.currency)}
          </span>
          <span className="text-sm text-muted">{billingSuffix(product.billing)}</span>
          {!!product.compare_at_price && product.compare_at_price > product.price && (
            <span className="text-sm text-muted line-through">
              {formatPrice(product.compare_at_price, product.currency)}
            </span>
          )}
          {off !== null && (
            <span className="rounded-md border border-cyan/40 bg-cyan/10 px-1.5 py-0.5 font-mono text-[10px] text-cyan">
              -{off}%
            </span>
          )}
        </div>
        <p className="mt-1 font-mono text-xs uppercase tracking-wider text-muted">
          {billingLabel(product.billing)}
        </p>
      </div>

      {!isSubscription && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted">จำนวน</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              aria-label="ลดจำนวน"
              className="btn-ghost !px-3 !py-1"
            >
              −
            </button>
            <span className="w-8 text-center font-mono text-sm">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(max, q + 1))}
              disabled={quantity >= max}
              aria-label="เพิ่มจำนวน"
              className="btn-ghost !px-3 !py-1"
            >
              +
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3 border-t border-line/10 pt-4">
        <input name="name" placeholder="ชื่อ-นามสกุล" className={field} />
        <input
          name="email"
          type="email"
          required
          placeholder="อีเมล (สำหรับรับไฟล์และใบเสร็จ)"
          className={field}
        />
        <input name="phone" placeholder="เบอร์โทร (ถ้ามี)" className={field} />
        <textarea
          name="note"
          rows={3}
          placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"
          className={`${field} resize-none`}
        />
      </div>

      <div className="flex items-baseline justify-between border-t border-line/10 pt-4">
        <span className="text-sm text-muted">ยอดรวม</span>
        <span className="font-display text-xl font-bold text-cyan">
          {formatPrice(total, product.currency)}
          <span className="text-sm font-normal text-muted">
            {billingSuffix(product.billing)}
          </span>
        </span>
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <button type="submit" disabled={loading} className="btn-neon w-full">
        {loading ? "กำลังไปหน้าชำระเงิน…" : "ชำระเงิน →"}
      </button>

      <p className="text-center text-xs text-muted">
        ชำระเงินอย่างปลอดภัยผ่าน Stripe
      </p>
    </form>
  );
}
