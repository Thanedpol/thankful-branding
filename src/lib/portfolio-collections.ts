import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/demo-data";
import { snobbyStory } from "@/lib/snobby-story";
import { insightist } from "@/lib/insightist";
import { eventHasContent, type EventItem } from "@/lib/portfolio-sessions";
import type { EventRow } from "@/lib/portfolio-events";
import type { PortfolioCollection } from "@/lib/types";

/** The two editable collection pages, in slug order. */
export const COLLECTION_SLUGS = ["snobby-story", "insightist"] as const;

/** Built-in defaults — shown until a Supabase row exists (or if it's blank). */
const DEFAULTS: Record<string, PortfolioCollection> = {
  "snobby-story": {
    slug: "snobby-story",
    title: snobbyStory.title,
    tagline: snobbyStory.tagline,
    intro: snobbyStory.intro,
    category: snobbyStory.category,
    tags: snobbyStory.tags,
    data: { stories: snobbyStory.stories },
  },
  insightist: {
    slug: "insightist",
    title: insightist.title,
    tagline: insightist.tagline,
    intro: insightist.intro,
    category: insightist.category,
    tags: insightist.tags,
    data: { groups: insightist.groups },
  },
};

export function collectionDefault(slug: string): PortfolioCollection | null {
  return DEFAULTS[slug] ?? null;
}

/**
 * Drop session/event body HTML from collections that have more than
 * `maxSessions` sessions, so the admin editor's serialized props stay well
 * under Vercel's ~4.5 MB response limit (a large imported collection is ~1.8 MB
 * of body HTML). Each stripped body is flagged with `_stripped` so the editor
 * keeps the (now empty-looking) session in its payload and savePortfolioCollection
 * can restore the stored body. Non-destructive; small collections are returned
 * untouched so their content stays editable inline.
 */
export function stripSessionBodies(
  cols: PortfolioCollection[],
  maxSessions = 40
): PortfolioCollection[] {
  return cols.map((c) => {
    const count = (c.data.groups ?? []).reduce(
      (n, g) => n + g.events.reduce((m, e) => m + (e.sessions?.length ?? 0), 0),
      0
    );
    if (count <= maxSessions) return c;
    return {
      ...c,
      data: {
        ...c.data,
        groups: c.data.groups?.map((g) => ({
          ...g,
          events: g.events.map((e) => ({
            ...e,
            ...(e.body ? { body: "", _stripped: true } : {}),
            sessions: e.sessions?.map((s) =>
              s.body ? { ...s, body: "", _stripped: true } : s
            ),
          })),
        })),
      },
    };
  });
}

/** All collections for the admin: the built-in ones (merged with their stored
 *  row) followed by any extra collections created in the admin. */
export function mergeAdminCollections(
  rows: Partial<PortfolioCollection>[]
): PortfolioCollection[] {
  const bySlug = new Map<string, Partial<PortfolioCollection>>();
  for (const r of rows) if (r.slug) bySlug.set(r.slug, r);

  const out: PortfolioCollection[] = [];
  for (const slug of COLLECTION_SLUGS) {
    const m = mergeCollection(slug, bySlug.get(slug) ?? null);
    if (m) out.push(m);
    bySlug.delete(slug);
  }
  for (const [slug, r] of bySlug) {
    const m = mergeCollection(slug, r);
    if (m) out.push(m);
  }
  return out;
}

/** Merge a stored row over its default so blank fields fall back gracefully. */
export function mergeCollection(
  slug: string,
  row: Partial<PortfolioCollection> | null
): PortfolioCollection | null {
  const fallback = collectionDefault(slug);
  if (!row) return fallback;
  return {
    slug,
    title: row.title || fallback?.title || slug,
    tagline: row.tagline ?? fallback?.tagline ?? null,
    intro: row.intro ?? fallback?.intro ?? null,
    category: row.category ?? fallback?.category ?? null,
    tags: row.tags?.length ? row.tags : fallback?.tags ?? [],
    // Carried so the admin editor can detect a stale save (see actions.ts).
    updated_at: row.updated_at ?? null,
    data:
      row.data && Object.keys(row.data).length ? row.data : fallback?.data ?? {},
  };
}

// ─── Read path (scalable) ─────────────────────────────────────────────────────
// The public listing/event/sitemap reads assemble a collection from a LIGHT
// projection of portfolio_collections (header + `data->groups_meta`, never the
// multi-MB `data.groups` blob) plus the per-event `portfolio_events` rows. This
// keeps every read tiny regardless of how many events the collection holds. A
// stories collection (Snobby) is small, so it's served straight from the light
// projection's `data->stories`. `fetchCollectionFull` is a safety net for a
// pre-migration / never-populated row.

const HEADER_COLS = "slug,title,tagline,intro,category,tags";
const LIGHT_COLS = `${HEADER_COLS},groups_meta:data->groups_meta,stories:data->stories`;

type LightRow = {
  slug: string;
  title: string | null;
  tagline: string | null;
  intro: string | null;
  category: string | null;
  tags: string[] | null;
  groups_meta: { name: string; popular?: boolean; hidden?: boolean }[] | null;
  stories: PortfolioCollection["data"]["stories"] | null;
};

type EventLightRow = {
  slug: string;
  group_name: string;
  event_order: number;
  title: string;
  url: string | null;
  image: string | null;
  metrics: EventItem["metrics"] | null;
  has_content: boolean;
  hidden?: boolean;
};

type EventPage = { c: Omit<PortfolioCollection, "data">; e: EventItem };

const EVENT_LIGHT_COLS =
  "slug,group_name,event_order,title,url,image,metrics,has_content";

/**
 * Light event rows for a collection, visible ones only.
 *
 * `hidden` arrived after the table did, so a database that hasn't run
 * add-visibility-and-portfolio-url.sql yet would fail the whole query on an
 * unknown column — and take every portfolio page down with it. Ask for the
 * column, and if it isn't there, read without it and treat everything as
 * visible.
 */
async function fetchVisibleEventRows(
  supabase: ReturnType<typeof createPublicClient>,
  slug: string,
  extraCols = ""
): Promise<{ rows: EventLightRow[] | null; error: { message: string } | null }> {
  const cols = EVENT_LIGHT_COLS + extraCols;
  const run = (withHidden: boolean) =>
    supabase
      .from("portfolio_events")
      .select(withHidden ? `${cols},hidden` : cols)
      .eq("collection_slug", slug)
      .order("event_order", { ascending: true });

  let res = await run(true);
  if (res.error && /hidden/i.test(res.error.message)) res = await run(false);
  if (res.error) return { rows: null, error: res.error };
  const rows = (res.data as unknown as EventLightRow[]) ?? [];
  return { rows: rows.filter((r) => !r.hidden), error: null };
}

/** Collection header (no `data`) from a projected row, defaults filling blanks. */
function headerCollection(
  slug: string,
  r: Partial<Pick<LightRow, "title" | "tagline" | "intro" | "category" | "tags">>
): Omit<PortfolioCollection, "data"> {
  const fb = collectionDefault(slug);
  return {
    slug,
    title: r.title || fb?.title || slug,
    tagline: r.tagline ?? fb?.tagline ?? null,
    intro: r.intro ?? fb?.intro ?? null,
    category: r.category ?? fb?.category ?? null,
    tags: r.tags?.length ? r.tags : fb?.tags ?? [],
  };
}

/** Grouped-events structure (light — no bodies) from group metadata + rows. */
function groupsFromRows(
  meta: { name: string; popular?: boolean; hidden?: boolean }[],
  rows: EventLightRow[]
): NonNullable<PortfolioCollection["data"]["groups"]> {
  // A switched-off group leaves no heading behind. Its events are already
  // absent (their rows carry the group's hidden flag), so this only stops an
  // empty title rendering.
  meta = meta.filter((m) => !m.hidden);
  const byGroup = new Map<string, EventItem[]>();
  for (const row of rows) {
    const item: EventItem = {
      title: row.title,
      url: row.url ?? "",
      ...(row.image ? { image: row.image } : {}),
      slug: row.slug,
      ...(row.metrics ? { metrics: row.metrics } : {}),
      hasContent: row.has_content,
    };
    if (!byGroup.has(row.group_name)) byGroup.set(row.group_name, []);
    byGroup.get(row.group_name)!.push(item);
  }
  const groups = meta.map((m) => ({
    name: m.name,
    ...(m.popular ? { popular: true } : {}),
    events: byGroup.get(m.name) ?? [],
  }));
  // Surface any events whose group somehow isn't in the metadata.
  for (const [name, events] of byGroup) {
    if (!meta.some((m) => m.name === name)) groups.push({ name, events });
  }
  return groups;
}

/** Full-row fallback (reads the whole blob) for a row that has neither
 *  `groups_meta` nor `stories` yet — i.e. never migrated/populated. */
async function fetchCollectionFull(
  slug: string,
  strict: boolean
): Promise<PortfolioCollection | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("portfolio_collections")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) {
    if (strict) throw new Error(`fetchCollectionFull(${slug}): ${error.message}`);
    return collectionDefault(slug);
  }
  return mergeCollection(slug, data as Partial<PortfolioCollection> | null);
}

async function loadCollection(
  slug: string,
  strict: boolean
): Promise<PortfolioCollection | null> {
  if (!isSupabaseConfigured()) return collectionDefault(slug);
  const supabase = createPublicClient();

  const { data: rowRaw, error } = await supabase
    .from("portfolio_collections")
    .select(LIGHT_COLS)
    .eq("slug", slug)
    .maybeSingle();
  if (error) {
    if (strict) throw new Error(`fetchCollection(${slug}): ${error.message}`);
    return collectionDefault(slug);
  }
  const row = rowRaw as LightRow | null;
  if (!row) return collectionDefault(slug);

  // Grouped collection (Insightist) — assemble from per-event rows.
  if (row.groups_meta) {
    const { rows: evRows, error: evErr } = await fetchVisibleEventRows(supabase, slug);
    if (evErr) {
      if (strict) throw new Error(`fetchCollection(${slug}) events: ${evErr.message}`);
      return collectionDefault(slug);
    }
    const groups = groupsFromRows(row.groups_meta, evRows ?? []);
    return { ...headerCollection(slug, row), data: { groups } };
  }

  // Stories collection (Snobby) — small; served from the light projection.
  if (row.stories) {
    return { ...headerCollection(slug, row), data: { stories: row.stories } };
  }

  // Neither shape present — never migrated/populated: fall back to the full row.
  return fetchCollectionFull(slug, strict);
}

/**
 * Public (anon) read of a collection listing — tolerant: falls back to the
 * built-in default on any error.
 */
export async function fetchCollection(
  slug: string
): Promise<PortfolioCollection | null> {
  try {
    return await loadCollection(slug, false);
  } catch {
    return collectionDefault(slug);
  }
}

/**
 * Like fetchCollection but THROWS on a query error instead of returning the tiny
 * seed. A thrown error → retryable (uncached) 500 rather than a seed whose
 * missing slugs would make an event lookup 404 — a 404 Vercel then caches
 * per-edge and serves to everyone until revalidation.
 */
export async function fetchCollectionStrict(
  slug: string
): Promise<PortfolioCollection | null> {
  return loadCollection(slug, true);
}

/**
 * A single event's detail (with its full session bodies) read from one
 * `portfolio_events` row — the only heavy read, and it's just one event.
 * Returns null when the event doesn't exist or has no content page. Throws on a
 * query error (→ retryable 500, never a cached 404). Falls back to scanning the
 * inline blob only for a pre-migration event that has no row yet.
 */
export async function fetchCollectionEvent(
  collectionSlug: string,
  eventSlug: string
): Promise<EventPage | null> {
  if (!isSupabaseConfigured()) return eventFromDefault(collectionSlug, eventSlug);
  const supabase = createPublicClient();

  const { data: ev, error } = await supabase
    .from("portfolio_events")
    .select("*")
    .eq("collection_slug", collectionSlug)
    .eq("slug", eventSlug)
    .maybeSingle();
  if (error)
    throw new Error(
      `fetchCollectionEvent(${collectionSlug}/${eventSlug}): ${error.message}`
    );
  if (!ev) return fetchEventFromFull(collectionSlug, eventSlug); // pre-migration safety
  const row = ev as EventRow;
  if (row.hidden) return null; // switched off by the author — 404, like a deletion
  if (!row.has_content) return null; // known link-only event — no detail page

  const { data: head } = await supabase
    .from("portfolio_collections")
    .select(HEADER_COLS)
    .eq("slug", collectionSlug)
    .maybeSingle();
  const e: EventItem = {
    title: row.title,
    url: row.url ?? "",
    ...(row.image ? { image: row.image } : {}),
    slug: row.slug,
    ...(row.metrics ? { metrics: row.metrics as EventItem["metrics"] } : {}),
    sessions: (row.sessions as EventItem["sessions"]) ?? [],
    hasContent: true,
  };
  return { c: headerCollection(collectionSlug, (head as LightRow) ?? {}), e };
}

function eventFromDefault(collectionSlug: string, eventSlug: string): EventPage | null {
  const c = collectionDefault(collectionSlug);
  if (!c) return null;
  for (const g of c.data.groups ?? [])
    for (const e of g.events)
      if (e.slug === eventSlug && eventHasContent(e)) return { c, e };
  return null;
}

async function fetchEventFromFull(
  collectionSlug: string,
  eventSlug: string
): Promise<EventPage | null> {
  const c = await fetchCollectionFull(collectionSlug, true);
  if (!c) return null;
  for (const g of c.data.groups ?? [])
    for (const e of g.events)
      if (e.slug === eventSlug && eventHasContent(e)) return { c, e };
  return null;
}

/**
 * Slugs of every event with a content page — for the sitemap and
 * generateStaticParams. A light `has_content` query, no bodies. Tolerant:
 * returns [] on error (routes then render on-demand / are omitted from sitemap).
 */
export async function getCollectionEventSlugs(slug: string): Promise<string[]> {
  if (!isSupabaseConfigured()) {
    const c = collectionDefault(slug);
    const out: string[] = [];
    for (const g of c?.data.groups ?? [])
      for (const e of g.events) if (e.slug && eventHasContent(e)) out.push(e.slug);
    return out;
  }
  const supabase = createPublicClient();
  const { rows, error } = await fetchVisibleEventRows(supabase, slug);
  if (error || !rows) return [];
  return rows.filter((r) => r.has_content).map((r) => r.slug);
}
