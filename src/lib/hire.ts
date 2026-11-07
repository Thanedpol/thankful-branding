/**
 * Work shown in the "รับงาน" (available for hire) section on the home page.
 * Add a clip by pasting its TikTok URL here.
 */
export interface HireWork {
  url: string;
}

export const HIRE_WORKS: HireWork[] = [
  { url: "https://www.tiktok.com/@thankful63/video/7699358788184296724" },
];

export const HIRE_CONTACT_EMAIL = "thank.2643@gmail.com";

/** The numeric post id at the end of a TikTok video URL. */
export function tiktokVideoId(url: string): string | null {
  return url.match(/\/video\/(\d{8,})/)?.[1] ?? null;
}
