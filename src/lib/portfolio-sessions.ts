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
