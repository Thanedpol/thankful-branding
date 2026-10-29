import { unstable_cache } from "next/cache";
import { SERIES, type SeriesFeed, type SharedLink, type Video } from "@/lib/youtube";

/**
 * Server-side reads of the YouTube series. Episodes come from the public RSS
 * feeds (no API key, no quota; a playlist feed lists its 15 newest videos),
 * cached for an hour. Covers come from the playlist pages. Kept out of
 * youtube.ts so client components importing the catalogue never pull
 * next/cache into the browser bundle.
 */

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
const decode = (s: string) =>
  s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&(amp|lt|gt|quot|apos);/g, (_, e) => ENTITIES[e]);

function parseFeed(xml: string): Video[] {
  return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(([, e]) => ({
    id: e.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1] ?? "",
    title: decode(e.match(/<title>([^<]*)<\/title>/)?.[1] ?? ""),
    published: e.match(/<published>([^<]+)<\/published>/)?.[1] ?? "",
    views: Number(e.match(/<media:statistics views="(\d+)"/)?.[1] ?? 0),
  })).filter((v) => v.id);
}

async function fetchPlaylist(playlistId: string): Promise<Video[]> {
  try {
    const res = await fetch(`https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistId}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    return parseFeed(await res.text());
  } catch {
    // A feed hiccup must never take the home page down; the series still
    // renders and links to its playlist.
    return [];
  }
}

const OG_IMAGE = /<meta property="og:image" content="([^"]+)"/;

/**
 * The playlist cover, read from the og:image of the public playlist page.
 * Neither the RSS feed nor oEmbed reports a cover uploaded in YouTube Studio —
 * both answer with the first video's thumbnail — so the page is the only
 * source that matches what YouTube itself displays.
 *
 * Reading stops once the tag has arrived. YouTube places it late — about 80%
 * into a page of 1–2 MB, after </head> — so this saves the tail, not most of
 * the page; the cap only guards against an unexpectedly huge response.
 *
 * Never cached here: a long playlist's page passes the 2 MB fetch-cache limit.
 * Callers cache the tiny result instead (see getCachedCover).
 */
export async function fetchPlaylistCover(playlistId: string): Promise<string | null> {
  try {
    const res = await fetch(`https://www.youtube.com/playlist?list=${playlistId}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ThankfulSite/1.0; +https://thankful-branding.vercel.app)",
        "Accept-Language": "th,en;q=0.8",
      },
      cache: "no-store",
    });
    if (!res.ok || !res.body) return null;

    let html = "";
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      html += decoder.decode(value, { stream: true });
      if (OG_IMAGE.test(html) || html.length > 3_000_000) break;
    }
    reader.cancel().catch(() => {});
    const url = html.match(OG_IMAGE)?.[1];
    // Keep YouTube's signed query string intact — it identifies the version
    // of the image, so a replaced cover arrives under a new URL.
    return url ? decode(url) : null;
  } catch {
    return null;
  }
}

/** The cover URL — a few hundred bytes — cached for the page render. */
const getCachedCover = unstable_cache(fetchPlaylistCover, ["yt-playlist-cover"], { revalidate: 300 });

export async function getSeriesFeeds(): Promise<{ series: SeriesFeed[]; shared: SharedLink[] }> {
  const series = await Promise.all(
    SERIES.map(async (s) => {
      const [videos, cover] = await Promise.all([fetchPlaylist(s.playlistId), getCachedCover(s.playlistId)]);
      return { ...s, videos, cover };
    })
  );

  const shared: SharedLink[] = [];
  for (let i = 0; i < series.length; i++) {
    const ids = new Set(series[i].videos.map((v) => v.id));
    for (let j = i + 1; j < series.length; j++) {
      const count = series[j].videos.filter((v) => ids.has(v.id)).length;
      if (count) shared.push({ a: series[i].id, b: series[j].id, count });
    }
  }
  return { series, shared };
}
