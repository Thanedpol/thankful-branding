import { slugify } from "@/lib/slugify";
import { eventSessions, eventHasContent } from "@/lib/portfolio-sessions";
import type { PortfolioCollection } from "@/lib/types";

type Grp = NonNullable<PortfolioCollection["data"]["groups"]>[number];

/** A row in the `portfolio_events` table (see supabase/add-portfolio-events.sql). */
export interface EventRow {
  collection_slug: string;
  slug: string;
  group_name: string;
  event_order: number;
  title: string;
  url: string | null;
  image: string | null;
  metrics: unknown | null;
  sessions: unknown[];
  has_content: boolean;
}

/** Light group metadata kept inline on the collection (`data.groups_meta`) so
 *  the public listing can render group order + the ★popular flag without loading
 *  any event body. */
export interface GroupMeta {
  name: string;
  popular: boolean;
}

/**
 * Deterministically flatten a collection's groups into per-event rows. Shared by
 * the admin save-sync (savePortfolioCollection) and the one-off migration, so a
 * later save reproduces the exact same slugs the migration first assigned — no
 * orphaned rows, no changed URLs. Slug precedence: the event's own `slug`, else
 * slugify(title), else a positional fallback; duplicates get `-2` appended.
 */
export function buildEventRows(collectionSlug: string, groups: Grp[]): EventRow[] {
  const rows: EventRow[] = [];
  const used = new Set<string>();
  groups.forEach((g, gi) => {
    (g.events ?? []).forEach((e, ei) => {
      let slug = e.slug || slugify(e.title) || `${gi}-${ei}`;
      while (used.has(slug)) slug += "-2";
      used.add(slug);
      const sessions = eventSessions(e).map((s) => {
        // Drop the editor-only marker; never persist it to a row.
        const { _stripped, ...rest } = s as Record<string, unknown>;
        void _stripped;
        return rest;
      });
      rows.push({
        collection_slug: collectionSlug,
        slug,
        group_name: g.name ?? "",
        event_order: ei,
        title: e.title ?? "",
        url: e.url ?? null,
        image: e.image ?? null,
        metrics: e.metrics ?? null,
        sessions,
        has_content: eventHasContent(e),
      });
    });
  });
  return rows;
}

/** Light `data.groups_meta` for a collection's groups (order + popular flag). */
export function buildGroupMeta(groups: Grp[]): GroupMeta[] {
  return groups.map((g) => ({ name: g.name ?? "", popular: !!g.popular }));
}
