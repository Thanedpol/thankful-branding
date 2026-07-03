/**
 * Turn a pasted URL into a safe iframe embed for a known platform. Returns
 * null for unsupported links. Only well-formed platform URLs pass through, and
 * the resulting `src` is always a canonical platform embed endpoint (never the
 * raw pasted string), so no arbitrary markup reaches the page.
 */
export type EmbedProvider =
  | "youtube"
  | "vimeo"
  | "spotify"
  | "tiktok"
  | "twitter";

export interface ParsedEmbed {
  provider: EmbedProvider;
  src: string;
  url: string;
}

export function parseEmbed(raw: string): ParsedEmbed | null {
  const url = (raw || "").trim();
  if (!url) return null;
  let m: RegExpMatchArray | null;

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
  return null;
}
