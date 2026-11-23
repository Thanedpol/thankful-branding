"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Reveal from "./Reveal";
import { useT } from "@/components/providers/AppProvider";
import { HIRE_CONTACT_EMAIL, HIRE_SERVICES, HIRE_WORKS, HIRE_YOUTUBE, tiktokVideoId, type HireVideo } from "@/lib/hire";

// A bare mailto: does nothing without a mail app, so open a Gmail draft;
// the full set of options (copy, mail app) is on /sponsor#contact.
const HIRE_GMAIL_URL = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(HIRE_CONTACT_EMAIL)}&su=${encodeURIComponent("ติดต่อรับงาน Thankful")}`;

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

function TikTokPlayerCard({
  url,
  cover,
  label,
  playLabel,
}: {
  url: string;
  cover?: string;
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
function YouTubeCard({ video, playLabel }: { video: HireVideo; playLabel: string }) {
  const [mode, setMode] = useState<"idle" | "preview" | "play">("idle");
  const [loaded, setLoaded] = useState(false);
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
          src={`https://i.ytimg.com/vi/${video.id}/maxresdefault.jpg`}
          alt={video.title}
          loading="lazy"
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
      <figcaption className="line-clamp-2 px-2 pb-1.5 pt-3 text-sm leading-snug text-ink/90">{video.title}</figcaption>
    </figure>
  );
}

export default function HireSection() {
  const t = useT();
  if (HIRE_WORKS.length === 0 && HIRE_YOUTUBE.length === 0) return null;

  return (
    <section id="hire" className="section-pad scroll-mt-20 !pb-0">
      <Reveal className="space-plate mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{t("hire.eyebrow")}</p>
          <h2 className="font-display text-3xl font-bold md:text-4xl text-gradient">{t("hire.heading")}</h2>
          <p className="mt-3 max-w-xl text-muted">{t("hire.sub")}</p>
        </div>
        <a href={HIRE_GMAIL_URL} target="_blank" rel="noopener noreferrer" className="btn-neon shrink-0">
          {t("hire.contact")} →
        </a>
      </Reveal>

      <Reveal className="mb-10">
        <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">{t("hire.services")}</h3>
        <ol className="mt-4 grid gap-4 md:grid-cols-2">
          {HIRE_SERVICES.map((key, i) => (
            <li key={key} className="glass flex flex-col gap-3 rounded-2xl p-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-4">
                <span className="font-mono text-sm text-cyan">0{i + 1}</span>
                <div>
                  <p className="font-display text-lg font-bold leading-snug">{t(`hire.${key}.title`)}</p>
                  <p className="mt-1 text-sm text-muted">{t(`hire.${key}.detail`)}</p>
                </div>
              </div>
              <p className="shrink-0 pl-8 sm:pl-0 sm:text-right">
                <span className="block font-mono text-[11px] text-muted">{t("hire.from")}</span>
                <span className="font-display text-xl font-bold text-cyan">{t(`hire.${key}.price`)}</span>
              </p>
            </li>
          ))}
        </ol>
      </Reveal>

      {HIRE_YOUTUBE.length > 0 && (
        <Reveal className="mb-4 grid gap-4 sm:grid-cols-2">
          {HIRE_YOUTUBE.map((v) => (
            <YouTubeCard key={v.id} video={v} playLabel={t("hire.play")} />
          ))}
        </Reveal>
      )}
      <Reveal className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {HIRE_WORKS.map((w) => (
          <TikTokPlayerCard key={w.url} url={w.url} cover={w.cover} label={t("hire.watch")} playLabel={t("hire.play")} />
        ))}
      </Reveal>
      <p className="mt-3 font-mono text-[11px] text-muted">{t("hire.hint")}</p>
      <Link href="/sponsor" className="mt-6 inline-flex font-mono text-xs text-cyan hover:underline">
        {t("hire.mediakit")} →
      </Link>
    </section>
  );
}
