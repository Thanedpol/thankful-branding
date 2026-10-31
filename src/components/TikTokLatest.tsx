"use client";

import { useEffect, useRef, useState } from "react";
import { useApp } from "@/components/providers/AppProvider";
import { SOCIAL_PROFILES } from "@/lib/social";

/**
 * The newest TikTok clips, through TikTok's official creator-profile embed.
 *
 * TikTok publishes no public feed, and the profile page refuses server-side
 * requests (a bot wall), so the site can't list the clips itself. The creator
 * embed — the same snippet TikTok's oEmbed hands out — is rendered by TikTok
 * in the visitor's browser and always shows the latest posts.
 *
 * TikTok's script and iframe load only once this row scrolls near the screen,
 * so they cost nothing to visitors who never get this far.
 *
 * TikTok sometimes refuses to serve the embed (its "overload-protect" wall
 * answers 503). The embedded page talks to its parent with postMessage once it
 * is up; if nothing arrives in time the row swaps to a plain link card rather
 * than leaving an empty frame.
 */

const TIKTOK = SOCIAL_PROFILES.find((p) => p.platform === "tiktok");
const EMBED_SRC = "https://www.tiktok.com/embed.js";
const GIVE_UP_MS = 12_000;

export default function TikTokLatest() {
  const { t } = useApp();
  const ref = useRef<HTMLDivElement>(null);
  const slot = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [status, setStatus] = useState<"waiting" | "ready" | "failed">("waiting");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "400px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!near || !slot.current || !TIKTOK) return;
    const handle = TIKTOK.url.split("@")[1]?.replace(/\/$/, "") ?? "";
    const loading = t("latest.tiktokLoading");
    // embed.js turns this blockquote into TikTok's iframe when it runs.
    slot.current.innerHTML = `<blockquote class="tiktok-embed" cite="https://www.tiktok.com/@${handle}" data-unique-id="${handle}" data-embed-type="creator" style="max-width:780px;min-width:288px;margin:0 auto;"><section style="padding:2rem 0;text-align:center;font:12px monospace;opacity:.7"><a target="_blank" rel="noopener noreferrer" href="https://www.tiktok.com/@${handle}?refer=creator_embed">${loading} @${handle}</a></section></blockquote>`;
    // The script only scans the page when it executes, so load a fresh copy
    // each time the row mounts (client-side navigation back to the home page).
    document.querySelectorAll(`script[src="${EMBED_SRC}"]`).forEach((s) => s.remove());
    const script = document.createElement("script");
    script.src = EMBED_SRC;
    script.async = true;
    script.onerror = () => setStatus("failed");
    document.body.appendChild(script);

    let ready = false;
    const onMessage = (e: MessageEvent) => {
      // origin is "null" for sandboxed frames — URL() would throw on it
      const host = e.origin.startsWith("http") ? new URL(e.origin).hostname : "";
      if (/(^|\.)tiktok\.com$/.test(host)) {
        ready = true;
        setStatus("ready");
      }
    };
    window.addEventListener("message", onMessage);
    const timer = window.setTimeout(() => {
      if (!ready) setStatus("failed");
    }, GIVE_UP_MS);
    return () => {
      window.removeEventListener("message", onMessage);
      window.clearTimeout(timer);
    };
  }, [near, t]);

  if (!TIKTOK) return null;

  return (
    <div ref={ref} className="space-plate mt-3 !p-4 sm:!p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#010101] text-white shadow-[-2px_0_0_#25f4ee,2px_0_0_#fe2c55]">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
              <path d="M16.6 3c.4 2 1.6 3.3 3.6 3.5v3.2c-1.3.1-2.5-.3-3.6-1v6.1c0 3.4-2.7 6.2-6.2 6.2S4.2 18.2 4.2 14.8s2.8-6.1 6.3-6.1c.3 0 .6 0 .9.1v3.3a3 3 0 0 0-.9-.1 2.9 2.9 0 1 0 2.9 2.9V3h3.2z" />
            </svg>
          </span>
          <div>
            <h3 className="font-display text-lg font-bold text-ink">{t("latest.tiktok")}</h3>
            <p className="font-mono text-[11px] text-muted">{TIKTOK.handle}</p>
          </div>
        </div>
        <a
          href={TIKTOK.url}
          target="_blank"
          rel="noopener noreferrer me"
          className="rounded-full bg-[#fe2c55] px-4 py-2 text-xs font-semibold text-white transition-transform hover:scale-[1.03]"
        >
          {t("latest.tiktokFollow")} ↗
        </a>
      </div>

      {/* No React children here: embed.js replaces this node's contents. */}
      <div ref={slot} className="min-h-[120px] overflow-hidden rounded-xl" hidden={status === "failed"} />

      {status === "failed" && (
        <a
          href={TIKTOK.url}
          target="_blank"
          rel="noopener noreferrer me"
          className="group flex items-center justify-between gap-4 rounded-xl bg-[#010101] p-5 text-white transition-transform hover:scale-[1.01]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 12% 20%, rgba(37,244,238,0.35), transparent 45%), radial-gradient(circle at 88% 85%, rgba(254,44,85,0.4), transparent 50%)",
          }}
        >
          <span>
            <span className="block font-display text-base font-bold">{t("latest.tiktokFallback")}</span>
            <span className="font-mono text-xs text-white/75">tiktok.com/{TIKTOK.handle}</span>
          </span>
          <span className="shrink-0 rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#010101] transition-transform group-hover:translate-x-0.5">
            {t("latest.tiktokOpen")} ↗
          </span>
        </a>
      )}
    </div>
  );
}
