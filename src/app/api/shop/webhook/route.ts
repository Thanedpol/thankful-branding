import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe, isStripeConfigured, siteOrigin, stripeWebhookSecret } from "@/lib/stripe";
import { DOWNLOAD_WINDOW_DAYS, newOrderNo } from "@/lib/shop";
import { sendPurchaseEmail } from "@/lib/shop-email";
import type { ShopOrder, ShopProduct } from "@/lib/types";

// Signature verification needs the untouched raw body, which the Edge runtime
// does not guarantee.
export const runtime = "nodejs";

type Admin = ReturnType<typeof createAdminClient>;

export async function POST(request: Request) {
  const secret = stripeWebhookSecret();
  if (!secret || !isStripeConfigured()) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 401 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 401 });
  }

  const raw = await request.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(raw, signature, secret);
  } catch (e) {
    console.error("[shop/webhook] signature verification failed", e);
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const admin = createAdminClient();

  try {
    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      await handleCheckout(admin, event.data.object);
    } else if (event.type === "invoice.paid") {
      await handleRenewal(admin, event.data.object);
    }
  } catch (e) {
    console.error(`[shop/webhook] handling ${event.type} failed`, e);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleCheckout(admin: Admin, session: Stripe.Checkout.Session) {
  // Delayed methods (PromptPay, bank transfer) complete the session before the
  // money lands; those orders stay pending until async_payment_succeeded.
  if (session.payment_status === "unpaid") return;

  const orderId = session.metadata?.order_id ?? session.client_reference_id ?? null;

  // Every DB error below is rethrown so the route answers 500 and Stripe
  // retries. Swallowing one would 200 a payment we never recorded.
  const lookup = await admin
    .from("shop_orders")
    .select("*")
    .eq("stripe_session_id", session.id)
    .maybeSingle<ShopOrder>();
  if (lookup.error) throw lookup.error;
  let order = lookup.data;

  // The session id is written just after the session is created, so a very
  // fast webhook can beat that update — fall back to the id we put in metadata.
  if (!order && orderId) {
    const fallback = await admin
      .from("shop_orders")
      .select("*")
      .eq("id", orderId)
      .maybeSingle<ShopOrder>();
    if (fallback.error) throw fallback.error;
    order = fallback.data;
  }

  if (!order) {
    console.error("[shop/webhook] no order for session", session.id);
    return;
  }
  if (order.status !== "pending") return; // already handled — Stripe retried

  const isDigital = order.product_kind === "digital";
  const token = isDigital ? crypto.randomUUID() : null;
  const expires = isDigital
    ? new Date(Date.now() + DOWNLOAD_WINDOW_DAYS * 86_400_000).toISOString()
    : null;

  // Filtering on 'pending' is what makes this idempotent: a concurrent retry
  // updates zero rows and therefore never mints a second download token.
  const { data: updated, error: payError } = await admin
    .from("shop_orders")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      stripe_session_id: session.id,
      stripe_payment_intent: idOf(session.payment_intent),
      stripe_subscription_id: idOf(session.subscription),
      download_token: token,
      download_expires_at: expires,
      updated_at: new Date().toISOString(),
    })
    .eq("id", order.id)
    .eq("status", "pending")
    .select("*")
    .maybeSingle<ShopOrder>();

  if (payError) throw payError;
  if (!updated) return;

  const product = await bumpProductCounters(admin, updated.product_id, updated.quantity);
  await notify(updated, product);
}

/** Subscription renewals arrive as their own invoice — record them as fresh
 *  orders so revenue keeps adding up after the first cycle. */
async function handleRenewal(admin: Admin, invoice: Stripe.Invoice) {
  if (invoice.billing_reason !== "subscription_cycle") return; // first cycle = checkout.session.completed

  const subscriptionId = subscriptionIdOf(invoice);
  if (!subscriptionId) return;

  const { data: existing, error: existingError } = await admin
    .from("shop_orders")
    .select("id")
    .eq("stripe_payment_intent", invoice.id)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing) return; // Stripe retried

  const { data: original, error: originalError } = await admin
    .from("shop_orders")
    .select("*")
    .eq("stripe_subscription_id", subscriptionId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<ShopOrder>();
  if (originalError) throw originalError;
  if (!original) return;

  const { data: renewal, error: renewalError } = await admin
    .from("shop_orders")
    .insert({
      order_no: newOrderNo(),
      product_id: original.product_id,
      product_title: original.product_title,
      product_kind: original.product_kind,
      unit_price: original.unit_price,
      quantity: original.quantity,
      amount_total: invoice.amount_paid || original.amount_total,
      currency: original.currency,
      buyer_name: original.buyer_name,
      buyer_email: original.buyer_email,
      buyer_phone: original.buyer_phone,
      note: original.note,
      status: "paid",
      stripe_subscription_id: subscriptionId,
      stripe_payment_intent: invoice.id,
      paid_at: new Date().toISOString(),
    })
    .select("*")
    .maybeSingle<ShopOrder>();

  if (renewalError) throw renewalError;
  if (renewal) await notify(renewal, await loadProduct(admin, renewal.product_id));
}

/** Stripe moved the subscription pointer under `parent` in API 2025-03-31. A
 *  webhook endpoint still pinned to an older version sends the flat field, and
 *  reading only the new one would drop every renewal without a trace. */
function subscriptionIdOf(invoice: Stripe.Invoice): string | null {
  const legacy = (invoice as unknown as LegacyInvoice).subscription;
  return idOf(invoice.parent?.subscription_details?.subscription ?? legacy ?? null);
}

interface LegacyInvoice {
  subscription?: string | { id: string } | null;
}

async function bumpProductCounters(admin: Admin, productId: string | null, quantity: number) {
  const product = await loadProduct(admin, productId);
  if (!product) return null;

  await admin
    .from("shop_products")
    .update({
      sold_count: product.sold_count + quantity,
      ...(product.stock !== null ? { stock: Math.max(0, product.stock - quantity) } : {}),
    })
    .eq("id", product.id);

  return product;
}

async function loadProduct(admin: Admin, productId: string | null) {
  if (!productId) return null;
  const { data } = await admin
    .from("shop_products")
    .select("*")
    .eq("id", productId)
    .maybeSingle<ShopProduct>();
  return data;
}

/** Best-effort: a bounced receipt must never make Stripe retry the event. */
async function notify(order: ShopOrder, product: ShopProduct | null) {
  try {
    await sendPurchaseEmail({
      order,
      product,
      downloadUrl: order.download_token
        ? `${siteOrigin()}/api/shop/download/${order.download_token}`
        : null,
    });
  } catch (e) {
    console.error("[shop/webhook] purchase email failed", e);
  }
}

function idOf(value: string | { id: string } | null | undefined): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}
