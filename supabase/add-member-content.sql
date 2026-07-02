-- ═══════════════════════════════════════════════════════════════════════════
--  Add member-exclusive ("freemium") blog content.
--  Run once in the Supabase SQL Editor.
--
--  Model: blog_posts.body stays the PUBLIC teaser (everyone reads it). An
--  optional members-only continuation lives in blog_member_content, protected
--  by RLS so anonymous visitors can never fetch it — they only see a gate.
--  blog_posts.has_member_content is a world-readable flag so the UI knows a
--  member section exists without exposing its text.
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. World-readable flag on the post (no content, safe for anon).
alter table public.blog_posts
  add column if not exists has_member_content boolean not null default false;

-- 2. The protected members-only body, one row per post.
create table if not exists public.blog_member_content (
  post_id     uuid primary key references public.blog_posts (id) on delete cascade,
  member_body text
);

alter table public.blog_member_content enable row level security;

-- Logged-in members (and admins) may read the exclusive body of a PUBLISHED
-- post. Anonymous visitors match no policy → 0 rows → they see the gate.
drop policy if exists "member content authed read" on public.blog_member_content;
create policy "member content authed read" on public.blog_member_content for select
  using (
    auth.uid() is not null
    and exists (
      select 1 from public.blog_posts p
      where p.id = post_id and p.status = 'published'
    )
  );

-- Admins manage it (admin writes also go via the service role, which bypasses RLS).
drop policy if exists "member content admin all" on public.blog_member_content;
create policy "member content admin all" on public.blog_member_content for all
  using (public.is_admin()) with check (public.is_admin());

grant select on public.blog_member_content to anon, authenticated;

-- 3. Surface the flag on the public previews view (new column must go last).
create or replace view public.blog_previews as
  select id, slug, title, excerpt, cover_image_url, tags, is_public,
         published_at, created_at, has_member_content
  from public.blog_posts
  where status = 'published';

grant select on public.blog_previews to anon, authenticated;
