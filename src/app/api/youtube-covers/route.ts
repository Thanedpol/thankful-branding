import { NextResponse } from "next/server";
import { SERIES } from "@/lib/youtube";
import { fetchPlaylistCover } from "@/lib/youtube-feeds";

/**
 * Current cover of each series playlist, for the home page to poll so a cover
 * changed in YouTube Studio appears without anyone reloading.
 *
 * The CDN holds each answer for 60 s, so however many visitors are polling,
 * YouTube is asked at most about once a minute.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const entries = await Promise.all(
    SERIES.map(async (s) => [s.playlistId, await fetchPlaylistCover(s.playlistId)] as const)
  );
  return NextResponse.json(
    { covers: Object.fromEntries(entries), checkedAt: new Date().toISOString() },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=240" } }
  );
}
