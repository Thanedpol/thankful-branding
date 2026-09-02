"use client";

import { useState, useTransition } from "react";
import { updateOrderStatus, resendOrderEmail } from "@/app/admin/shop-actions";
import AdminSearch from "./AdminSearch";
import {
  ORDER_STATUS_LABEL,
  ORDER_STATUS_STYLE,
  canDownload,
  formatPrice,
  isRevenue,
} from "@/lib/shop";
import type { ShopOrder, ShopOrderStatus } from "@/lib/types";

const STATUSES: ShopOrderStatus[] = [
  "pending",
  "paid",
  "fulfilled",
  "cancelled",
  "refunded",
];

const field =
  "w-full rounded-lg border border-line/10 bg-surface/[0.03] px-3 py-2 text-sm text-ink placeholder:text-ink/30 outline-none focus:border-cyan/50";

function dateTime(iso: string) {
  return new Date(iso).toLocaleString("th-TH", {
    day: "numeric",
    month: "short",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Bangkok",
  });
}

export default function ShopOrders({ orders }: { orders: ShopOrder[] }) {
  const [status, setStatus] = useState<ShopOrderStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const q = query.trim().toLowerCase();
  const filtered = orders.filter((o) => {
    if (status !== "all" && o.status !== status) return false;
    if (!q) return true;
    return (
      o.order_no.toLowerCase().includes(q) ||
      o.buyer_email.toLowerCase().includes(q) ||
      (o.buyer_name ?? "").toLowerCase().includes(q) ||
      o.product_title.toLowerCase().includes(q)
    );
  });

  const currency = orders[0]?.currency ?? "thb";
  const revenue = filtered.reduce(
    (sum, o) => (isRevenue(o.status) ? sum + o.amount_total : sum),
    0
  );
  const counts = (s: ShopOrderStatus) => orders.filter((o) => o.status === s).length;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">// Commerce</p>
          <h1 className="font-display text-3xl font-bold">ออเดอร์</h1>
        </div>
        <AdminSearch
          value={query}
          onChange={setQuery}
          placeholder="เลขออเดอร์ / อีเมล / สินค้า…"
        />
      </div>

      <div className="glass mb-4 flex flex-wrap items-center justify-between gap-4 p-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted">
            ยอดขายของรายการที่แสดง
          </p>
          <p className="font-display text-2xl font-bold text-gradient">
            {formatPrice(revenue, currency)}
          </p>
        </div>
        <p className="font-mono text-[11px] text-muted">
          {filtered.length} จาก {orders.length} ออเดอร์
          {status !== "all" && ` · กรอง: ${ORDER_STATUS_LABEL[status]}`}
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <Chip on={status === "all"} onClick={() => setStatus("all")}>
          ทั้งหมด {orders.length}
        </Chip>
        {STATUSES.map((s) => (
          <Chip key={s} on={status === s} onClick={() => setStatus(s)} tone={ORDER_STATUS_STYLE[s]}>
            {ORDER_STATUS_LABEL[s]} {counts(s)}
          </Chip>
        ))}
      </div>

      <div className="glass divide-y divide-line/[0.06]">
        {orders.length === 0 ? (
          <p className="p-6 font-mono text-sm text-muted">ยังไม่มีออเดอร์</p>
        ) : filtered.length === 0 ? (
          <p className="p-6 font-mono text-sm text-muted">ไม่พบออเดอร์ที่ตรงกับเงื่อนไข</p>
        ) : (
          filtered.map((o) => (
            <OrderRow
              key={o.id}
              o={o}
              open={open === o.id}
              onToggle={() => setOpen(open === o.id ? null : o.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function Chip({
  on,
  onClick,
  tone,
  children,
}: {
  on: boolean;
  onClick: () => void;
  /** Colour classes to wear while selected — the status's own badge palette. */
  tone?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1 font-mono text-[11px] transition-colors ${
        on
          ? (tone ?? "border-cyan/40 bg-cyan/10 text-cyan")
          : "border-line/10 text-muted hover:border-line/25 hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function OrderRow({ o, open, onToggle }: { o: ShopOrder; open: boolean; onToggle: () => void }) {
  const [copied, setCopied] = useState(false);

  function copyEmail(e: React.MouseEvent) {
    e.stopPropagation();
    navigator.clipboard?.writeText(o.buyer_email).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      },
      () => undefined
    );
  }

  return (
    <div>
      <div
        onClick={onToggle}
        className="flex cursor-pointer flex-wrap items-center gap-4 p-4 hover:bg-surface/[0.02]"
      >
        <span className="w-4 shrink-0 font-mono text-xs text-ink/30">{open ? "▾" : "▸"}</span>

        <div className="w-28 shrink-0">
          <p className="font-mono text-xs text-cyan/80">{o.order_no}</p>
          <p className="font-mono text-[10px] text-ink/30">{dateTime(o.created_at)}</p>
        </div>

        <div className="min-w-0 flex-1 basis-48">
          <p className="truncate font-body text-sm">{o.product_title}</p>
          <p className="font-mono text-[10px] text-muted">
            {o.product_kind === "digital" ? "ดิจิทัล" : "บริการ"} × {o.quantity}
          </p>
        </div>

        <div className="min-w-0 basis-48">
          <p className="truncate font-body text-sm">{o.buyer_name || "—"}</p>
          <button
            onClick={copyEmail}
            title="คลิกเพื่อคัดลอกอีเมล"
            className="max-w-full truncate font-mono text-[10px] text-muted hover:text-cyan"
          >
            {copied ? "✓ คัดลอกแล้ว" : o.buyer_email}
          </button>
        </div>

        <p className="w-24 shrink-0 text-right font-body text-sm">
          {formatPrice(o.amount_total, o.currency)}
        </p>

        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 font-mono text-[10px] ${ORDER_STATUS_STYLE[o.status]}`}
        >
          {ORDER_STATUS_LABEL[o.status]}
        </span>
      </div>

      {open && <OrderDetail o={o} />}
    </div>
  );
}

function OrderDetail({ o }: { o: ShopOrder }) {
  const [pending, start] = useTransition();
  const [mail, setMail] = useState<string | null>(null);

  function resend() {
    const fd = new FormData();
    fd.append("id", o.id);
    setMail(null);
    start(async () => {
      const res = await resendOrderEmail(fd);
      setMail(res.ok ? `✓ ส่งไปที่ ${o.buyer_email} แล้ว` : `⚠ ${res.error ?? "ส่งไม่สำเร็จ"}`);
    });
  }

  const downloadable = canDownload(o);

  return (
    <div className="grid gap-6 border-t border-line/[0.06] bg-surface/[0.02] p-5 lg:grid-cols-2">
      <div className="space-y-1.5 font-mono text-[11px]">
        <Fact k="โทรศัพท์" v={o.buyer_phone || "—"} />
        <Fact k="ราคาต่อชิ้น" v={`${formatPrice(o.unit_price, o.currency)} × ${o.quantity}`} />
        <Fact k="ชำระเมื่อ" v={o.paid_at ? dateTime(o.paid_at) : "—"} />
        <Fact k="ส่งมอบเมื่อ" v={o.fulfilled_at ? dateTime(o.fulfilled_at) : "—"} />
        {o.product_kind === "digital" && (
          <Fact
            k="ดาวน์โหลด"
            v={`${o.download_count} / ${o.download_limit} ครั้ง${
              o.download_expires_at ? ` · ถึง ${dateTime(o.download_expires_at)}` : ""
            }${downloadable ? "" : " · ลิงก์ใช้ไม่ได้แล้ว"}`}
          />
        )}
        <Fact k="Stripe session" v={o.stripe_session_id || "—"} mono />
        <Fact k="Payment intent" v={o.stripe_payment_intent || "—"} mono />
        {o.stripe_subscription_id && (
          <Fact k="Subscription" v={o.stripe_subscription_id} mono />
        )}
        {o.note && (
          <div className="mt-3 rounded-lg border border-line/10 p-3">
            <p className="mb-1 uppercase tracking-wider text-muted">ข้อความจากลูกค้า</p>
            <p className="whitespace-pre-wrap font-body text-sm text-ink">{o.note}</p>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <form action={updateOrderStatus} className="flex flex-wrap gap-2">
          <input type="hidden" name="id" value={o.id} />
          <StatusButton
            name="status"
            value="paid"
            disabled={o.status === "paid"}
            className="border-cyan/40 text-cyan hover:bg-cyan/10"
          >
            ● ชำระแล้ว
          </StatusButton>
          <StatusButton
            name="status"
            value="fulfilled"
            disabled={o.status === "fulfilled"}
            className="border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10"
          >
            ✓ ทำเสร็จแล้ว
          </StatusButton>
          <StatusButton
            name="status"
            value="cancelled"
            disabled={o.status === "cancelled"}
            className="border-line/20 text-muted hover:bg-surface/5"
          >
            ✕ ยกเลิก
          </StatusButton>
          <StatusButton
            name="status"
            value="refunded"
            disabled={o.status === "refunded"}
            className="border-red-500/40 text-red-300 hover:bg-red-500/10"
          >
            ↩ คืนเงินแล้ว
          </StatusButton>
        </form>

        <form action={updateOrderStatus} className="space-y-2">
          <input type="hidden" name="id" value={o.id} />
          {/* Keeps the current status — this form only edits the note. */}
          <input type="hidden" name="status" value={o.status} />
          <textarea
            name="admin_note"
            rows={2}
            defaultValue={o.admin_note ?? ""}
            placeholder="โน้ตภายใน เช่น ส่งไฟล์เพิ่มทางไลน์แล้ว"
            className={`${field} resize-none`}
          />
          <button className="btn-ghost text-xs">บันทึกโน้ต</button>
        </form>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={resend}
            disabled={pending}
            className="rounded-lg border border-cyan/40 bg-cyan/10 px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-cyan transition-colors hover:bg-cyan/20 disabled:opacity-50"
          >
            {pending ? "กำลังส่ง…" : "✉ ส่งอีเมลอีกครั้ง"}
          </button>
          <a
            href={`mailto:${o.buyer_email}?subject=${encodeURIComponent(`เกี่ยวกับคำสั่งซื้อ ${o.order_no}`)}`}
            className="font-mono text-xs text-cyan/70 hover:text-cyan"
          >
            ↗ เขียนอีเมลเอง
          </a>
        </div>
        {mail && <p className="font-mono text-[11px] text-muted">{mail}</p>}
      </div>
    </div>
  );
}

function Fact({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <p className="flex gap-2">
      <span className="w-28 shrink-0 uppercase tracking-wider text-muted">{k}</span>
      <span className={`min-w-0 break-all ${mono ? "text-ink/50" : "text-ink"}`}>{v}</span>
    </p>
  );
}

function StatusButton({
  name,
  value,
  disabled,
  className,
  children,
}: {
  name: string;
  value: string;
  disabled?: boolean;
  className: string;
  children: React.ReactNode;
}) {
  return (
    <button
      name={name}
      value={value}
      disabled={disabled}
      className={`rounded-lg border px-3 py-1.5 font-mono text-xs transition-colors disabled:cursor-default disabled:opacity-30 ${className}`}
    >
      {children}
    </button>
  );
}
