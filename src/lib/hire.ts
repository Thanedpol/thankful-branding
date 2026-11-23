/**
 * Work shown in the "รับงาน" (available for hire) section on the home page.
 * Add a clip by pasting its TikTok URL here.
 */
export interface HireWork {
  url: string;
  /** Cover image in /public — TikTok's embed shows no poster of its own
   *  until it plays, and its oEmbed no longer returns one. */
  cover?: string;
}

export const HIRE_WORKS: HireWork[] = [
  {
    url: "https://www.tiktok.com/@thankful63/video/7699358788184296724",
    cover: "/hire/tiktok-7699358788184296724.jpg",
  },
];

/** YouTube samples (16:9). Add one with its video id and title. */
export interface HireVideo {
  id: string;
  title: string;
}

export const HIRE_YOUTUBE: HireVideo[] = [
  { id: "JPq_-LxLya0", title: "AI ทำงาน 1 งาน ราคาแค่กาแฟแก้วเดียว & 20+ Use Case จริง สรุปงาน QwenWork: Out of Office" },
  { id: "0kia92uPuVM", title: "คนที่ใช้ AI เป็น จะมาแทนคนที่ใช้ AI ไม่เป็น & วิธีทำงาน UXUI เปลี่ยน | สรุปงาน AXONS UXUI Day 2026" },
  { id: "3PECrxJ6sOQ", title: "ประชากรไทยอาจเหลือครึ่งเดียวใน 50 ปี | สรุป Spotlight Day 2026 เมื่อกติกาโลกถูกเขียนใหม่" },
  { id: "uqzxMQN7OO0", title: "ค่าไฟไทยแพงกว่าเวียดนาม-อินโดนีเซีย? | สรุป Spotlight Day 2026 ไฟสะอาดคือ ใบอนุญาตส่งออก" },
];

/** Services listed above the clips. Each key has title, detail and price
 *  strings in i18n.ts (hire.<key>.title / .detail / .price). */
export const HIRE_SERVICES = ["svc1", "svc2"] as const;

export const HIRE_CONTACT_EMAIL = "thank.2643@gmail.com";

/** The numeric post id at the end of a TikTok video URL. */
export function tiktokVideoId(url: string): string | null {
  return url.match(/\/video\/(\d{8,})/)?.[1] ?? null;
}
