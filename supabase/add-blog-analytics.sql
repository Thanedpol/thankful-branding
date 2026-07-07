-- ═══════════════════════════════════════════════════════════════════════════
--  Blog Analytics — self-built view tracking + a "Jetpack-style" stats backend
--  Run this in the Supabase SQL Editor (or `supabase db push`) on the project.
--  Safe to re-run: guarded with IF NOT EXISTS / CREATE OR REPLACE.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Denormalized per-post total (O(1) reads on the public post page) ────────
alter table public.blog_posts
  add column if not exists view_count integer not null default 0;

-- ─── blog_views: one row per counted view (the raw event log we aggregate) ───
create table if not exists public.blog_views (
  id           bigint generated always as identity primary key,
  post_id      uuid not null references public.blog_posts (id) on delete cascade,
  slug         text not null,
  viewed_at    timestamptz not null default now(),
  visitor_hash text,          -- daily-salted hash of ip+ua (privacy-preserving)
  referrer     text,          -- host of the linking page ('' = direct)
  country      text           -- 2-letter code from the edge (Vercel geo header)
);

create index if not exists blog_views_post_idx     on public.blog_views (post_id);
create index if not exists blog_views_viewed_idx    on public.blog_views (viewed_at desc);
create index if not exists blog_views_visitor_idx   on public.blog_views (post_id, visitor_hash, viewed_at desc);

-- ─── Keep blog_posts.view_count in sync on every insert ──────────────────────
create or replace function public.bump_blog_view_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.blog_posts set view_count = view_count + 1 where id = new.post_id;
  return new;
end;
$$;

drop trigger if exists blog_views_bump on public.blog_views;
create trigger blog_views_bump after insert on public.blog_views
  for each row execute function public.bump_blog_view_count();

-- ─── RLS: lock the event log down ────────────────────────────────────────────
-- Views are recorded ONLY by the API route via the service role (which bypasses
-- RLS), so counts can't be inflated from the client. Admins may read the log.
alter table public.blog_views enable row level security;
drop policy if exists "blog_views admin read" on public.blog_views;
create policy "blog_views admin read" on public.blog_views for select using (public.is_admin());

-- ═══════════════════════════════════════════════════════════════════════════
--  Aggregation RPCs — called from the admin analytics page (service role)
-- ═══════════════════════════════════════════════════════════════════════════

-- Headline totals: all-time, today, last 7 / 30 days, unique visitors (30d).
create or replace function public.blog_view_totals()
returns table (total bigint, today bigint, last7 bigint, last30 bigint, unique30 bigint)
language sql security definer set search_path = public stable as $$
  select
    count(*)                                                          as total,
    count(*) filter (where viewed_at >= date_trunc('day', now()))    as today,
    count(*) filter (where viewed_at >= now() - interval '7 days')   as last7,
    count(*) filter (where viewed_at >= now() - interval '30 days')  as last30,
    count(distinct visitor_hash)
      filter (where viewed_at >= now() - interval '30 days')         as unique30
  from public.blog_views;
$$;

-- Daily series: one zero-filled row per day for the last N days.
create or replace function public.blog_views_daily(days int default 30)
returns table (day date, views bigint)
language sql security definer set search_path = public stable as $$
  select d::date as day, count(v.id) as views
  from generate_series(
         date_trunc('day', now()) - ((days - 1) || ' days')::interval,
         date_trunc('day', now()),
         interval '1 day'
       ) d
  left join public.blog_views v
    on date_trunc('day', v.viewed_at) = d
  group by d
  order by d;
$$;

-- Top posts: windowed views + all-time total per post.
create or replace function public.blog_top_posts(days int default 30, lim int default 10)
returns table (post_id uuid, title text, slug text, views bigint, total bigint)
language sql security definer set search_path = public stable as $$
  select p.id, p.title, p.slug,
         count(v.id) filter (where v.viewed_at >= now() - (days || ' days')::interval) as views,
         count(v.id) as total
  from public.blog_posts p
  left join public.blog_views v on v.post_id = p.id
  group by p.id, p.title, p.slug
  order by views desc, total desc
  limit lim;
$$;

-- Dimension breakdowns (referrer / country), top N in the window.
create or replace function public.blog_views_by_referrer(days int default 30, lim int default 8)
returns table (label text, views bigint)
language sql security definer set search_path = public stable as $$
  select coalesce(nullif(referrer, ''), 'Direct / unknown') as label, count(*) as views
  from public.blog_views
  where viewed_at >= now() - (days || ' days')::interval
  group by 1 order by views desc limit lim;
$$;

create or replace function public.blog_views_by_country(days int default 30, lim int default 8)
returns table (label text, views bigint)
language sql security definer set search_path = public stable as $$
  select coalesce(nullif(country, ''), 'Unknown') as label, count(*) as views
  from public.blog_views
  where viewed_at >= now() - (days || ' days')::interval
  group by 1 order by views desc limit lim;
$$;

grant execute on function public.blog_view_totals()            to service_role;
grant execute on function public.blog_views_daily(int)         to service_role;
grant execute on function public.blog_top_posts(int, int)      to service_role;
grant execute on function public.blog_views_by_referrer(int, int) to service_role;
grant execute on function public.blog_views_by_country(int, int)  to service_role;
