/**
 * Thankful's YouTube series, read from YouTube's public RSS feeds — no API key,
 * no quota. A playlist feed lists its 15 newest videos, which is all the home
 * page needs. Results are cached for an hour, so a new upload shows up on the
 * site within that window without a redeploy.
 */

export const YT_CHANNEL_URL = "https://www.youtube.com/@Thankful2026";
export const YT_SUBSCRIBE_URL = `${YT_CHANNEL_URL}?sub_confirmation=1`;

export type SeriesGroup = "news" | "learn" | "event";

export interface Series {
  id: string; // stable key used for links between series
  playlistId: string;
  title: string;
  /** Fits under a node on a phone. */
  short: string;
  /** What the series is, written from the episodes actually in it. */
  blurb: string;
  group: SeriesGroup;
}

/** The order here is the order around the network. */
export const SERIES: Series[] = [
  {
    id: "weekly",
    playlistId: "PLIDFav-EiqP0",
    short: "ฉับไว News",
    title: "AI ฉับไว News",
    blurb: "สรุปข่าว AI ประจำสัปดาห์ รวมหลายข่าวจบในคลิปเดียว",
    group: "news",
  },
  {
    id: "hot",
    playlistId: "PLLwSdcPiCADE",
    short: "ประเด็นเดือด",
    title: "AI News ประเด็นเดือด",
    blurb: "เจาะทีละประเด็นข่าว AI ที่คนพูดถึงมากที่สุด สั้น กระชับ",
    group: "news",
  },
  {
    id: "bestsight",
    playlistId: "PLdBZhHzR9RnI",
    short: "BestSight",
    title: "BestSight News",
    blurb: "มุมมองเชิงลึกจากรายงานและเวทีระดับโลก แปลเป็นภาษาธุรกิจ",
    group: "news",
  },
  {
    id: "robotics",
    playlistId: "PLNssWEF5qSBA",
    short: "Robotics",
    title: "Physical AI & Robotics News",
    blurb: "หุ่นยนต์ รถอัจฉริยะ และ AI ที่ออกมาอยู่ในโลกจริง",
    group: "news",
  },
  {
    id: "hacknow",
    playlistId: "PLKDN7PoSjy0U",
    short: "HackNow",
    title: "AI HackNow",
    blurb: "Deep dive โมเดลและเทคโนโลยีใหม่ ว่าทำงานยังไง ทำไมสำคัญ",
    group: "learn",
  },
  {
    id: "apps",
    playlistId: "PLH2RIe7CBmmw",
    short: "AI Apps",
    title: "AI Apps",
    blurb: "รีวิวแอปและอุปกรณ์ AI ที่ใช้ได้จริงในชีวิตประจำวัน",
    group: "learn",
  },
  {
    id: "rookie",
    playlistId: "PLKMjRto0k_R8",
    short: "Rookie",
    title: "Rookie to Realize",
    blurb: "สอนทำทีละขั้น จากมือใหม่จนทำงานจริงได้ด้วย Claude และ ChatGPT",
    group: "learn",
  },
  {
    id: "event",
    playlistId: "PLUcVgAmk-lDc",
    short: "Event",
    title: "Event to Grasp",
    blurb: "สรุปสาระจากงานสัมมนาและงานแสดงเทคโนโลยี ให้คนที่ไม่ได้ไปก็เข้าใจ",
    group: "event",
  },
];

/**
 * Editorial links: where a viewer of one series naturally goes next. Links
 * found in the data (a video posted to both playlists) are added at runtime.
 */
export const THEME_LINKS: [string, string][] = [
  ["weekly", "hot"],
  ["weekly", "bestsight"],
  ["weekly", "robotics"],
  ["bestsight", "event"],
  ["event", "rookie"],
  ["rookie", "apps"],
  ["apps", "hacknow"],
  ["hacknow", "robotics"],
];

export interface Video {
  id: string;
  title: string;
  published: string; // ISO
  views: number;
}

export interface SeriesFeed extends Series {
  videos: Video[];
}

export interface SharedLink {
  a: string;
  b: string;
  count: number; // videos in both playlists' recent feeds
}

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

export async function getSeriesFeeds(): Promise<{ series: SeriesFeed[]; shared: SharedLink[] }> {
  const series = await Promise.all(
    SERIES.map(async (s) => ({ ...s, videos: await fetchPlaylist(s.playlistId) }))
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
