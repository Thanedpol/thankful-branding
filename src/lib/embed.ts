/**
 * Turn a pasted URL into a safe embed for the blog body. Known platforms get a
 * canonical embed endpoint (never the raw pasted string as an iframe src, so no
 * arbitrary markup slips through). Direct video files render as a <video>. As a
 * last resort any other http(s) URL becomes a best-effort generic iframe —
 * acceptable because only the authenticated admin can add embeds (many sites
 * block framing via X-Frame-Options, in which case that generic frame stays
 * blank). Returns null only for empty / non-URL input.
 */
export type EmbedProvider =
  | "youtube"
  | "vimeo"
  | "spotify"
  | "tiktok"
  | "twitter"
  | "facebook"
  | "facebook-post"
  | "instagram"
  | "loom"
  | "gdrive"
  | "dailymotion"
  | "streamable"
  | "canva"
  | "soundcloud"
  | "video"
  | "generic";

export interface ParsedEmbed {
  provider: EmbedProvider;
  src: string;
  url: string;
}

export function parseEmbed(raw: string): ParsedEmbed | null {
  const url = (raw || "").trim();
  if (!url) return null;
  let m: RegExpMatchArray | null;

  // ── Video platforms (canonical embed endpoints) ──────────────────────────
  if (
    (m = url.match(
      /(?:youtube\.com\/(?:watch\?(?:[^ ]*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
    ))
  ) {
    return { provider: "youtube", src: `https://www.youtube-nocookie.com/embed/${m[1]}`, url };
  }
  if ((m = url.match(/vimeo\.com\/(?:video\/|channels\/[\w]+\/|groups\/[\w]+\/videos\/)?(\d+)/))) {
    return { provider: "vimeo", src: `https://player.vimeo.com/video/${m[1]}`, url };
  }
  if ((m = url.match(/loom\.com\/(?:share|embed)\/([A-Za-z0-9]+)/))) {
    return { provider: "loom", src: `https://www.loom.com/embed/${m[1]}`, url };
  }
  if ((m = url.match(/drive\.google\.com\/file\/d\/([A-Za-z0-9_-]+)/))) {
    return { provider: "gdrive", src: `https://drive.google.com/file/d/${m[1]}/preview`, url };
  }
  if ((m = url.match(/(?:dailymotion\.com\/(?:video|embed\/video)\/|dai\.ly\/)([A-Za-z0-9]+)/))) {
    return { provider: "dailymotion", src: `https://geo.dailymotion.com/player.html?video=${m[1]}`, url };
  }
  if ((m = url.match(/streamable\.com\/(?:e\/)?([A-Za-z0-9]+)/))) {
    return { provider: "streamable", src: `https://streamable.com/e/${m[1]}`, url };
  }

  // ── Audio ────────────────────────────────────────────────────────────────
  if (
    (m = url.match(
      /open\.spotify\.com\/(?:intl-[a-z]+\/)?(track|album|playlist|episode|show|artist)\/([A-Za-z0-9]+)/
    ))
  ) {
    return { provider: "spotify", src: `https://open.spotify.com/embed/${m[1]}/${m[2]}`, url };
  }
  if ((m = url.match(/^spotify:(track|album|playlist|episode|show|artist):([A-Za-z0-9]+)/))) {
    return { provider: "spotify", src: `https://open.spotify.com/embed/${m[1]}/${m[2]}`, url };
  }
  if (/soundcloud\.com\//.test(url)) {
    return {
      provider: "soundcloud",
      src: `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%2300f5ff&auto_play=false&hide_related=true&visual=false`,
      url,
    };
  }

  // ── Social ─────────────────────────────────────────────────────────────────
  if ((m = url.match(/tiktok\.com\/(?:@[\w.-]+\/video\/|embed\/v2\/|embed\/|v\/)(\d+)/))) {
    return { provider: "tiktok", src: `https://www.tiktok.com/embed/v2/${m[1]}`, url };
  }
  if ((m = url.match(/(?:twitter\.com|x\.com)\/[\w]+\/status(?:es)?\/(\d+)/))) {
    return {
      provider: "twitter",
      src: `https://platform.twitter.com/embed/Tweet.html?id=${m[1]}&theme=dark&dnt=true`,
      url,
    };
  }
  if ((m = url.match(/instagram\.com\/(?:[\w.-]+\/)?(p|reel|reels|tv)\/([A-Za-z0-9_-]+)/))) {
    const kind = m[1] === "reels" ? "reel" : m[1];
    return { provider: "instagram", src: `https://www.instagram.com/${kind}/${m[2]}/embed`, url };
  }
  if (/(?:facebook\.com|fb\.watch|fb\.me)\//.test(url)) {
    const isVideo =
      /\/videos?\//.test(url) ||
      /\/reel\//.test(url) ||
      /\/watch\/?\?/.test(url) ||
      /[?&]v=\d+/.test(url) ||
      /fb\.watch\//.test(url);
    const enc = encodeURIComponent(url);
    return isVideo
      ? {
          provider: "facebook",
          src: `https://www.facebook.com/plugins/video.php?href=${enc}&show_text=false`,
          url,
        }
      : {
          provider: "facebook-post",
          src: `https://www.facebook.com/plugins/post.php?href=${enc}&show_text=true`,
          url,
        };
  }

  // ── Design / decks ─────────────────────────────────────────────────────────
  if ((m = url.match(/canva\.com\/design\/([A-Za-z0-9_-]+)(?:\/([A-Za-z0-9_-]+))?/))) {
    const token = m[2] ? `${m[2]}/` : "";
    return { provider: "canva", src: `https://www.canva.com/design/${m[1]}/${token}view?embed`, url };
  }

  // ── Direct video file → native <video> ─────────────────────────────────────
  if (/^https?:\/\/[^\s]+\.(mp4|webm|ogg|ogv|mov|m4v)(\?[^\s]*)?$/i.test(url)) {
    return { provider: "video", src: url, url };
  }

  // ── Generic best-effort iframe (admin-trusted, http(s) only) ───────────────
  try {
    const u = new URL(url);
    if (u.protocol === "http:" || u.protocol === "https:") {
      return { provider: "generic", src: url, url };
    }
  } catch {
    /* not a parseable URL */
  }

  return null;
}
