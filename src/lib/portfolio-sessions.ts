import type { PortfolioCollection } from "@/lib/types";

/** One event (งาน) inside a collection group. */
export type EventItem = NonNullable<
  PortfolioCollection["data"]["groups"]
>[number]["events"][number];

/** One sub-session (sub-blog) inside an event. */
export type EventSession = NonNullable<EventItem["sessions"]>[number];

/** True if HTML has visible content — either text, or embedded media (an
 *  image-only body, e.g. certificates, still counts). */
export function hasContent(html?: string): boolean {
  if (!html) return false;
  if (html.replace(/<[^>]*>/g, "").trim().length > 0) return true;
  return /<(img|figure|iframe|video)\b/i.test(html);
}

// An <img alt> made entirely of emoji (glyphs + component chars + whitespace).
const EMOJI_ALT = /^[\p{Extended_Pictographic}\p{Emoji_Component}\s]+$/u;
// ...that contains at least one real emoji: a pictograph, a flag (regional
// indicator), or a keycap. (A bare digit like "5" alone must NOT qualify.)
const HAS_EMOJI = /[\p{Extended_Pictographic}\p{Regional_Indicator}\u20E3]/u;

/**
 * Replace emoji-only <img> tags with their emoji text. Emoji copied from
 * Facebook (👍, and especially flags like 🇹🇭 built from regional indicators)
 * arrive as tiny images that the prose CSS blows up to full width. Swapping them
 * for the alt's emoji character makes them render inline at text size. Real
 * images (descriptive alt) are left alone.
 */
export function inlineEmojiImages(html?: string): string {
  if (!html) return "";
  return html.replace(/<img\b[^>]*>/gi, (tag) => {
    const alt = /\balt="([^"]*)"/i.exec(tag)?.[1];
    if (alt && HAS_EMOJI.test(alt) && EMOJI_ALT.test(alt)) return alt;
    return tag;
  });
}

/**
 * An event's sub-sessions for display: its `sessions` if present, else the
 * legacy single `body` treated as one session, else an empty list.
 */
export function eventSessions(e: EventItem): EventSession[] {
  if (e.sessions?.length) return e.sessions;
  if (hasContent(e.body)) return [{ body: e.body }];
  return [];
}

/** True if the event has any detail content worth its own page. */
export function eventHasContent(e: EventItem): boolean {
  return eventSessions(e).some(
    (s) => hasContent(s.body) || !!s.image || !!(s.title && s.title.trim())
  );
}

/** Compact number for metric chips: 1250 → "1.2K", 2_400_000 → "2.4M". */
export function fmtNum(n?: number): string | null {
  if (typeof n !== "number" || !Number.isFinite(n)) return null;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}
