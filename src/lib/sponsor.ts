/**
 * Numbers shown on the sponsor / media kit page (/sponsor).
 * Every figure is a dated snapshot — update the value and its `asOf` date
 * together when you refresh them (YouTube Studio export, profile pages).
 */

export interface Stat {
  value: string;
  label: string;
  note: string;
}

/** Follower counts read from each public profile. */
export const AUDIENCE: Stat[] = [
  { value: "1,092", label: "ผู้ติดตาม TikTok", note: "@thankful63 · ณ 21 พ.ย. 2569" },
  { value: "333", label: "ผู้ติดตาม Instagram", note: "@newerathank · ณ 21 พ.ย. 2569" },
  { value: "111", label: "ผู้ติดตาม YouTube", note: "@Thankful2026 · ณ 15 พ.ย. 2569" },
  { value: "332", label: "วิดีโอบน YouTube", note: "ณ 15 พ.ย. 2569" },
];

/** From the YouTube Studio content export, 1 Aug – 15 Nov 2026. */
export const YT_PERIOD = "1 ส.ค. – 15 พ.ย. 2569 (YouTube Studio)";
export const YOUTUBE: Stat[] = [
  { value: "21,139", label: "ยอดวิว", note: "ในนี้มาจาก Shorts 15,831" },
  { value: "147,920", label: "ครั้งที่หน้าปกถูกแสดง", note: "Impressions" },
  { value: "158.6", label: "ชั่วโมงที่คนดู", note: "Watch time" },
  { value: "88%", label: "คนดูต่อสูงสุดของ Shorts", note: "Stayed to watch" },
];

/** Events summarised on the channel — shown on /sponsor as "งาน Event ที่เคยสรุป". */
export const EVENTS_COVERED = [
  "Krungsri Tech Day 2026",
  "Spotlight Day 2026",
  "Marketing Conference 2026",
  "CP Innovation Exposition 2026",
  "Axons UXUI Day 2026",
  "Qwenwork: Out of Office",
];
