/**
 * Thankful's YouTube series: the catalogue and its types. Pure data, safe to
 * import from client components — the fetching lives in youtube-feeds.ts,
 * which is server-only.
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
  /** The playlist's own cover as YouTube shows it — a custom image uploaded in
   *  Studio, or the video chosen as the playlist thumbnail. Null when it
   *  couldn't be read; the newest episode's thumbnail stands in. */
  cover: string | null;
}

export interface SharedLink {
  a: string;
  b: string;
  count: number; // videos in both playlists' recent feeds
}
