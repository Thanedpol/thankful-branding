"use client";

import { useEffect, useRef, useState } from "react";
import Reveal from "./Reveal";
import { useT } from "@/components/providers/AppProvider";
import { HIRE_CONTACT_EMAIL, HIRE_WORKS, tiktokVideoId } from "@/lib/hire";

/**
 * "รับงาน" — sample work, shown just before the featured portfolio.
 *
 * Each clip uses TikTok's official embed player (player/v1). Until it has
 * been clicked once that player is only a poster and ignores the postMessage
 * API, so it is loaded with muted autoplay — browsers allow that without a
 * click — and paused as soon as it starts, leaving the cover frame on screen
 * with a live player behind it.
 *
 * Pointer events over a cross-origin iframe go to the iframe, not this page,
 * so a transparent layer sits over the player until the first click:
 *   - hovering it plays a muted preview; leaving pauses it again;
 *   - clicking it (or tapping) plays with sound and removes the layer, so
 *     TikTok's own controls take over from then on.
 */

const PLAYER_PARAMS = new URLSearchParams({
  autoplay: "1",
  muted: "1",
  loop: "1",
  rel: "0",
  music_info: "0",
  description: "0",
  native_context_menu: "0",
  closed_caption: "0",
}).toString();

type PlayerMessage = { "x-tiktok-player"?: boolean; type?: string; value?: unknown };
type Command = "play" | "pause" | "mute" | "unMute";

const PLAYING = 1;

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

function TikTokPlayerCard({ url, label, playLabel }: { url: string; label: string; playLabel: string }) {
  const id = tiktokVideoId(url);
  const frame = useRef<HTMLIFrameElement>(null);
  const ready = useRef(false);
  const hovering = useRef(false);
  const state = useRef(-1);
  // The muted autoplay only wakes the player; it is stopped the first time it
  // actually starts. ("ready" can arrive before playback begins, and a pause
  // sent then is lost, so the first real start is the reliable moment.)
  const settled = useRef(false);
  // Clicked before the player was up: play with sound once it is.
  const wantsSound = useRef(false);
  const [engaged, setEngaged] = useState(false);
  // The iframe gets its src only after the message listener below is in
  // place; server-rendered, it could load and announce "ready" before
  // hydration and that message would be lost.
  const [listening, setListening] = useState(false);
  const [failed, setFailed] = useState(false);

  const send = (type: Command) =>
    frame.current?.contentWindow?.postMessage({ type, value: undefined, "x-tiktok-player": true }, "*");

  const playWithSound = () => {
    send("unMute");
    send("play");
  };

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow) return;
      const msg = parse(e.data);
      if (!msg?.["x-tiktok-player"]) return;
      const firstWord = !ready.current;
      ready.current = true; // any message means the player is up
      if (firstWord && wantsSound.current) playWithSound();
      switch (msg.type) {
        case "onPlayerReady":
          if (!hovering.current && !wantsSound.current) send("pause");
          break;
        case "onStateChange":
          state.current = Number(msg.value);
          if (state.current === PLAYING && !settled.current) {
            settled.current = true;
            if (!hovering.current && !wantsSound.current) send("pause");
          }
          break;
        case "onPlayerError": {
          // Playback/autoplay hiccups (3xxx) leave a usable player; anything
          // else means the clip can't be shown here.
          const code = Number((msg.value as { errorCode?: number } | undefined)?.errorCode);
          if (!(code >= 3000)) setFailed(true);
          break;
        }
      }
    };
    window.addEventListener("message", onMessage);
    setListening(true);
    return () => window.removeEventListener("message", onMessage);
    // send/playWithSound only read the frame ref
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
    <div className="glass relative overflow-hidden !rounded-2xl p-1.5">
      <iframe
        ref={frame}
        src={listening ? `https://www.tiktok.com/player/v1/${id}?${PLAYER_PARAMS}` : undefined}
        title={label}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="block aspect-[9/16] w-full rounded-xl bg-black"
      />
      {!engaged && (
        <button
          type="button"
          aria-label={playLabel}
          className="absolute inset-0 z-10 cursor-pointer rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"
          onPointerEnter={(e) => {
            if (e.pointerType !== "mouse") return; // touch: the tap plays it
            hovering.current = true;
            if (ready.current && state.current !== PLAYING) {
              send("mute");
              send("play");
            }
          }}
          onPointerLeave={(e) => {
            if (e.pointerType !== "mouse") return;
            hovering.current = false;
            if (ready.current) send("pause");
          }}
          onClick={() => {
            settled.current = true;
            setEngaged(true);
            if (ready.current) playWithSound();
            else wantsSound.current = true;
          }}
        />
      )}
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
          <TikTokPlayerCard key={w.url} url={w.url} label={t("hire.watch")} playLabel={t("hire.play")} />
        ))}
      </Reveal>
      <p className="mt-3 font-mono text-[11px] text-muted">{t("hire.hint")}</p>
    </section>
  );
}
