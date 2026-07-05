-- ═══════════════════════════════════════════════════════════════════════════
--  Editable portfolio collection pages (Snobby Story, Insightist).
--  Run once in the Supabase SQL Editor.
--
--  Each collection page (/portfolio/<slug>) stores its header fields as columns
--  and its shape-specific items in `data` (JSONB): { stories: [...] } for
--  Snobby, { groups: [...] } for Insightist. World-readable, admin-writable.
--  Until a row exists the pages fall back to the built-in defaults in code.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.portfolio_collections (
  slug        text primary key,
  title       text not null,
  tagline     text,
  intro       text,
  category    text,
  tags        text[] not null default '{}',
  data        jsonb  not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

alter table public.portfolio_collections enable row level security;

create policy "collections public read" on public.portfolio_collections
  for select using (true);
create policy "collections admin write" on public.portfolio_collections
  for all using (public.is_admin()) with check (public.is_admin());

grant select on public.portfolio_collections to anon, authenticated;
