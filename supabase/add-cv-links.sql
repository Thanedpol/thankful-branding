-- ═══════════════════════════════════════════════════════════════════════════
--  CV / Resume links on the site profile
--  Lets the admin set (or upload) a Thai + English CV shown by the "View CV"
--  buttons on the homepage. Blank = fall back to the built-in /cv/*.html pages.
--  Safe to re-run.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.site_profile
  add column if not exists cv_th_url text,
  add column if not exists cv_en_url text;
