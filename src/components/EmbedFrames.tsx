"use client";

import { useEffect } from "react";

/**
 * Auto-sizes X/Twitter and TikTok embed iframes, which post their content
 * height to the parent via postMessage. YouTube/Vimeo/Spotify are sized by CSS
 * and need nothing here. Mounted on published blog posts.
 */
export default function EmbedFrames() {
  useEffect(() => {
    const allowed = ["https://platform.twitter.com", "https://www.tiktok.com"];
    const onMessage = (e: MessageEvent) => {
      if (!allowed.includes(e.origin)) return;

      let data: unknown = e.data;
      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch {
          return;
        }
      }
      if (!data || typeof data !== "object") return;
      const d = data as Record<string, unknown>;

      let height: number | null = null;
      if (typeof d.height === "number") {
        height = d.height;
      } else if (Array.isArray(d["twttr.embed"])) {
        for (const msg of d["twttr.embed"] as Array<Record<string, unknown>>) {
          const params = msg?.params as Array<Record<string, unknown>> | undefined;
          const h = params?.[0]?.height;
          if (msg?.method === "twttr.private.resize" && typeof h === "number") {
            height = h;
          }
        }
      }
      if (!height || height < 100) return;

      document
        .querySelectorAll<HTMLIFrameElement>(".blog-embed iframe")
        .forEach((frame) => {
          if (frame.contentWindow === e.source) {
            frame.style.height = `${height}px`;
          }
        });
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return null;
}
