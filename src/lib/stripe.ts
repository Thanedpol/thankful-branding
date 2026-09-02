import Stripe from "stripe";

/**
 * Lazily-built Stripe client. The key is read at call time, not at import
 * time, so the app still builds and every non-shop page still renders on a
 * deploy that has no Stripe key yet — the storefront just shows products
 * without a working Buy button instead of crashing the whole route.
 */
let cached: Stripe | null = null;

export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  if (!cached) cached = new Stripe(key);
  return cached;
}

/** Set once the webhook endpoint exists — without it we refuse unsigned events. */
export function stripeWebhookSecret(): string | null {
  return process.env.STRIPE_WEBHOOK_SECRET ?? null;
}

/** Absolute base for Stripe's success/cancel redirects. Stripe rejects
 *  relative URLs, so this must be a full origin in production. */
export function siteOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ?? "http://localhost:3000"
  );
}
