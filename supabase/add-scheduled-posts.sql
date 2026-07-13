-- ═══════════════════════════════════════════════════════════════════════════
--  Scheduled posts — a published post with a FUTURE published_at stays hidden
--  from the public until that time arrives, then goes live automatically
--  (checked on every read, no cron needed). Admins (service role) see all.
--  Tolerant: skips optional tables/columns that may not exist. Safe to re-run.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── RLS: public/member reads require the publish time to have arrived ───────
drop policy if exists "blog public posts" on public.blog_posts;
create policy "blog public posts" on public.blog_posts for select
  using (
    status = 'published' and is_public = true
    and (published_at is null or published_at <= now())
  );

drop policy if exists "blog member posts" on public.blog_posts;
create policy "blog member posts" on public.blog_posts for select
  using (
    status = 'published' and auth.uid() is not null
    and (published_at is null or published_at <= now())
  );

-- Members-only content policy — only if that table exists (optional feature).
do $$
begin
  if to_regclass('public.blog_member_content') is not null then
    drop policy if exists "member content authed read" on public.blog_member_content;
    create policy "member content authed read" on public.blog_member_content for select
      using (
        auth.uid() is not null
        and exists (
          select 1 from public.blog_posts p
          where p.id = post_id and p.status = 'published'
            and (p.published_at is null or p.published_at <= now())
        )
      );
  end if;
end $$;

-- ─── previews view — rebuild so it also hides scheduled posts. Includes the
--     translations column only if it exists (i.e. the translation migration
--     has been run); the app falls back gracefully either way. ───────────────
do $$
begin
  drop view if exists public.blog_previews;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'blog_posts' and column_name = 'translations'
  ) then
    execute $v$
      create view public.blog_previews as
        select id, slug, title, excerpt, cover_image_url, tags, is_public,
               published_at, created_at, has_member_content,
               jsonb_strip_nulls(jsonb_build_object(
                 'en', case when translations ? 'en' then
                   jsonb_build_object('title', translations->'en'->>'title',
                                      'excerpt', translations->'en'->>'excerpt') end,
                 'zh', case when translations ? 'zh' then
                   jsonb_build_object('title', translations->'zh'->>'title',
                                      'excerpt', translations->'zh'->>'excerpt') end
               )) as translations
        from public.blog_posts
        where status = 'published' and (published_at is null or published_at <= now())
    $v$;
  else
    execute $v$
      create view public.blog_previews as
        select id, slug, title, excerpt, cover_image_url, tags, is_public,
               published_at, created_at, has_member_content
        from public.blog_posts
        where status = 'published' and (published_at is null or published_at <= now())
    $v$;
  end if;
end $$;

grant select on public.blog_previews to anon, authenticated;
