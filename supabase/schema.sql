-- ═══════════════════════════════════════════════════════════════════════════
--  Thank Thanedpol — Personal Brand Portfolio
--  Supabase schema: tables, enums, RLS policies, role logic, storage buckets
--  Run this in the Supabase SQL Editor (or `supabase db push`) on a fresh project.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Enums ───────────────────────────────────────────────────────────────────
create type public.user_role     as enum ('member', 'admin');
create type public.portfolio_cat  as enum ('Video', 'Web', 'Design', 'Other');
create type public.blog_status    as enum ('draft', 'published');

-- ─── profiles: mirrors auth.users + holds the role ───────────────────────────
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  role        public.user_role not null default 'member',
  created_at  timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user signs up.
-- RULE: every self-registration is role = 'member'. Admin is never granted here.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'member')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Convenience: is the current request from an admin?
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ─── portfolio ────────────────────────────────────────────────────────────────
create table public.portfolio (
  id             uuid primary key default gen_random_uuid(),
  thumbnail_url  text,
  title          text not null,
  description    text,
  tech_tags      text[] not null default '{}',
  project_url    text,
  category       public.portfolio_cat not null default 'Other',
  featured       boolean not null default false,
  display_order  int not null default 0,
  created_at     timestamptz not null default now()
);

-- ─── blog_posts ───────────────────────────────────────────────────────────────
create table public.blog_posts (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  slug            text not null unique,
  body            text,                 -- rich text (HTML/markdown)
  excerpt         text,
  cover_image_url text,
  tags            text[] not null default '{}',
  is_public       boolean not null default true,   -- false = whole body is member-only
  has_member_content boolean not null default false, -- true = a members-only section exists
  status          public.blog_status not null default 'draft',
  published_at    timestamptz,
  created_at      timestamptz not null default now()
);

-- ─── blog_member_content ──────────────────────────────────────────────────────
-- Members-only continuation of a post ("freemium"). Kept in its own table so
-- RLS can protect it at row level: blog_posts.body is the public teaser that
-- everyone reads, this is the extra section only logged-in members receive.
create table public.blog_member_content (
  post_id     uuid primary key references public.blog_posts (id) on delete cascade,
  member_body text
);

-- ─── portfolio_collections (editable case-study pages: Snobby, Insightist) ────
-- Header fields as columns + shape-specific items in `data` (JSONB).
create table public.portfolio_collections (
  slug        text primary key,
  title       text not null,
  tagline     text,
  intro       text,
  category    text,
  tags        text[] not null default '{}',
  data        jsonb  not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

-- ─── site_profile (singleton — the public "About" identity) ───────────────────
create table public.site_profile (
  id                 int primary key default 1 check (id = 1),
  name               text not null default 'Thank Thanedpol',
  headline           text,
  long_bio           text,
  avatar_url         text,
  background_reel_url text,
  social_links       jsonb not null default '{"github":"","linkedin":"","x":"","email":""}'::jsonb,
  updated_at         timestamptz not null default now()
);

-- ─── press_kit (singleton) ────────────────────────────────────────────────────
create table public.press_kit (
  id                    int primary key default 1 check (id = 1),
  short_bio             text,
  long_bio              text,
  headshot_url          text,
  logo_files            jsonb not null default '[]'::jsonb,  -- [{label, file_url}]
  awards                text[] not null default '{}',
  media_contact_email   text,
  downloadable_kit_pdf_url text,
  updated_at            timestamptz not null default now()
);

-- ─── contact_messages ─────────────────────────────────────────────────────────
create table public.contact_messages (
  id            uuid primary key default gen_random_uuid(),
  sender_name   text not null,
  sender_email  text not null,
  subject       text,
  body          text not null,
  received_at   timestamptz not null default now(),
  is_read       boolean not null default false
);

-- ═══════════════════════════════════════════════════════════════════════════
--  Row Level Security
-- ═══════════════════════════════════════════════════════════════════════════
alter table public.profiles         enable row level security;
alter table public.portfolio        enable row level security;
alter table public.blog_posts       enable row level security;
alter table public.blog_member_content enable row level security;
alter table public.portfolio_collections enable row level security;
alter table public.site_profile     enable row level security;
alter table public.press_kit        enable row level security;
alter table public.contact_messages enable row level security;

-- profiles: users read their own; admins read all. No client-side role escalation.
create policy "read own profile"   on public.profiles for select using (auth.uid() = id);
create policy "admins read profiles" on public.profiles for select using (public.is_admin());

-- portfolio: world-readable, admin-writable.
create policy "portfolio public read" on public.portfolio for select using (true);
create policy "portfolio admin write" on public.portfolio for all
  using (public.is_admin()) with check (public.is_admin());

-- blog_posts:
--   • Public posts (published) are readable by everyone — full row.
--   • Member-only posts (published) require an authenticated session for the body.
--   • Drafts are admin-only.
-- Preview excerpts for locked posts are served via the `blog_previews` view below.
create policy "blog public posts"  on public.blog_posts for select
  using (status = 'published' and is_public = true);
create policy "blog member posts"  on public.blog_posts for select
  using (status = 'published' and auth.uid() is not null);
create policy "blog admin all"     on public.blog_posts for select using (public.is_admin());
create policy "blog admin write"   on public.blog_posts for all
  using (public.is_admin()) with check (public.is_admin());

-- blog_member_content: logged-in members read the exclusive body of published
-- posts; anonymous visitors match nothing and see the gate instead.
create policy "member content authed read" on public.blog_member_content for select
  using (
    auth.uid() is not null
    and exists (
      select 1 from public.blog_posts p
      where p.id = post_id and p.status = 'published'
    )
  );
create policy "member content admin all" on public.blog_member_content for all
  using (public.is_admin()) with check (public.is_admin());
grant select on public.blog_member_content to anon, authenticated;

-- portfolio_collections: world-readable, admin-writable.
create policy "collections public read" on public.portfolio_collections
  for select using (true);
create policy "collections admin write" on public.portfolio_collections
  for all using (public.is_admin()) with check (public.is_admin());
grant select on public.portfolio_collections to anon, authenticated;

-- site_profile + press_kit: world-readable, admin-writable.
create policy "site_profile read"  on public.site_profile for select using (true);
create policy "site_profile write" on public.site_profile for all
  using (public.is_admin()) with check (public.is_admin());

create policy "press_kit read"     on public.press_kit for select using (true);
create policy "press_kit write"    on public.press_kit for all
  using (public.is_admin()) with check (public.is_admin());

-- contact_messages: anyone may submit; only admins may read / update (mark read).
-- (The contact API route uses the service role, which bypasses RLS regardless.)
create policy "contact insert any" on public.contact_messages for insert with check (true);
create policy "contact admin read" on public.contact_messages for select using (public.is_admin());
create policy "contact admin upd"  on public.contact_messages for update
  using (public.is_admin()) with check (public.is_admin());

-- ─── blog_previews view ───────────────────────────────────────────────────────
-- A SECURITY DEFINER view (default) that exposes ONLY non-body columns of
-- published posts. This lets anonymous visitors see the excerpt/teaser of a
-- locked (member-only) post without ever receiving its body.
create view public.blog_previews as
  select id, slug, title, excerpt, cover_image_url, tags, is_public,
         published_at, created_at, has_member_content
  from public.blog_posts
  where status = 'published';

grant select on public.blog_previews to anon, authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
--  Storage buckets
-- ═══════════════════════════════════════════════════════════════════════════
insert into storage.buckets (id, name, public) values
  ('portfolio-images', 'portfolio-images', true),
  ('blog-images',      'blog-images',      true),
  ('avatars',          'avatars',          true),
  ('press-assets',     'press-assets',     false)  -- private: downloads require login
on conflict (id) do nothing;

-- Public read for the public buckets.
create policy "public buckets read" on storage.objects for select
  using (bucket_id in ('portfolio-images', 'blog-images', 'avatars'));

-- Admin write to every bucket.
create policy "admin bucket write" on storage.objects for all
  using (public.is_admin()) with check (public.is_admin());

-- press-assets: any authenticated user (member or admin) may read.
-- This backs the "login required to download press kit" rule. The API route
-- issues short-lived signed URLs only after verifying a session.
create policy "press authed read" on storage.objects for select
  using (bucket_id = 'press-assets' and auth.uid() is not null);
