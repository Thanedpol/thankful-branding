-- ─── portfolio_events ────────────────────────────────────────────────────────
-- One "งาน" (event) per row. The heavy rich-text `sessions` HTML lives here so
-- the public listing/event/sitemap reads never load the whole ~4 MB collection
-- blob. The parent collection keeps only its header + light group metadata.
--
-- Run this once in the Supabase SQL Editor (same as add-portfolio-collections.sql).
create table if not exists public.portfolio_events (
  collection_slug text not null
    references public.portfolio_collections (slug) on delete cascade,
  slug         text not null,                      -- URL slug (may be Thai)
  group_name   text not null default '',           -- joins to the light group meta
  event_order  int  not null default 0,            -- order WITHIN its group
  title        text not null,
  url          text,                               -- Facebook post URL
  image        text,                               -- cover image URL
  metrics      jsonb,                              -- CollectionEventMetrics | null
  sessions     jsonb not null default '[]'::jsonb, -- [{title,image,body,url,metrics}]
  has_content  boolean not null default false,     -- cached eventHasContent()
  updated_at   timestamptz not null default now(),
  primary key (collection_slug, slug)              -- exact event-page lookup
);

-- Listing: filter by collection + deterministic ordering within groups.
create index if not exists portfolio_events_listing_idx
  on public.portfolio_events (collection_slug, group_name, event_order);

-- generateStaticParams / sitemap: content events without scanning bodies.
create index if not exists portfolio_events_content_idx
  on public.portfolio_events (collection_slug, has_content);

alter table public.portfolio_events enable row level security;

-- RLS mirrors portfolio_collections exactly (public read, admin write).
drop policy if exists "events public read" on public.portfolio_events;
create policy "events public read" on public.portfolio_events
  for select using (true);

drop policy if exists "events admin write" on public.portfolio_events;
create policy "events admin write" on public.portfolio_events
  for all using (public.is_admin()) with check (public.is_admin());

grant select on public.portfolio_events to anon, authenticated;
