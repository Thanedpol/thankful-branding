import { Resend } from "resend";
import { formatPrice, billingSuffix, DOWNLOAD_WINDOW_DAYS } from "@/lib/shop";
import type { ShopOrder, ShopProduct } from "@/lib/types";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

interface PurchaseEmail {
  order: ShopOrder;
  product: Pick<ShopProduct, "delivery_note" | "billing"> | null;
  /** Absolute /api/shop/download/[token] link — digital orders only. */
  downloadUrl?: string | null;
}

/**
 * Receipt for the buyer, plus a heads-up for the shop owner.
 * No-ops (logs a warning) if RESEND_API_KEY is unset so local dev still works.
 */
export async function sendPurchaseEmail({ order, product, downloadUrl }: PurchaseEmail) {
  const from = process.env.CONTACT_FROM_EMAIL ?? "onboarding@resend.dev";
  const owner = process.env.CONTACT_NOTIFY_EMAIL;

  if (!resend) {
    console.warn("[shop-email] RESEND_API_KEY not set — skipping purchase email.");
    return;
  }

  const total = formatPrice(order.amount_total, order.currency);
  const suffix = product ? billingSuffix(product.billing) : "";
  const isDigital = order.product_kind === "digital";

  const delivery = isDigital && downloadUrl
    ? `
      <p style="margin:0 0 16px;line-height:1.7">ไฟล์ของคุณพร้อมดาวน์โหลดแล้วครับ</p>
      <p style="margin:0 0 16px">
        <a href="${escapeHtml(downloadUrl)}"
           style="display:inline-block;background:#00F5FF;color:#050508;font-weight:600;text-decoration:none;padding:12px 24px;border-radius:10px">
          ดาวน์โหลดไฟล์
        </a>
      </p>
      <p style="margin:0;color:#8892A4;font-size:13px;line-height:1.7">
        ลิงก์นี้ใช้ได้ ${DOWNLOAD_WINDOW_DAYS} วัน และดาวน์โหลดได้สูงสุด ${order.download_limit} ครั้ง
        หากลิงก์หมดอายุ ตอบกลับอีเมลฉบับนี้ได้เลยครับ
      </p>`
    : `
      <p style="margin:0 0 8px;line-height:1.7">
        ทีมงานจะติดต่อกลับหาคุณทางอีเมลนี้เพื่อเริ่มงานต่อไปครับ
      </p>
      ${product?.delivery_note
        ? `<p style="margin:0;color:#8892A4;font-size:13px;line-height:1.7">${escapeHtml(product.delivery_note)}</p>`
        : ""}`;

  await resend.emails.send({
    from,
    to: order.buyer_email,
    replyTo: owner || undefined,
    subject: `ยืนยันการสั่งซื้อ ${order.order_no} — ${order.product_title}`,
    html: shell(`
      <h2 style="color:#00F5FF;margin:0 0 16px">ขอบคุณสำหรับการสั่งซื้อ</h2>
      <p style="margin:0 0 20px;line-height:1.7">
        สวัสดีครับ${order.buyer_name ? " คุณ" + escapeHtml(order.buyer_name) : ""}
        เราได้รับการชำระเงินของคุณเรียบร้อยแล้ว
      </p>
      ${row("เลขที่คำสั่งซื้อ", escapeHtml(order.order_no))}
      ${row("สินค้า", `${escapeHtml(order.product_title)} × ${order.quantity}`)}
      ${row("ยอดรวม", `${escapeHtml(total)}${escapeHtml(suffix)}`)}
      <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:20px 0" />
      ${delivery}
    `),
  });

  if (!owner) {
    console.warn("[shop-email] CONTACT_NOTIFY_EMAIL not set — skipping owner notification.");
    return;
  }

  await resend.emails.send({
    from,
    to: owner,
    replyTo: order.buyer_email,
    subject: `💰 ขายได้ ${total} — ${order.product_title} (${order.order_no})`,
    html: shell(`
      <h2 style="color:#00F5FF;margin:0 0 16px">มีคำสั่งซื้อใหม่</h2>
      ${row("เลขที่คำสั่งซื้อ", escapeHtml(order.order_no))}
      ${row("สินค้า", `${escapeHtml(order.product_title)} × ${order.quantity}`)}
      ${row("ยอดรวม", escapeHtml(total))}
      ${row("ผู้ซื้อ", `${escapeHtml(order.buyer_name || "-")} &lt;${escapeHtml(order.buyer_email)}&gt;`)}
      ${row("โทร", escapeHtml(order.buyer_phone || "-"))}
      ${order.note
        ? `<hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:16px 0" />
           <p style="white-space:pre-wrap;line-height:1.6">${escapeHtml(order.note)}</p>`
        : ""}
    `),
  });
}

function shell(inner: string) {
  return `
    <div style="font-family:system-ui,sans-serif;background:#050508;color:#fff;padding:24px;border-radius:12px">
      ${inner}
    </div>
  `;
}

function row(label: string, value: string) {
  return `<p style="margin:0 0 6px"><strong style="color:#8892A4">${label}:</strong> ${value}</p>`;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
