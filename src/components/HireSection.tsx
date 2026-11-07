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
 * click — and paused the moment it reports ready, leaving the cover frame on
 * screen with a live player behind it. Then:
 *   - mouse hover plays a muted preview; leaving pauses it again;
 *   - clicking the clip turns the sound on and plays.
 * A click inside a cross-origin iframe can't be observed directly, but it
 * moves focus into the frame, which blurs this window — that is the signal.
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

function TikTokPlayerCard({ url, label }: { url: string; label: string }) {
  const id = tiktokVideoId(url);
  const frame = useRef<HTMLIFrameElement>(null);
  const ready = useRef(false);
  const hovering = useRef(false);
  const state = useRef(-1);
  const muted = useRef(true);
  const [failed, setFailed] = useState(false);

  const send = (type: Command) =>
    frame.current?.contentWindow?.postMessage({ type, value: undefined, "x-tiktok-player": true }, "*");

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow) return;
      const msg = parse(e.data);
      if (!msg?.["x-tiktok-player"]) return;
      switch (msg.type) {
        case "onPlayerReady":
          ready.current = true;
          if (!hovering.current) send("pause"); // stop the autoplay on the cover
          break;
        case "onStateChange":
          state.current = Number(msg.value);
          break;
        case "onMute":
          muted.current = msg.value === true;
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

    // Focus moved into the player: the visitor clicked it. Play with sound —
    // unless it is already doing that, in which case their click was a pause.
    const onBlur = () => {
      if (!ready.current || document.activeElement !== frame.current) return;
      if (state.current === PLAYING && !muted.current) return;
      send("unMute");
      send("play");
    };

    window.addEventListener("message", onMessage);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("message", onMessage);
      window.removeEventListener("blur", onBlur);
    };
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
        if (e.pointerType !== "mouse") return; // touch: tap the clip instead
        hovering.current = true;
        if (ready.current && state.current !== PLAYING) {
          send("mute");
          send("play");
        }
      }}
      onPointerLeave={(e) => {
        if (e.pointerType !== "mouse") return;
        hovering.current = false;
        // Only a muted preview is ours to stop; never cut off a clip someone
        // is listening to.
        if (ready.current && muted.current) send("pause");
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
