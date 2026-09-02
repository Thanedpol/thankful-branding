import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/demo-data";
import { getStripe, isStripeConfigured, siteOrigin } from "@/lib/stripe";
import { isSoldOut, newOrderNo } from "@/lib/shop";
import type { ShopProduct } from "@/lib/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function fail(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured() || !isStripeConfigured()) {
    return fail("ระบบชำระเงินยังไม่พร้อมใช้งาน กรุณาติดต่อผู้ขายโดยตรง", 503);
  }

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return fail("ข้อมูลไม่ถูกต้อง", 400);
  }

  const slug = String(payload.slug ?? "").trim();
  if (!slug) return fail("ไม่พบสินค้าที่ต้องการสั่งซื้อ", 400);

  const buyer = (payload.buyer ?? {}) as Record<string, unknown>;
  const buyerEmail = String(buyer.email ?? "").trim().toLowerCase();
  const buyerName = String(buyer.name ?? "").trim();
  const buyerPhone = String(buyer.phone ?? "").trim();
  const note = String(buyer.note ?? "").trim();

  if (!EMAIL_RE.test(buyerEmail)) {
    return fail("กรุณากรอกอีเมลให้ถูกต้อง เราจะส่งใบเสร็จและไฟล์ไปที่อีเมลนี้", 400);
  }

  const admin = createAdminClient();
  const { data: product, error: loadError } = await admin
    .from("shop_products")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle<ShopProduct>();

  if (loadError) {
    console.error("[shop/checkout] product lookup failed", loadError);
    return fail("ระบบขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้ง", 500);
  }
  if (!product) return fail("ไม่พบสินค้าชิ้นนี้ หรือสินค้าถูกปิดการขายแล้ว", 404);
  if (product.external_url) return fail("สินค้าชิ้นนี้จำหน่ายผ่านช่องทางอื่น", 400);
  if (isSoldOut(product)) return fail("สินค้าหมดแล้ว", 409);
  if (product.price <= 0) return fail("สินค้าชิ้นนี้ยังไม่ได้ตั้งราคา", 400);

  const isSubscription = product.billing !== "one_time";
  let quantity = Math.floor(Number(payload.quantity ?? 1));
  if (!Number.isFinite(quantity) || quantity < 1) quantity = 1;
  quantity = Math.min(quantity, 99);
  if (product.stock !== null) quantity = Math.min(quantity, product.stock);
  if (isSubscription) quantity = 1;

  const amountTotal = product.price * quantity;

  // The order row goes in BEFORE Stripe so a webhook can never arrive for a
  // row that does not exist yet.
  const { data: order, error: insertError } = await admin
    .from("shop_orders")
    .insert({
      order_no: newOrderNo(),
      product_id: product.id,
      product_title: product.title,
      product_kind: product.kind,
      unit_price: product.price,
      quantity,
      amount_total: amountTotal,
      currency: product.currency,
      buyer_name: buyerName || null,
      buyer_email: buyerEmail,
      buyer_phone: buyerPhone || null,
      note: note || null,
      status: "pending",
    })
    .select("id, order_no")
    .single();

  if (insertError || !order) {
    console.error("[shop/checkout] order insert failed", insertError);
    return fail("บันทึกคำสั่งซื้อไม่สำเร็จ กรุณาลองใหม่อีกครั้ง", 500);
  }

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: isSubscription ? "subscription" : "payment",
      customer_email: buyerEmail,
      client_reference_id: order.id,
      metadata: {
        order_id: order.id,
        order_no: order.order_no,
        product_id: product.id,
      },
      line_items: [
        {
          quantity,
          price_data: {
            currency: product.currency.toLowerCase(),
            unit_amount: product.price,
            ...(isSubscription
              ? { recurring: { interval: product.billing as "month" | "year" } }
              : {}),
            product_data: {
              name: product.title,
              ...(product.tagline ? { description: product.tagline } : {}),
              ...(product.cover_image_url ? { images: [product.cover_image_url] } : {}),
            },
          },
        },
      ],
      success_url: `${siteOrigin()}/shop/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteOrigin()}/shop/${product.slug}?canceled=1`,
    });

    if (!session.url) throw new Error("Stripe returned a session without a URL");

    await admin
      .from("shop_orders")
      .update({ stripe_session_id: session.id })
      .eq("id", order.id);

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("[shop/checkout] stripe session failed", e);
    // Nothing was charged, so the abandoned pending row would only pollute the
    // admin list.
    await admin.from("shop_orders").delete().eq("id", order.id).eq("status", "pending");
    return fail("เชื่อมต่อระบบชำระเงินไม่สำเร็จ กรุณาลองใหม่อีกครั้ง", 502);
  }
}
