# Thank Thanedpol — Personal Brand Portfolio

A dark Sci-Fi / cyberpunk personal brand site for **Thank Thanedpol** — AI engineer & researcher.
Built with **Next.js (App Router) + Supabase + Resend**.

```
Visitor  → portfolio, blog, press kit, contact
Member   → register/login → read exclusive blog + download press assets
Admin    → /admin dashboard (Thank only — seeded, no signup) → full content control
```

---

## 1. Stack

| Layer        | Tech                                              |
| ------------ | ------------------------------------------------- |
| Framework    | Next.js 15 (App Router, Server Actions, RSC)      |
| Styling      | Tailwind CSS 3 + custom cyberpunk design system   |
| Fonts        | Space Grotesk (display) · Inter (body) · Share Tech Mono (code) |
| Auth + DB    | Supabase (Postgres, Auth, Storage, RLS)           |
| Email        | Resend (contact form notifications)               |

---

## 2. Setup

### a. Install dependencies

```bash
npm install
```

### b. Create a Supabase project

1. Go to <https://supabase.com> → New project.
2. **Project Settings → API** — copy the URL, the `anon` key, and the `service_role` key.

### c. Run the database schema

Open **Supabase → SQL Editor** and run, in order:

1. `supabase/schema.sql`  — tables, enums, RLS policies, role trigger, storage buckets.
2. `supabase/seed.sql`    — sample portfolio/blog + singleton rows + admin-promote statement.

### d. Create the single admin (Thank)

There is **no admin self-registration** — by design. Create the one admin manually:

1. **Supabase → Authentication → Users → Add user**
   - Email: e.g. `thank@example.com`  · set a strong password · *confirm email*.
2. The `on_auth_user_created` trigger inserts a `profiles` row with role `member`.
3. In **SQL Editor**, promote that one account (already in `seed.sql`):
   ```sql
   update public.profiles set role = 'admin' where email = 'thank@example.com';
   ```
   Run this for **no one else, ever.** Every public registration stays `member`.

### e. Environment variables

```bash
cp .env.example .env.local
```

Fill in:

```ini
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...          # server only — never exposed
RESEND_API_KEY=...                     # optional locally; email is skipped if unset
CONTACT_FROM_EMAIL=onboarding@resend.dev
CONTACT_NOTIFY_EMAIL=thank@example.com # where contact submissions are emailed
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### f. Run

```bash
npm run dev
```

- Public site → <http://localhost:3000>
- Admin console → <http://localhost:3000/admin> (hidden; redirects to `/admin/login`)

---

## 3. How the rules are enforced

| Rule | Where |
| ---- | ----- |
| `/admin/*` requires an authenticated **admin** | [`middleware.ts`](middleware.ts) + [`(dashboard)/layout.tsx`](src/app/admin/\(dashboard\)/layout.tsx) (defense in depth) |
| Public registration = **member** only, never admin | DB trigger `handle_new_user()` + RLS (no client role writes) |
| Press downloads require login | [`/api/press-download`](src/app/api/press-download/route.ts) checks session → signed URL; bucket is private |
| Member-only blog body hidden from anon, excerpt visible to all | RLS on `blog_posts` + `blog_previews` view ([`schema.sql`](supabase/schema.sql)) |
| Featured portfolio on homepage (max 6, ordered) | query in [`page.tsx`](src/app/page.tsx) |
| Contact form → saved + emails admin | [`/api/contact`](src/app/api/contact/route.ts) + [`lib/email.ts`](src/lib/email.ts) |

> **Security note:** the `blog_previews` view is a SECURITY DEFINER view exposing only
> non-body columns, so an anonymous visitor can see a locked post's excerpt but can
> never receive its body. The full row is returned by RLS only when the post is public
> or the requester is logged in.

---

## 4. Storage buckets

`schema.sql` creates four buckets:

| Bucket             | Public | Use                                   |
| ------------------ | ------ | ------------------------------------- |
| `portfolio-images` | ✅      | project thumbnails                    |
| `blog-images`      | ✅      | post cover images                     |
| `avatars`          | ✅      | profile / headshot                    |
| `press-assets`     | ❌      | press kit PDF + logos (login to grab) |

For press assets, store the **object path** (e.g. `kit/press-kit.pdf`) in the admin
Press Kit form. Upload the files to the `press-assets` bucket via the Supabase
dashboard. Downloads route through `/api/press-download` which signs them for
logged-in users only.

You can upload images to the public buckets and paste their public URLs into the
admin forms, or use any external image URL (allowed hosts are in `next.config.mjs`).

---

## 5. Deploy (Vercel)

1. Push to GitHub, import into Vercel.
2. Add all env vars from `.env.local` to the Vercel project (set `NEXT_PUBLIC_SITE_URL`
   to your production URL).
3. In **Supabase → Authentication → URL Configuration**, add your production domain to
   the redirect allow-list (`https://yourdomain.com/auth/callback`).
4. Deploy.

---

## 6. Design system

- **Background** `#050508` · **cyan** `#00F5FF` · **purple** `#7B2FFF` · **muted** `#8892A4`
- Glassmorphism cards (`.glass`), neon hover glow (`.glass-hover`)
- Hero: animated particle field + floating grid + one-shot **glitch** on the name
- Scroll reveals (`Reveal` / IntersectionObserver), all motion respects `prefers-reduced-motion`

Tokens live in [`tailwind.config.ts`](tailwind.config.ts) and [`globals.css`](src/app/globals.css).
