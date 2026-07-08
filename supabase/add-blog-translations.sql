-- ═══════════════════════════════════════════════════════════════════════════
--  AI blog translations (English + Simplified Chinese)
--  Stores machine translations of each post's title / excerpt / body so the
--  public site can show the post in the reader's selected language.
--  Run AFTER the earlier blog migrations. Safe to re-run.
-- ═══════════════════════════════════════════════════════════════════════════

-- Per-post translations: { "en": {title,excerpt,body}, "zh": {title,excerpt,body} }
alter table public.blog_posts
  add column if not exists translations   jsonb not null default '{}'::jsonb,
  add column if not exists translated_hash text;   -- hash of the source that was translated

-- ─── Expose translated title + excerpt (NOT body) on the public preview view ──
-- body is intentionally stripped so a member-only post's translated body can't
-- leak through the world-readable preview (mirrors why body is absent already).
create or replace view public.blog_previews as
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
  where status = 'published';

grant select on public.blog_previews to anon, authenticated;
