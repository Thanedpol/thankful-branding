-- ═══════════════════════════════════════════════════════════════════════════
--  Per-post analytics — same range/bucket aggregation as add-analytics-ranges,
--  but scoped to ONE post (p_post_id). Powers the per-blog stats page.
--  Run AFTER add-blog-analytics.sql + add-analytics-ranges.sql. Safe to re-run.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.blog_views_series_post(
  p_post_id uuid, p_from timestamptz, p_to timestamptz, p_bucket text default 'day'
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
      on v.post_id = p_post_id and v.viewed_at >= g and v.viewed_at < g + step
    group by g
    order by g;
end;
$$;

create or replace function public.blog_range_totals_post(
  p_post_id uuid, p_from timestamptz, p_to timestamptz
)
returns table (total bigint, unique_visitors bigint)
language sql security definer set search_path = public stable as $$
  select count(*) as total, count(distinct visitor_hash) as unique_visitors
  from public.blog_views
  where post_id = p_post_id and viewed_at >= p_from and viewed_at <= p_to;
$$;

create or replace function public.blog_views_by_referrer_post(
  p_post_id uuid, p_from timestamptz, p_to timestamptz, lim int default 8
)
returns table (label text, views bigint)
language sql security definer set search_path = public stable as $$
  select coalesce(nullif(referrer, ''), 'Direct / unknown') as label, count(*) as views
  from public.blog_views
  where post_id = p_post_id and viewed_at >= p_from and viewed_at <= p_to
  group by 1 order by views desc limit lim;
$$;

create or replace function public.blog_views_by_country_post(
  p_post_id uuid, p_from timestamptz, p_to timestamptz, lim int default 8
)
returns table (label text, views bigint)
language sql security definer set search_path = public stable as $$
  select coalesce(nullif(country, ''), 'Unknown') as label, count(*) as views
  from public.blog_views
  where post_id = p_post_id and viewed_at >= p_from and viewed_at <= p_to
  group by 1 order by views desc limit lim;
$$;

grant execute on function public.blog_views_series_post(uuid, timestamptz, timestamptz, text)  to service_role;
grant execute on function public.blog_range_totals_post(uuid, timestamptz, timestamptz)         to service_role;
grant execute on function public.blog_views_by_referrer_post(uuid, timestamptz, timestamptz, int) to service_role;
grant execute on function public.blog_views_by_country_post(uuid, timestamptz, timestamptz, int)  to service_role;
