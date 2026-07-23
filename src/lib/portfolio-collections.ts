import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/demo-data";
import { snobbyStory } from "@/lib/snobby-story";
import { insightist } from "@/lib/insightist";
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
    data:
      row.data && Object.keys(row.data).length ? row.data : fallback?.data ?? {},
  };
}

/**
 * Public (anon) read of a collection: Supabase first, falling back to the
 * built-in default. Tolerant of a pre-migration DB where the table is missing.
 */
export async function fetchCollection(
  slug: string
): Promise<PortfolioCollection | null> {
  if (!isSupabaseConfigured()) return collectionDefault(slug);
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("portfolio_collections")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (error) return collectionDefault(slug);
    return mergeCollection(slug, data as Partial<PortfolioCollection> | null);
  } catch {
    return collectionDefault(slug);
  }
}
