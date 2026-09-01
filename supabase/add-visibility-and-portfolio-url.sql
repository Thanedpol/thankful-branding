-- ─── Show / hide a portfolio item, and a link to the standalone portfolio ────
-- Run once in the Supabase SQL Editor. Both are additive: existing rows keep
-- working unchanged (nothing is hidden by default, the link stays optional).

-- Per-event visibility. Sub-session visibility rides along inside the existing
-- `sessions` jsonb, so it needs no column of its own.
alter table public.portfolio_events
  add column if not exists hidden boolean not null default false;

-- The public listing and sitemap read "everything visible in this collection".
create index if not exists portfolio_events_visible_idx
  on public.portfolio_events (collection_slug, hidden);

-- Link behind the "ดูพอร์ตโฟลิโอ" button on the homepage, editable in
-- /admin/profile like the two résumés. Blank = the built-in /cv/portfolio.html.
alter table public.site_profile
  add column if not exists portfolio_url text;
