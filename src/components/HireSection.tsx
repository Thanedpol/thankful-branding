"use client";

import { useEffect, useRef, useState } from "react";
import Reveal from "./Reveal";
import { useT } from "@/components/providers/AppProvider";
import { HIRE_CONTACT_EMAIL, HIRE_WORKS, tiktokVideoId } from "@/lib/hire";

/**
 * "รับงาน" — sample work, shown just before the featured portfolio.
 *
 * Each clip uses TikTok's official embed player (player/v1), which shows the
 * cover with a play button until it plays. Hovering with a mouse starts a
 * muted preview through the player's postMessage API — browsers only allow
 * muted playback without a click — and leaving pauses it again. Pressing the
 * player's own play button plays with sound.
 */

const PLAYER_PARAMS = new URLSearchParams({
  autoplay: "0",
  loop: "1",
  rel: "0",
  music_info: "0",
  description: "0",
  native_context_menu: "0",
  closed_caption: "0",
}).toString();

type PlayerMessage = { "x-tiktok-player"?: boolean; type?: string; value?: unknown };

function parse(data: unknown): PlayerMessage | null {
  if (data && typeof data === "object") return data as PlayerMessage;
  if (typeof data === "string") {
    try {
      return JSON.parse(data) as PlayerMessage;
    } catch {
      return null;
    }
  }
  return null;
}

function TikTokPlayerCard({ url, label }: { url: string; label: string }) {
  const id = tiktokVideoId(url);
  const frame = useRef<HTMLIFrameElement>(null);
  const ready = useRef(false);
  const hovering = useRef(false);
  // A hover preview is muted and ours to stop. Once the viewer unmutes or
  // presses play themselves, leaving the card must not interrupt them.
  const previewing = useRef(false);
  const [failed, setFailed] = useState(false);

  const send = (type: "play" | "pause" | "mute") =>
    frame.current?.contentWindow?.postMessage({ type, value: undefined, "x-tiktok-player": true }, "*");

  const startPreview = () => {
    previewing.current = true;
    send("mute");
    send("play");
  };

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow) return;
      const msg = parse(e.data);
      if (!msg?.["x-tiktok-player"]) return;
      if (msg.type === "onPlayerReady") {
        ready.current = true;
        if (hovering.current) startPreview(); // hovered before the player was up
      } else if (msg.type === "onMute" && msg.value === false) {
        previewing.current = false; // the viewer turned the sound on
      } else if (msg.type === "onPlayerError") {
        setFailed(true);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  if (!id || failed) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex aspect-[9/16] w-full items-center justify-center rounded-2xl bg-[#010101] p-6 text-center text-sm font-semibold text-white"
      >
        {label} ↗
      </a>
    );
  }

  return (
    <div
      className="glass overflow-hidden !rounded-2xl p-1.5"
      onPointerEnter={(e) => {
        if (e.pointerType !== "mouse") return; // touch: use the play button
        hovering.current = true;
        if (ready.current) startPreview();
      }}
      onPointerLeave={(e) => {
        if (e.pointerType !== "mouse") return;
        hovering.current = false;
        if (ready.current && previewing.current) send("pause");
      }}
    >
      <iframe
        ref={frame}
        src={`https://www.tiktok.com/player/v1/${id}?${PLAYER_PARAMS}`}
        title={label}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="block aspect-[9/16] w-full rounded-xl bg-black"
      />
    </div>
  );
}

export default function HireSection() {
  const t = useT();
  if (HIRE_WORKS.length === 0) return null;

  return (
    <section id="hire" className="section-pad scroll-mt-20 !pb-0">
      <Reveal className="space-plate mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{t("hire.eyebrow")}</p>
          <h2 className="font-display text-3xl font-bold md:text-4xl text-gradient">{t("hire.heading")}</h2>
          <p className="mt-3 max-w-xl text-muted">{t("hire.sub")}</p>
        </div>
        <a href={`mailto:${HIRE_CONTACT_EMAIL}`} className="btn-neon shrink-0">
          {t("hire.contact")} →
        </a>
      </Reveal>

      <Reveal className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {HIRE_WORKS.map((w) => (
          <TikTokPlayerCard key={w.url} url={w.url} label={t("hire.watch")} />
        ))}
      </Reveal>
      <p className="mt-3 font-mono text-[11px] text-muted">{t("hire.hint")}</p>
    </section>
  );
}
