"use client";

import { useEffect, useRef, useState } from "react";
import { useT } from "@/components/providers/AppProvider";
import { tiktokVideoId, type HireItem } from "@/lib/hire";

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

export function TikTokPlayerCard({
  url,
  cover,
  label,
  playLabel,
}: {
  url: string;
  cover?: string | null;
  label: string;
  playLabel: string;
}) {
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
  const [hoverShown, setHoverShown] = useState(false);
  // The iframe gets its src only after the message listener below is in
  // place; server-rendered, it could load and announce "ready" before
  // hydration and that message would be lost.
  const [listening, setListening] = useState(false);
  const [failed, setFailed] = useState(false);
  // The cover stays on top until the clip is really playing (a hover preview
  // or the click), so there is never a black box while the player loads.
  const [playing, setPlaying] = useState(false);

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
          setPlaying(state.current === PLAYING);
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
    // TikTok sometimes refuses to serve a clip in its embed player (it
    // answers SERVER_ERROR 2001 and shows "Unable to load player"). Show the
    // cover as a link to the clip on TikTok instead of an empty box.
    if (cover) {
      return (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="glass group relative block overflow-hidden !rounded-2xl p-1.5"
        >
          <span className="relative block aspect-[9/16] overflow-hidden rounded-xl bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cover} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-50 blur-xl" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cover} alt={label} className="relative h-full w-full object-contain" />
            <span className="absolute inset-x-3 bottom-3 rounded-full bg-black/70 px-3 py-2 text-center text-xs font-semibold text-white transition-colors group-hover:bg-black/85">
              {label} ↗
            </span>
          </span>
        </a>
      );
    }
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
      {cover && (
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-1.5 overflow-hidden rounded-xl bg-black transition-opacity duration-300 ${
            engaged || (playing && hoverShown) ? "opacity-0" : "opacity-100"
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cover} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-50 blur-xl" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cover} alt="" loading="lazy" className="relative h-full w-full object-contain" />
          <span className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white">
            ▶
          </span>
        </div>
      )}
      {!engaged && (
        <button
          type="button"
          aria-label={playLabel}
          className="absolute inset-0 z-10 cursor-pointer rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"
          onPointerEnter={(e) => {
            if (e.pointerType !== "mouse") return; // touch: the tap plays it
            hovering.current = true;
            setHoverShown(true);
            if (ready.current && state.current !== PLAYING) {
              send("mute");
              send("play");
            }
          }}
          onPointerLeave={(e) => {
            if (e.pointerType !== "mouse") return;
            hovering.current = false;
            setHoverShown(false);
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

/**
 * A YouTube sample: the thumbnail first. Hovering with a mouse loads a muted,
 * control-free preview over it; leaving removes it again. A click or tap
 * swaps in the normal player with sound (the click lets the browser allow
 * sound in the embedded player).
 */
export function YouTubeCard({ item, playLabel }: { item: HireItem; playLabel: string }) {
  const video = { id: item.videoId, title: item.title ?? "YouTube", caption: item.title };
  const [mode, setMode] = useState<"idle" | "preview" | "play">("idle");
  const [loaded, setLoaded] = useState(false);
  // maxresdefault.jpg does not exist for every video (YouTube answers 404).
  const [thumbBroken, setThumbBroken] = useState(false);
  const hoverTimer = useRef<number | undefined>(undefined);
  const base = `https://www.youtube-nocookie.com/embed/${video.id}`;
  const src =
    mode === "preview"
      ? `${base}?autoplay=1&mute=1&controls=0&playsinline=1&rel=0&loop=1&playlist=${video.id}`
      : `${base}?autoplay=1&playsinline=1&rel=0`;

  return (
    <figure className="glass overflow-hidden !rounded-2xl p-1.5">
      <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={
            thumbBroken
              ? `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`
              : item.cover || `https://i.ytimg.com/vi/${video.id}/maxresdefault.jpg`
          }
          alt={video.title}
          loading="lazy"
          onError={() => setThumbBroken(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
        {mode !== "idle" && (
          <iframe
            key={mode}
            src={src}
            title={video.title}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            onLoad={() => setLoaded(true)}
            className={`absolute inset-0 h-full w-full transition-opacity duration-300 ${
              loaded || mode === "play" ? "opacity-100" : "opacity-0"
            } ${mode === "preview" ? "pointer-events-none" : ""}`}
          />
        )}
        {mode !== "play" && (
          <button
            type="button"
            aria-label={`${playLabel}: ${video.title}`}
            className="group absolute inset-0 z-10 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"
            onPointerEnter={(e) => {
              if (e.pointerType !== "mouse") return; // touch: the tap plays it
              // A short delay so sweeping the mouse across doesn't load players.
              hoverTimer.current = window.setTimeout(() => {
                setLoaded(false);
                setMode("preview");
              }, 250);
            }}
            onPointerLeave={(e) => {
              if (e.pointerType !== "mouse") return;
              window.clearTimeout(hoverTimer.current);
              setMode((m) => (m === "preview" ? "idle" : m));
            }}
            onClick={() => {
              window.clearTimeout(hoverTimer.current);
              setMode("play");
            }}
          >
            <span
              className={`absolute bottom-3 right-3 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white transition-opacity ${
                mode === "preview" ? "opacity-0" : "opacity-100"
              }`}
            >
              ▶
            </span>
          </button>
        )}
      </div>
      {video.caption && (
        <figcaption className="line-clamp-2 px-2 pb-1.5 pt-3 text-sm leading-snug text-ink/90">{video.caption}</figcaption>
      )}
    </figure>
  );
}

/** Responsive grid of YouTube samples (16:9 cards). */
export function YouTubeGrid({ items, className = "" }: { items: HireItem[]; className?: string }) {
  const t = useT();
  if (items.length === 0) return null;
  return (
    <div className={`grid gap-4 sm:grid-cols-2 ${className}`}>
      {items.map((v) => (
        <YouTubeCard key={v.id} item={v} playLabel={t("hire.play")} />
      ))}
    </div>
  );
}

/** Responsive grid of TikTok samples (9:16 cards). */
export function TikTokGrid({ items, className = "" }: { items: HireItem[]; className?: string }) {
  const t = useT();
  if (items.length === 0) return null;
  return (
    <div className={`grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 ${className}`}>
      {items.map((w) => (
        <TikTokPlayerCard key={w.id} url={w.url} cover={w.cover} label={t("hire.watch")} playLabel={t("hire.play")} />
      ))}
    </div>
  );
}
