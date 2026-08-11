/**
 * One-off import: add every "[AI Tools Spotlight]" Facebook post that isn't in
 * the portfolio yet as an event in the Insightist "AI Tools" group, continuing
 * after the six already written by hand.
 *
 * Post text is imported verbatim (one <p> per line, HTML-escaped) — nothing is
 * rewritten. Metrics come straight from the CSV export in the same shape the
 * existing events use.
 *
 *   node scripts/import-ai-tools-spotlight.mjs            # dry run (default)
 *   node scripts/import-ai-tools-spotlight.mjs --apply    # write to Supabase
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const APPLY = process.argv.includes("--apply");
const SCRATCH =
  "C:/Users/Asus/AppData/Local/Temp/claude/D----------Solutions-Impact-Content-Project-Blogger/61a2c036-cf6e-414f-8e72-953db9cae952/scratchpad";
const COLLECTION = "insightist";
const GROUP = "AI Tools ทั้งแพลตฟอร์ม, Products และแอพพลิเคชั่น";

function env(n) {
  if (process.env[n]) return process.env[n];
  const l = readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .find((x) => x.startsWith(n + "="));
  return l ? l.slice(n.length + 1).replace(/^["']|["']$/g, "") : undefined;
}
const supa = createClient(env("NEXT_PUBLIC_SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { persistSession: false },
});

/** Brand/product each post is about — the event's display name, matching how
 *  the hand-written six are named (ELSA Speak Thailand, OVOPark, …).
 *  Keyed by the post's position in pending.json. */
const TITLES = [
  "IngFah AI", "Zaapi Thailand", "Pettinee AI", "Brandbiz Group", "BEE Logistics",
  "Insta360", "Audience IQ", "ShopStack", "Safie", "EDA Thailand",
  "Privage App", "ZortOut", "Choco CDP", "LogiNext", "BYON AI CCTV",
  "LDM TWIN AI", "SkyFrog TMS", "Saifa AI", "Kalguroo", "iApp",
  "BigBot AI", "Magnific VS Krea.ai VS HiggsField", "SkyWork VS Manus VS GenSpark",
  "Hi-Top AI", "Manus Data Gloves", "AIYA", "GPTBots.ai", "Gowajee",
  "SmartKorp AI", "Mudjai AI", "Thermomix", "ALTA", "TAKU OS", "iSyncWave",
  "Ask Aura", "Zentr", "Omnifit", "Bloomtastic", "Imbody AI", "Technogym",
  "The Red Carbon", "Buzzebees", "FlowithOS", "ZWIZ.AI", "RAFFAI", "Aerogram AI",
  "Celesti AI", "Xynth", "Tamburins", "Wang Data Market", "Inspectra CXR",
  "Cariva AI", "True AI Hub", "BURT AI",
];

const esc = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Post text → the same HTML shape the existing events store: one <p> per line. */
const toHtml = (text) =>
  text
    .split("\n")
    .map((l) => l.replace(/\r/g, "").trimEnd())
    .filter((l) => l.trim() !== "")
    .map((l) => `<p>${esc(l)}</p>`)
    .join("");

const slugify = (s) =>
  (s || "").toString().trim().toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}\p{M}-]+/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);

/** "MM/DD/YYYY HH:mm" → sortable timestamp. */
function ts(published) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/.exec(published || "");
  if (!m) return 0;
  const [, mm, dd, yyyy, hh, mi] = m;
  return Date.parse(`${yyyy}-${mm}-${dd}T${hh}:${mi}:00Z`);
}

const posts = JSON.parse(readFileSync(`${SCRATCH}/pending.json`, "utf8"));
if (posts.length !== TITLES.length) {
  console.error(`ABORT: ${posts.length} posts but ${TITLES.length} titles`);
  process.exit(1);
}

// Existing rows: the six hand-written events keep their order; new ones follow.
const { data: existing, error: exErr } = await supa
  .from("portfolio_events")
  .select("slug,title,event_order")
  .eq("collection_slug", COLLECTION)
  .eq("group_name", GROUP)
  .order("event_order");
if (exErr) { console.error("ABORT:", exErr.message); process.exit(1); }
const { data: allRows } = await supa
  .from("portfolio_events").select("slug").eq("collection_slug", COLLECTION);
const usedSlugs = new Set((allRows ?? []).map((r) => r.slug));
console.log(`existing in group: ${existing.length} (orders ${existing.map(e=>e.event_order).join(",")})`);

// Newest first, continuing straight after the hand-written block.
const ordered = posts
  .map((p, i) => ({ ...p, brand: TITLES[i] }))
  .sort((a, b) => ts(b.published) - ts(a.published));

let order = existing.length;
const rows = ordered.map((p) => {
  const headline = p.title.split("\n")[0];
  const sessionTitle = headline.replace(/^\[AI Tools Spotlight\]\s*/, "").trim();
  let slug = slugify(p.brand) || `ai-tools-${p.id}`;
  while (usedSlugs.has(slug)) slug += "-2";
  usedSlugs.add(slug);

  const metrics = {};
  if (p.published) metrics.date = p.published;
  if (p.reach !== undefined) metrics.reach = p.reach;
  if (p.views !== undefined) metrics.views = p.views;
  if (p.shares !== undefined) metrics.shares = p.shares;
  if (p.comments !== undefined) metrics.comments = p.comments;
  if (p.reactions !== undefined) metrics.reactions = p.reactions;

  return {
    collection_slug: COLLECTION,
    slug,
    group_name: GROUP,
    event_order: order++,
    title: p.brand,
    url: p.link || null,
    image: null,
    metrics: Object.keys(metrics).length ? metrics : null,
    sessions: [{ title: sessionTitle, body: toHtml(p.title) }],
    has_content: true,
  };
});

const bytes = Buffer.byteLength(JSON.stringify(rows), "utf8");
console.log(`\nprepared ${rows.length} events, +${(bytes / 1024).toFixed(0)} KB of content`);
console.log(`order ${rows[0].event_order + 1}..${rows[rows.length - 1].event_order + 1} (newest → oldest)\n`);
rows.slice(0, 6).forEach((r) =>
  console.log(`  #${r.event_order + 1} ${r.title}  [${r.metrics?.date}]  slug=${r.slug}`)
);
console.log("  …");
rows.slice(-3).forEach((r) =>
  console.log(`  #${r.event_order + 1} ${r.title}  [${r.metrics?.date}]  slug=${r.slug}`)
);

// What this does to the blob the admin editor still loads.
const { data: coll } = await supa
  .from("portfolio_collections").select("data").eq("slug", COLLECTION).single();
const blobNow = Buffer.byteLength(JSON.stringify(coll.data), "utf8");
console.log(`\nblob now: ${(blobNow / 1024 / 1024).toFixed(2)} MB  →  after: ~${((blobNow + bytes) / 1024 / 1024).toFixed(2)} MB  (Vercel limit ~4.5 MB)`);

if (!APPLY) {
  writeFileSync(`${SCRATCH}/rows-preview.json`, JSON.stringify(rows, null, 1));
  console.log("\nDRY RUN — nothing written. Re-run with --apply");
  process.exit(0);
}

// ── apply ───────────────────────────────────────────────────────────────────
writeFileSync(`${SCRATCH}/blob-before-import.json`, JSON.stringify(coll.data));
console.log(`\nbackup written: ${SCRATCH}/blob-before-import.json`);

for (let i = 0; i < rows.length; i += 25) {
  const { error } = await supa
    .from("portfolio_events")
    .upsert(rows.slice(i, i + 25), { onConflict: "collection_slug,slug" });
  if (error) { console.error(`ABORT upsert @${i}:`, error.message); process.exit(1); }
  console.log(`  upserted ${Math.min(i + 25, rows.length)}/${rows.length}`);
}

const { count } = await supa
  .from("portfolio_events")
  .select("*", { count: "exact", head: true })
  .eq("collection_slug", COLLECTION)
  .eq("group_name", GROUP);
console.log(`\n✔ group now has ${count} events (expected ${existing.length + rows.length})`);

// The admin editor still reads (and saves from) the inline blob, and its save
// deletes rows the blob doesn't know about. Mirror the rows back into
// `data.groups` so the two stay identical and no Save can drop the import.
const { data: fresh } = await supa
  .from("portfolio_events").select("*").eq("collection_slug", COLLECTION);
const meta = coll.data.groups_meta ?? [];
const names = meta.map((m) => m.name);
for (const r of fresh) {
  if (!names.includes(r.group_name)) { names.push(r.group_name); meta.push({ name: r.group_name }); }
}
const groups = meta.map((m) => ({
  name: m.name,
  ...(m.popular ? { popular: true } : {}),
  events: fresh
    .filter((r) => r.group_name === m.name)
    .sort((a, b) => a.event_order - b.event_order)
    .map((r) => ({
      title: r.title ?? "",
      url: r.url ?? "",
      ...(r.image ? { image: r.image } : {}),
      ...(r.slug ? { slug: r.slug } : {}),
      ...(r.metrics ? { metrics: r.metrics } : {}),
      ...(r.sessions?.length ? { sessions: r.sessions } : {}),
    })),
}));
const totalEvents = groups.reduce((n, g) => n + g.events.length, 0);
if (totalEvents !== fresh.length) {
  console.error(`ABORT before blob write: ${totalEvents} vs ${fresh.length} rows`);
  process.exit(1);
}
const nextData = { ...coll.data, groups, groups_meta: meta };
const { error: blobErr } = await supa
  .from("portfolio_collections")
  .update({ data: nextData, updated_at: new Date().toISOString() })
  .eq("slug", COLLECTION);
if (blobErr) { console.error("ABORT blob write:", blobErr.message); process.exit(1); }
console.log(
  `✔ blob synced: ${totalEvents} events, ${(Buffer.byteLength(JSON.stringify(nextData), "utf8") / 1024 / 1024).toFixed(2)} MB`
);
console.log("\n✅ done — rows and the admin blob hold the same events.");
