-- ═══════════════════════════════════════════════════════════════════════════
--  Blog Analytics — arbitrary date-range + bucketed series functions
--  Adds from/to (and hour/day/week/month bucket) aware RPCs so the admin
--  Analytics chart can show 1 day / 7 / 14 days / 3 / 6 months / 1 year / custom.
--  Run AFTER add-blog-analytics.sql. Safe to re-run (CREATE OR REPLACE).
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Bucketed, zero-filled series between two timestamps ─────────────────────
-- p_bucket ∈ {hour, day, week, month}; anything else falls back to 'day'.
create or replace function public.blog_views_series(
  p_from timestamptz, p_to timestamptz, p_bucket text default 'day'
)
returns table (bucket_start timestamptz, views bigint)
language plpgsql security definer set search_path = public stable as $$
declare
  b    text     := case when p_bucket in ('hour','day','week','month') then p_bucket else 'day' end;
  step interval := ('1 ' || b)::interval;
begin
  return query
    select g as bucket_start, count(v.id) as views
    from generate_series(date_trunc(b, p_from), date_trunc(b, p_to), step) g
    left join public.blog_views v
      on v.viewed_at >= g and v.viewed_at < g + step
    group by g
    order by g;
end;
$$;

-- ─── Total + unique visitors inside an arbitrary range ──────────────────────
create or replace function public.blog_range_totals(p_from timestamptz, p_to timestamptz)
returns table (total bigint, unique_visitors bigint)
language sql security definer set search_path = public stable as $$
  select count(*) as total,
         count(distinct visitor_hash) as unique_visitors
  from public.blog_views
  where viewed_at >= p_from and viewed_at <= p_to;
$$;

-- ─── Top posts: views inside the range + all-time total per post ─────────────
create or replace function public.blog_top_posts_range(
  p_from timestamptz, p_to timestamptz, lim int default 10
)
returns table (post_id uuid, title text, slug text, views bigint, total bigint)
language sql security definer set search_path = public stable as $$
  select p.id, p.title, p.slug,
         count(v.id) filter (where v.viewed_at >= p_from and v.viewed_at <= p_to) as views,
         count(v.id) as total
  from public.blog_posts p
  left join public.blog_views v on v.post_id = p.id
  group by p.id, p.title, p.slug
  order by views desc, total desc
  limit lim;
$$;

-- ─── Dimension breakdowns inside the range ──────────────────────────────────
create or replace function public.blog_views_by_referrer_range(
  p_from timestamptz, p_to timestamptz, lim int default 8
)
returns table (label text, views bigint)
language sql security definer set search_path = public stable as $$
  select coalesce(nullif(referrer, ''), 'Direct / unknown') as label, count(*) as views
  from public.blog_views
  where viewed_at >= p_from and viewed_at <= p_to
  group by 1 order by views desc limit lim;
$$;

create or replace function public.blog_views_by_country_range(
  p_from timestamptz, p_to timestamptz, lim int default 8
)
returns table (label text, views bigint)
language sql security definer set search_path = public stable as $$
  select coalesce(nullif(country, ''), 'Unknown') as label, count(*) as views
  from public.blog_views
  where viewed_at >= p_from and viewed_at <= p_to
  group by 1 order by views desc limit lim;
$$;

grant execute on function public.blog_views_series(timestamptz, timestamptz, text)         to service_role;
grant execute on function public.blog_range_totals(timestamptz, timestamptz)               to service_role;
grant execute on function public.blog_top_posts_range(timestamptz, timestamptz, int)       to service_role;
grant execute on function public.blog_views_by_referrer_range(timestamptz, timestamptz, int) to service_role;
grant execute on function public.blog_views_by_country_range(timestamptz, timestamptz, int)  to service_role;
