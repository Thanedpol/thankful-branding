-- ═══════════════════════════════════════════════════════════════════════════
--  Shop — digital downloads + services, paid through Stripe Checkout
--
--  Run this once in Supabase → SQL Editor. Safe to re-run.
--
--  Money is stored in the currency's SMALLEST unit (satang for THB), the same
--  unit Stripe bills in, so no float rounding ever enters a charge. 149000 =
--  ฿1,490.00. Format for humans with formatPrice() in src/lib/shop.ts.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Products ────────────────────────────────────────────────────────────────
create table if not exists public.shop_products (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  -- 'digital' delivers file_path after payment; 'service' is fulfilled by hand.
  kind          text not null default 'digital' check (kind in ('digital', 'service')),
  title         text not null,
  tagline       text,
  description   text,                                  -- rich HTML from the editor
  features      jsonb   not null default '[]'::jsonb,  -- ["ไฟล์ PDF 120 หน้า", …]
  cover_image_url text,
  gallery       jsonb   not null default '[]'::jsonb,  -- [url, …]

  price            integer not null default 0,         -- satang
  compare_at_price integer,                            -- satang; shows a strike-through
  currency         text    not null default 'thb',
  -- 'one_time' → Stripe mode=payment. 'month'/'year' → mode=subscription.
  billing          text    not null default 'one_time'
                     check (billing in ('one_time', 'month', 'year')),

  file_path     text,        -- object path in the private 'shop-files' bucket
  external_url  text,        -- sell elsewhere instead (Shopee/LINE) — skips Checkout
  badge         text,        -- "ขายดี" / "ใหม่" / "ลด 40%"
  stock         integer,     -- null = unlimited; 0 = sold out
  sold_count    integer not null default 0,
  delivery_note text,        -- "ส่งลิงก์ดาวน์โหลดทันที" / "ติดต่อกลับใน 24 ชม."

  status        text    not null default 'draft' check (status in ('draft', 'published')),
  featured      boolean not null default false,
  display_order integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists shop_products_listing_idx
  on public.shop_products (status, display_order, created_at desc);

-- ─── Orders ──────────────────────────────────────────────────────────────────
-- Product columns are SNAPSHOTS: an order must still read correctly after the
-- product is renamed, repriced, or deleted.
create table if not exists public.shop_orders (
  id            uuid primary key default gen_random_uuid(),
  order_no      text unique not null,
  product_id    uuid references public.shop_products(id) on delete set null,
  product_title text not null,
  product_kind  text not null,
  unit_price    integer not null,
  quantity      integer not null default 1,
  amount_total  integer not null,
  currency      text    not null default 'thb',

  buyer_name    text,
  buyer_email   text not null,
  buyer_phone   text,
  note          text,        -- what the buyer told you at checkout

  status        text not null default 'pending'
                  check (status in ('pending', 'paid', 'fulfilled', 'cancelled', 'refunded')),

  stripe_session_id      text unique,
  stripe_payment_intent  text,
  stripe_subscription_id text,

  -- Digital delivery. The token is the download URL's only secret, so it is
  -- generated at payment time and expires — never at product creation.
  download_token      uuid,
  download_count      integer not null default 0,
  download_limit      integer not null default 5,
  download_expires_at timestamptz,

  paid_at       timestamptz,
  fulfilled_at  timestamptz,
  admin_note    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists shop_orders_recent_idx  on public.shop_orders (created_at desc);
create index if not exists shop_orders_status_idx  on public.shop_orders (status);
create unique index if not exists shop_orders_token_idx
  on public.shop_orders (download_token) where download_token is not null;

-- ═══════════════════════════════════════════════════════════════════════════
--  Row Level Security
-- ═══════════════════════════════════════════════════════════════════════════
alter table public.shop_products enable row level security;
alter table public.shop_orders   enable row level security;

-- Products: the world sees published rows; drafts are admin-only.
drop policy if exists "shop products public read" on public.shop_products;
create policy "shop products public read" on public.shop_products
  for select using (status = 'published');

drop policy if exists "shop products admin all" on public.shop_products;
create policy "shop products admin all" on public.shop_products
  for all using (public.is_admin()) with check (public.is_admin());

-- Orders: NO public policy of any kind. They hold buyer emails and download
-- tokens, so the only readers are the admin and the service-role key used by
-- the checkout route, the Stripe webhook, and the download route.
drop policy if exists "shop orders admin all" on public.shop_orders;
create policy "shop orders admin all" on public.shop_orders
  for all using (public.is_admin()) with check (public.is_admin());

-- ═══════════════════════════════════════════════════════════════════════════
--  Storage
-- ═══════════════════════════════════════════════════════════════════════════
insert into storage.buckets (id, name, public) values
  ('shop-images', 'shop-images', true),
  ('shop-files',  'shop-files',  false)   -- private: paid downloads only
on conflict (id) do nothing;

-- Product photos are public, like the other image buckets.
drop policy if exists "shop images public read" on storage.objects;
create policy "shop images public read" on storage.objects
  for select using (bucket_id = 'shop-images');

-- No read policy for 'shop-files' on purpose. Buyers never touch the bucket
-- directly — /api/shop/download/[token] checks the order, then hands out a
-- short-lived signed URL minted with the service-role key.
