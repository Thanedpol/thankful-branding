/**
 * Sample work for the "รับงาน" (available for hire) section and the /work page.
 *
 * The list is edited in Admin → Hire and stored in the `hire_works` table
 * (supabase/add-hire-works.sql). DEFAULT_HIRE_ITEMS below is what the site
 * shows until that table exists.
 */
export type HireKind = "youtube" | "tiktok";

export interface HireItem {
  id: string;
  kind: HireKind;
  /** Canonical link to the clip. */
  url: string;
  /** YouTube video id, or TikTok post id. */
  videoId: string;
  title: string | null;
  /** Cover image (a URL or a path in /public). YouTube derives its own from
   *  the video id; TikTok's embed shows nothing until it plays and its oEmbed
   *  no longer returns a poster, so TikTok clips need one uploaded. */
  cover: string | null;
}

export const DEFAULT_HIRE_ITEMS: HireItem[] = [
  {
    id: "default-yt-JPq_-LxLya0",
    kind: "youtube",
    url: "https://www.youtube.com/watch?v=JPq_-LxLya0",
    videoId: "JPq_-LxLya0",
    title: "AI ทำงาน 1 งาน ราคาแค่กาแฟแก้วเดียว & 20+ Use Case จริง สรุปงาน QwenWork: Out of Office",
    cover: null,
  },
  {
    id: "default-yt-0kia92uPuVM",
    kind: "youtube",
    url: "https://www.youtube.com/watch?v=0kia92uPuVM",
    videoId: "0kia92uPuVM",
    title: "คนที่ใช้ AI เป็น จะมาแทนคนที่ใช้ AI ไม่เป็น & วิธีทำงาน UXUI เปลี่ยน | สรุปงาน AXONS UXUI Day 2026",
    cover: null,
  },
  {
    id: "default-yt-3PECrxJ6sOQ",
    kind: "youtube",
    url: "https://www.youtube.com/watch?v=3PECrxJ6sOQ",
    videoId: "3PECrxJ6sOQ",
    title: "ประชากรไทยอาจเหลือครึ่งเดียวใน 50 ปี | สรุป Spotlight Day 2026 เมื่อกติกาโลกถูกเขียนใหม่",
    cover: null,
  },
  {
    id: "default-yt-uqzxMQN7OO0",
    kind: "youtube",
    url: "https://www.youtube.com/watch?v=uqzxMQN7OO0",
    videoId: "uqzxMQN7OO0",
    title: "ค่าไฟไทยแพงกว่าเวียดนาม-อินโดนีเซีย? | สรุป Spotlight Day 2026 ไฟสะอาดคือ ใบอนุญาตส่งออก",
    cover: null,
  },
  {
    id: "default-tt-7699358788184296724",
    kind: "tiktok",
    url: "https://www.tiktok.com/@thankful63/video/7699358788184296724",
    videoId: "7699358788184296724",
    title: "นวัตกรรมแรกของชีพี ไม่ใช่เครื่องจักร | พิธีเปิด CP Innovation Exposition 2026",
    cover: "/hire/tiktok-7699358788184296724.jpg",
  },
  {
    id: "default-tt-7710913831660178694",
    kind: "tiktok",
    url: "https://www.tiktok.com/@thankful63/video/7710913831660178694",
    videoId: "7710913831660178694",
    title: "สรุปงาน Adobe MAX 2026 Ep.1",
    cover: "/hire/tiktok-7710913831660178694.jpg",
  },
  {
    id: "default-tt-7710920396559682868",
    kind: "tiktok",
    url: "https://www.tiktok.com/@thankful63/video/7710920396559682868",
    videoId: "7710920396559682868",
    title: "สรุปงาน Adobe MAX 2026 Ep.2",
    cover: "/hire/tiktok-7710920396559682868.jpg",
  },
  {
    id: "default-tt-7708331767484157190",
    kind: "tiktok",
    url: "https://www.tiktok.com/@thankful63/video/7708331767484157190",
    videoId: "7708331767484157190",
    title: "หุ้น IBM พุ่ง 5% เพราะ Quantum จริงไหม | สรุปงาน SCBX Quantum Outlook 2026 Ep.1",
    cover: "/hire/tiktok-7708331767484157190.jpg",
  },
  {
    id: "default-tt-7708360303121255732",
    kind: "tiktok",
    url: "https://www.tiktok.com/@thankful63/video/7708360303121255732",
    videoId: "7708360303121255732",
    title: "ข้อมูลหลุดวันนี้ ถอดรหัสได้วันหน้า ธนาคารรับมือ Quantum ยังไง | SCBX Quantum Outlook 2026 EP.2",
    cover: "/hire/tiktok-7708360303121255732.jpg",
  },
  {
    id: "default-tt-7692010001908452629",
    kind: "tiktok",
    url: "https://www.tiktok.com/@thankful63/video/7692010001908452629",
    videoId: "7692010001908452629",
    title: "อีก 2 ปี แบรนด์กว่า 60% จะปล่อย AI ออกไปคุยกับลูกค้าเอง | สรุปงาน MKT CON 2026",
    cover: "/hire/tiktok-7692010001908452629.jpg",
  },
];

/**
 * Services listed above the clips. Each key has title, detail and price
 * strings in i18n.ts (hire.<key>.title / .detail / .price).
 */
export const HIRE_SERVICES = ["svc1", "svc2"] as const;

export const HIRE_CONTACT_EMAIL = "thank.2643@gmail.com";

/** The numeric post id at the end of a TikTok video URL. */
export function tiktokVideoId(url: string): string | null {
  return url.match(/\/video\/(\d{8,})/)?.[1] ?? null;
}

/**
 * Read a pasted clip link. Accepts YouTube (watch, youtu.be, shorts, embed,
 * live) and full TikTok video links; returns the platform, the clip id and a
 * clean canonical URL — or null when it isn't a link to one clip. Short TikTok
 * links (vm.tiktok.com) hide the post id behind a redirect, so they are not
 * accepted.
 */
export function parseHireUrl(input: string): { kind: HireKind; videoId: string; url: string } | null {
  const raw = input.trim();
  if (!raw) return null;
  let u: URL;
  try {
    u = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return null;
  }
  const host = u.hostname.toLowerCase().replace(/^(www|m|music)\./, "");

  if (host === "youtu.be" || host === "youtube.com" || host === "youtube-nocookie.com") {
    const ytId =
      host === "youtu.be"
        ? u.pathname.split("/")[1]
        : u.searchParams.get("v") ?? u.pathname.match(/^\/(?:shorts|embed|live|v)\/([^/?#]+)/)?.[1];
    if (!ytId || !/^[\w-]{11}$/.test(ytId)) return null;
    return { kind: "youtube", videoId: ytId, url: `https://www.youtube.com/watch?v=${ytId}` };
  }

  if (host === "tiktok.com") {
    const m = u.pathname.match(/^\/(@[^/]+)\/video\/(\d{8,})/);
    if (!m) return null;
    return { kind: "tiktok", videoId: m[2], url: `https://www.tiktok.com/${m[1]}/video/${m[2]}` };
  }
  return null;
}
