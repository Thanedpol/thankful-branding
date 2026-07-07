"use client";

import { useEffect } from "react";

/**
 * Fires a single "count this view" beacon per browser session per post.
 * The sessionStorage guard stops a refresh (or a second tab) in the same
 * session from double-counting; the API route adds its own 30-minute
 * server-side dedup as a second line of defence. Renders nothing.
 */
export default function BlogViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    if (!slug) return;
    const key = `bv:${slug}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // Private mode / storage disabled — still record, just without the guard.
    }

    // Only the linking page's host is useful for referrer analytics.
    let referrer = "";
    try {
      referrer = document.referrer ? new URL(document.referrer).host : "";
    } catch {
      referrer = "";
    }
    // Ignore self-referrals (navigating between our own pages).
    if (referrer && referrer === window.location.host) referrer = "";

    const body = JSON.stringify({ slug, referrer });
    // Prefer sendBeacon so the request survives an immediate navigation away.
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/blog-view", new Blob([body], { type: "application/json" }));
        return;
      }
    } catch {
      // fall through to fetch
    }
    fetch("/api/blog-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  }, [slug]);

  return null;
}
