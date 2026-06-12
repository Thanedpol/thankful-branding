-- ═══════════════════════════════════════════════════════════════════════════
--  Migration for an EXISTING database (one that already ran the old schema):
--    1. add the new 'Video' portfolio category
--    2. recategorize the real video-editor projects to 'Video'
--    3. remove the demo/sample AI projects
--
--  ⚠️  Postgres requires a new enum value to be committed before it can be used.
--  Run STEP 1 ON ITS OWN first (click Run), THEN run STEP 2.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── STEP 1 — run this line by itself first ───────────────────────────────────
alter type public.portfolio_cat add value if not exists 'Video';


-- ── STEP 2 — run the rest after STEP 1 has committed ─────────────────────────
update public.portfolio
  set category = 'Video'
  where title in (
    'Video Editor — Y.E.M. Young Executive Management',
    'Siam Global Group — SUMO Service'
  );

-- Remove the demo/sample projects so only real work remains.
delete from public.portfolio
  where title in (
    'Neural Agent Orchestrator',
    'Synaptic — Realtime ML Dashboard',
    'Glitch UI Kit',
    'Vision Transformer Playground',
    'Quantum Notes',
    'Aurora Render Engine'
  );

-- Note: the old 'AI' enum value still exists on the type but is no longer
-- offered in the Admin UI. Removing an in-use enum value requires recreating
-- the type, which isn't worth it — leaving it is harmless.
