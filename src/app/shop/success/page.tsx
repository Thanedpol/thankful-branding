import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getOrderBySessionId } from "@/lib/shop-queries";
import {
  DOWNLOAD_WINDOW_DAYS,
  ORDER_STATUS_LABEL,
  ORDER_STATUS_STYLE,
  canDownload,
  formatPrice,
} from "@/lib/shop";
import type { ShopOrder } from "@/lib/types";

// Never cached: the order flips from pending to paid the moment the webhook
// lands, and the buyer is watching this page while it happens.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ขอบคุณสำหรับการสั่งซื้อ — Thank Thanedpol",
  robots: { index: false, follow: false },
};

export default async function ShopSuccess({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;
  const order = session_id ? await getOrderBySessionId(session_id) : null;

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-32">
        <div className="mx-auto max-w-2xl px-6 pb-24">
          {!order ? (
            <Panel
              title="ไม่พบคำสั่งซื้อ"
              body="ลิงก์นี้อาจหมดอายุหรือไม่ถูกต้อง หากคุณชำระเงินไปแล้ว ระบบจะส่งอีเมลยืนยันให้ภายในไม่กี่นาที"
            />
          ) : (
            <OrderReceipt order={order} />
          )}

          <div className="mt-8 text-center">
            <Link href="/shop" className="btn-ghost">
              กลับไปหน้าร้านค้า
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function OrderReceipt({ order }: { order: ShopOrder }) {
  const pending = order.status === "pending";
  const downloadable = order.product_kind === "digital" && canDownload(order);
  const remaining = Math.max(0, order.download_limit - order.download_count);
  const expires = order.download_expires_at
    ? new Date(order.download_expires_at).toLocaleDateString("th-TH", {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "Asia/Bangkok",
      })
    : null;

  return (
    <>
      {/* The Stripe webhook can land a second or two after the redirect, so a
          pending page retries itself instead of asking the buyer to reload. */}
      {pending && <meta httpEquiv="refresh" content="5" />}

      <div className="glass p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-cyan/40 bg-cyan/10 text-2xl text-cyan">
          {pending ? "…" : "✓"}
        </div>
        <h1 className="font-display text-2xl font-bold">
          {pending ? "กำลังยืนยันการชำระเงิน…" : "ขอบคุณสำหรับการสั่งซื้อ"}
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          {pending
            ? "หน้านี้จะรีเฟรชเองอัตโนมัติ ไม่ต้องปิดหน้าต่างนี้"
            : `เราส่งอีเมลยืนยันไปที่ ${order.buyer_email} เรียบร้อยแล้ว`}
        </p>

        <dl className="mt-8 space-y-3 border-t border-line/10 pt-6 text-left text-sm">
          <Row label="เลขที่คำสั่งซื้อ">
            <span className="font-mono text-ink">{order.order_no}</span>
          </Row>
          <Row label="สินค้า">
            <span className="text-ink">
              {order.product_title}
              {order.quantity > 1 && ` × ${order.quantity}`}
            </span>
          </Row>
          <Row label="ยอดรวม">
            <span className="font-display font-bold text-cyan">
              {formatPrice(order.amount_total, order.currency)}
            </span>
          </Row>
          <Row label="สถานะ">
            <span
              className={`rounded-md border px-2 py-0.5 font-mono text-xs ${ORDER_STATUS_STYLE[order.status]}`}
            >
              {ORDER_STATUS_LABEL[order.status]}
            </span>
          </Row>
        </dl>

        {downloadable && (
          <div className="mt-8 border-t border-line/10 pt-6">
            <a
              href={`/api/shop/download/${order.download_token}`}
              className="btn-neon w-full text-center"
            >
              ดาวน์โหลดไฟล์ →
            </a>
            <p className="mt-3 text-xs text-muted">
              {expires
                ? `ลิงก์ใช้ได้ถึง ${expires} และดาวน์โหลดได้อีก ${remaining} ครั้ง`
                : `ลิงก์ใช้ได้ ${DOWNLOAD_WINDOW_DAYS} วัน และดาวน์โหลดได้อีก ${remaining} ครั้ง`}
            </p>
          </div>
        )}

        {!pending && order.product_kind === "service" && (
          <p className="mt-8 border-t border-line/10 pt-6 text-sm text-muted">
            เราจะติดต่อกลับทางอีเมลเพื่อนัดหมายรายละเอียดของบริการ
          </p>
        )}
      </div>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}

function Panel({ title, body }: { title: string; body: string }) {
  return (
    <div className="glass p-10 text-center">
      <h1 className="font-display text-xl font-bold">{title}</h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">{body}</p>
    </div>
  );
}
