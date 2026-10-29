import { SITE_URL } from "@/lib/seo";

/**
 * IndexNow: tell Bing (and Yandex, Naver, Seznam) the moment a page is new or
 * changed, instead of waiting for a crawl. It matters for AI answers because
 * ChatGPT search and Microsoft Copilot both draw on Bing's index.
 *
 * The key is public by design — it is served at /<key>.txt so the engines can
 * check this site owns the submission.
 */
export const INDEXNOW_KEY = "a8f354277d0acf23c2e5b38736e77ab5";

export async function pingIndexNow(paths: string[]): Promise<void> {
  // Only the live site: previews and local runs must not report URLs.
  if (process.env.VERCEL_ENV !== "production" || paths.length === 0) return;
  const host = new URL(SITE_URL).host;
  try {
    await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host,
        key: INDEXNOW_KEY,
        keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
        urlList: [...new Set(paths)].map((p) => `${SITE_URL}${p}`),
      }),
    });
  } catch {
    // Best-effort: a failed ping only means the next crawl finds the page.
  }
}
