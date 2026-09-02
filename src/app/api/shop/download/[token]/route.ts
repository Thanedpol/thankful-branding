import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/demo-data";
import { canDownload } from "@/lib/shop";
import type { ShopOrder } from "@/lib/types";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  if (!isSupabaseConfigured()) {
    return problem("ระบบดาวน์โหลดยังไม่พร้อมใช้งาน", "กรุณาติดต่อผู้ขายเพื่อขอไฟล์โดยตรงครับ");
  }
  if (!UUID_RE.test(token)) {
    return problem("ลิงก์ไม่ถูกต้อง", "ลิงก์ดาวน์โหลดนี้ไม่ถูกต้อง กรุณาคัดลอกลิงก์จากอีเมลอีกครั้ง");
  }

  const admin = createAdminClient();
  const { data: order } = await admin
    .from("shop_orders")
    .select("*")
    .eq("download_token", token)
    .maybeSingle<ShopOrder>();

  if (!order) {
    return problem("ไม่พบลิงก์นี้", "ลิงก์ดาวน์โหลดนี้ใช้ไม่ได้แล้ว กรุณาติดต่อผู้ขายครับ");
  }
  if (order.status !== "paid" && order.status !== "fulfilled") {
    return problem("ยังไม่พบการชำระเงิน", "คำสั่งซื้อนี้ยังไม่ได้ชำระเงิน หรือถูกยกเลิกไปแล้วครับ");
  }
  if (order.download_count >= order.download_limit) {
    return problem(
      "ดาวน์โหลดครบจำนวนแล้ว",
      `คำสั่งซื้อ ${order.order_no} ดาวน์โหลดครบ ${order.download_limit} ครั้งแล้ว กรุณาติดต่อผู้ขายเพื่อขอสิทธิ์เพิ่มครับ`
    );
  }
  if (!canDownload(order)) {
    return problem(
      "ลิงก์หมดอายุแล้ว",
      `ลิงก์ของคำสั่งซื้อ ${order.order_no} หมดอายุแล้ว กรุณาติดต่อผู้ขายเพื่อขอลิงก์ใหม่ครับ`
    );
  }

  const { data: product } = await admin
    .from("shop_products")
    .select("file_path")
    .eq("id", order.product_id ?? "")
    .maybeSingle<{ file_path: string | null }>();

  if (!product?.file_path) {
    return problem("ยังไม่มีไฟล์สำหรับสินค้านี้", "กรุณาติดต่อผู้ขาย เราจะส่งไฟล์ให้ทางอีเมลครับ");
  }

  const { data: signed, error } = await admin.storage
    .from("shop-files")
    .createSignedUrl(product.file_path, 60, { download: true });

  if (error || !signed) {
    console.error("[shop/download] signing failed", error);
    return problem("ดึงไฟล์ไม่สำเร็จ", "ระบบขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้งในสักครู่ครับ");
  }

  await admin
    .from("shop_orders")
    .update({ download_count: order.download_count + 1 })
    .eq("id", order.id);

  return NextResponse.redirect(signed.signedUrl);
}

/** Buyers reach this route straight from an email link, so every failure has
 *  to look like a page, not like JSON. */
function problem(title: string, detail: string) {
  const html = `<!doctype html>
<html lang="th">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${title}</title>
</head>
<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#050508;color:#fff;font-family:system-ui,sans-serif;padding:24px">
  <div style="max-width:420px;text-align:center">
    <h1 style="color:#00F5FF;font-size:22px;margin:0 0 12px">${title}</h1>
    <p style="color:#8892A4;line-height:1.8;margin:0 0 24px">${detail}</p>
    <a href="/shop" style="display:inline-block;border:1px solid rgba(255,255,255,0.15);color:#fff;text-decoration:none;padding:10px 22px;border-radius:10px">กลับไปหน้าร้าน</a>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    status: 403,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
