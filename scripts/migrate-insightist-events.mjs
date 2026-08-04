/**
 * One-time migration: split the monolithic `portfolio_collections` row for
 * `insightist` into per-event `portfolio_events` rows.
 *
 * Phase 1 (default): back up the full row to a JSON file, then upsert one
 *   portfolio_events row per event. The original `data` blob is left INTACT.
 *     node --env-file=.env.local scripts/migrate-insightist-events.mjs
 *
 * Phase 2 (--shrink): after the new code is deployed + verified, reduce
 *   portfolio_collections.data to just header + light group metadata
 *   ({ groups: [{name, popular}] }). Backs up again first; reversible.
 *     node --env-file=.env.local scripts/migrate-insightist-events.mjs --shrink
 *
 * Env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (from .env.local).
 * Optional: BACKUP_FILE=<path> (defaults to ./insightist-migration-backup.json).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const SLUG = "insightist";
const SHRINK = process.argv.includes("--shrink");
const META = process.argv.includes("--meta");
const BACKUP_FILE = process.env.BACKUP_FILE || "insightist-migration-backup.json";

// Fallback env parse if not launched with --env-file.
function env(name) {
  if (process.env[name]) return process.env[name];
  try {
    const line = readFileSync(".env.local", "utf8")
      .split(/\r?\n/)
      .find((l) => l.startsWith(name + "="));
    return line ? line.slice(name.length + 1).replace(/^["']|["']$/g, "") : undefined;
  } catch {
    return undefined;
  }
}

const URL = env("NEXT_PUBLIC_SUPABASE_URL");
const KEY = env("SUPABASE_SERVICE_ROLE_KEY");
if (!URL || !KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
const supa = createClient(URL, KEY, { auth: { persistSession: false } });

// ── Replicate the app's content helpers (portfolio-sessions.ts / slugify.ts) ──
const hasContent = (h) =>
  !!h && (h.replace(/<[^>]*>/g, "").trim().length > 0 || /<(img|figure|iframe|video)\b/i.test(h));
const eventSessions = (e) =>
  e.sessions?.length ? e.sessions : hasContent(e.body) ? [{ body: e.body }] : [];
const eventHasContent = (e) =>
  eventSessions(e).some((s) => hasContent(s.body) || !!s.image || !!(s.title && s.title.trim()));
const slugify = (s) =>
  (s || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}\p{M}-]+/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
const stripKeys = (o) => {
  // sessions in the DB are already clean, but drop editor-only markers defensively.
  const { _stripped, _k, ...rest } = o || {};
  return rest;
};

async function main() {
  const { data: row, error } = await supa
    .from("portfolio_collections")
    .select("*")
    .eq("slug", SLUG)
    .single();
  if (error || !row) {
    console.error("Cannot read collection row:", error?.message);
    process.exit(1);
  }

  // Always back up the full row before ANY write.
  try {
    writeFileSync(BACKUP_FILE, JSON.stringify(row));
    console.log(`✔ backup written: ${BACKUP_FILE} (${Buffer.byteLength(JSON.stringify(row), "utf8")} bytes)`);
  } catch (e) {
    console.error("ABORT: could not write backup:", e.message);
    process.exit(1);
  }

  const groups = row.data?.groups ?? [];
  if (!groups.length) {
    console.error("ABORT: collection has no groups (nothing to migrate).");
    process.exit(1);
  }

  if (META) return writeMeta(row, groups);
  if (SHRINK) return shrink(row, groups);
  return insertRows(groups);
}

/**
 * Populate `data.groups_meta` (light group order + popular flag) alongside the
 * existing blob so the new public read path can render the listing without
 * loading the heavy `data.groups`. No DDL — just a data update.
 */
async function writeMeta(row, groups) {
  const groups_meta = groups.map((g) => ({ name: g.name ?? "", popular: !!g.popular }));
  const data = { ...row.data, groups_meta };
  const { error } = await supa
    .from("portfolio_collections")
    .update({ data })
    .eq("slug", SLUG);
  if (error) {
    console.error("ABORT: groups_meta update failed:", error.message);
    process.exit(1);
  }
  console.log(`✔ wrote data.groups_meta (${groups_meta.length} groups):`);
  console.log("  " + groups_meta.map((g) => `${g.popular ? "★" : ""}${g.name}`).join(" | "));
  console.log("✅ Meta OK. Public read path can now assemble the listing lightly.");
}

async function insertRows(groups) {
  const rows = [];
  const usedSlugs = new Set();
  let contentCount = 0;
  const perGroup = {};

  groups.forEach((g, gi) => {
    (g.events ?? []).forEach((e, ei) => {
      let slug = e.slug || slugify(e.title) || `${gi}-${ei}`;
      while (usedSlugs.has(slug)) slug = slug + "-2";
      usedSlugs.add(slug);

      const sessions = eventSessions(e).map(stripKeys);
      const hc = eventHasContent(e);
      if (hc) contentCount++;
      perGroup[g.name] = (perGroup[g.name] ?? 0) + 1;

      rows.push({
        collection_slug: SLUG,
        slug,
        group_name: g.name ?? "",
        event_order: ei,
        title: e.title ?? "",
        url: e.url ?? null,
        image: e.image ?? null,
        metrics: e.metrics ?? null,
        sessions,
        has_content: hc,
      });
    });
  });

  console.log(`\nPrepared ${rows.length} event rows (${contentCount} with content).`);
  console.log("Per-group:", JSON.stringify(perGroup));

  // Upsert in batches (idempotent on PK collection_slug,slug).
  const BATCH = 50;
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    const { error } = await supa
      .from("portfolio_events")
      .upsert(chunk, { onConflict: "collection_slug,slug" });
    if (error) {
      console.error(`ABORT: upsert failed at batch ${i}:`, error.message);
      process.exit(1);
    }
    console.log(`  upserted ${Math.min(i + BATCH, rows.length)}/${rows.length}`);
  }

  // Verify.
  const { count } = await supa
    .from("portfolio_events")
    .select("*", { count: "exact", head: true })
    .eq("collection_slug", SLUG);
  const { count: contentDb } = await supa
    .from("portfolio_events")
    .select("*", { count: "exact", head: true })
    .eq("collection_slug", SLUG)
    .eq("has_content", true);
  console.log(`\n✔ VERIFY: portfolio_events rows = ${count} (expected ${rows.length})`);
  console.log(`✔ VERIFY: has_content rows = ${contentDb} (expected ${contentCount})`);
  console.log(count === rows.length && contentDb === contentCount ? "\n✅ Phase 1 OK. Blob left intact." : "\n⚠ COUNT MISMATCH — investigate before shrinking.");
}

async function shrink(row, groups) {
  // Safety: verify rows exist and match before shrinking the blob.
  const eventCount = groups.reduce((n, g) => n + (g.events?.length ?? 0), 0);
  const { count } = await supa
    .from("portfolio_events")
    .select("*", { count: "exact", head: true })
    .eq("collection_slug", SLUG);
  if (count !== eventCount) {
    console.error(`ABORT: portfolio_events has ${count} rows but blob has ${eventCount} events. Run phase 1 first / investigate.`);
    process.exit(1);
  }

  const lightGroups = groups.map((g) => ({ name: g.name, popular: g.popular ?? false }));
  const { error } = await supa
    .from("portfolio_collections")
    .update({ data: { groups: lightGroups }, updated_at: new Date().toISOString() })
    .eq("slug", SLUG);
  if (error) {
    console.error("ABORT: shrink update failed:", error.message);
    process.exit(1);
  }
  const { data: after } = await supa
    .from("portfolio_collections")
    .select("data")
    .eq("slug", SLUG)
    .single();
  console.log(`✔ shrunk data → ${Buffer.byteLength(JSON.stringify(after.data), "utf8")} bytes (light group meta only)`);
  console.log("✅ Phase 2 OK. Backup on disk + per-event rows are now the source of truth.");
}

main();
