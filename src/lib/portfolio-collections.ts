import { createClient } from "@/lib/supabase/server";
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
    const supabase = await createClient();
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
