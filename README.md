# Thank Thanedpol — AI · Business · Sci & Tech News Blog

A dark Sci-Fi / cyberpunk site for **Thank Thanedpol**, a content creator sharing
**AI, Business, and Science & Technology** news across Thailand and worldwide.
It's a self-hosted blog + portfolio + press kit with a built-in admin console —
built with **Next.js (App Router) + Supabase + Claude + Resend**.

```
Reader   → read news posts (TH / EN / 简体中文), portfolio, press kit, contact
Member   → register / login → read members-only posts + download press assets
Admin    → /admin console (Thank only) → write posts, see analytics, manage everything
```

**Live:** the blog auto-translates each post to English and Simplified Chinese,
counts views, and reports its own traffic analytics — all self-built, no third party.

---

## 1. Highlights

- **News blog** — rich-text posts with cover images, tags, category filters, search,
  author byline, and live view counts. Optional **members-only** sections (freemium).
- **AI translation** — each post's title/excerpt/body is translated by **Claude
  (`claude-opus-4-8`)** into **English** and **Simplified Chinese (简体)**; readers
  switch language and the content follows, falling back to Thai when untranslated.
- **Self-built analytics** — a Jetpack-style dashboard: total / today / 7-day /
  30-day views, unique visitors, a trend chart with selectable ranges
  (1 day → 1 year + custom), top posts, and referrer / country breakdowns.
  Privacy-first (daily-salted visitor hash, no third-party trackers).
- **Portfolio + collections** — project cards plus editable case-study pages.
- **Press kit** — bios, logos, awards, and a login-gated downloadable kit.
- **Trilingual UI** — Thai / English / 中文 with a live language switcher.
- **Admin console** — passcode-gated dashboard with search across Blog / Portfolio /
  Collections, a CV manager, and image/file uploads.

---

## 2. Stack

| Layer        | Tech                                                            |
| ------------ | -------------------------------------------------------------- |
| Framework    | Next.js 15 (App Router, Server Actions, RSC)                   |
| Styling      | Tailwind CSS 3 + a custom cyberpunk design system              |
| Fonts        | Space Grotesk · Inter · Share Tech Mono · Noto Sans Thai / SC  |
| Auth + DB    | Supabase (Postgres, Auth, Storage, RLS)                        |
| AI           | Anthropic Claude (`claude-opus-4-8`) — blog translation        |
| Email        | Resend (contact-form notifications)                            |
| Editor       | TipTap (rich text)                                             |

---

## 3. Setup

### a. Install

```bash
npm install
```

### b. Create a Supabase project

Go to <https://supabase.com> → New project → **Project Settings → API** and copy the
URL, the `anon` key, and the `service_role` key.

### c. Run the database migrations

In **Supabase → SQL Editor**, run these in order (each file is safe to re-run):

| Order | File | What it adds |
| ----- | ---- | ------------ |
| 1 | `supabase/schema.sql` | Core tables, enums, RLS, role trigger, storage buckets |
| 2 | `supabase/seed.sql` | Sample content + singleton rows + the admin-promote statement |
| 3 | `supabase/add-member-content.sql` | Members-only blog continuation (freemium) |
| 4 | `supabase/add-portfolio-collections.sql` | Editable case-study collection pages |
| 5 | `supabase/add-video-work.sql` + `migrate-video-category.sql` | Video portfolio category |
| 6 | `supabase/add-blog-analytics.sql` | View tracking, counters, analytics RPCs |
| 7 | `supabase/add-analytics-ranges.sql` | Range + bucket-aware analytics functions |
| 8 | `supabase/add-cv-links.sql` | CV / résumé links on the site profile |
| 9 | `supabase/add-blog-translations.sql` | Storage for AI translations (EN + 简体) |

### d. Create the single admin

There is **no admin self-registration** — by design.

1. **Supabase → Authentication → Users → Add user** — set an email + strong password, confirm it.
2. The `on_auth_user_created` trigger inserts a `profiles` row with role `member`.
3. In **SQL Editor**, promote that one account (already in `seed.sql`):
   ```sql
   update public.profiles set role = 'admin' where email = 'you@example.com';
   ```
   Run this for **no one else, ever.** Every public registration stays `member`.

> The admin dashboard itself is unlocked by a separate **`ADMIN_PASSCODE`** (below),
> not by Supabase login.

### e. Environment variables

```bash
cp .env.example .env.local
```

```ini
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...          # server only — never exposed
ADMIN_PASSCODE=change-me               # unlocks /admin
ANTHROPIC_API_KEY=sk-ant-...           # AI blog translation (optional — posts stay TH without it)
RESEND_API_KEY=...                     # optional locally; email is skipped if unset
CONTACT_FROM_EMAIL=onboarding@resend.dev
CONTACT_NOTIFY_EMAIL=you@example.com   # where contact submissions are emailed
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### f. Run

```bash
npm run dev
```

- Public site → <http://localhost:3000>
- Admin console → <http://localhost:3000/admin> (redirects to `/admin/login`)

---

## 4. How the key features work

### Blog views & analytics
A per-session browser beacon hits `/api/blog-view`, which records one row in
`blog_views` (service-role only, with a 30-minute dedup and a privacy-preserving
visitor hash) and a trigger keeps a fast `view_count` on each post. The
**Analytics** admin tab aggregates it via SQL RPCs — no third-party tracker.

### AI translation
On save (and via the per-post **🌐 แปล** button), `/api/translate-post` sends the
post to Claude, which returns a friendly, terminology-correct translation into
English and **Simplified Chinese** with the HTML preserved. Results are cached on
the post and re-run only when the source changes. Readers get the version matching
the language switcher, falling back to Thai.

### Access rules

| Rule | Where |
| ---- | ----- |
| `/admin/*` requires the admin passcode | [`middleware.ts`](middleware.ts) + `(dashboard)/layout.tsx` (defense in depth) |
| Public registration = **member** only, never admin | DB trigger `handle_new_user()` + RLS |
| Members-only post body hidden from anon; excerpt visible to all | RLS on `blog_posts` + the `blog_previews` view |
| Press downloads require login | [`/api/press-download`](src/app/api/press-download/route.ts) → signed URL, private bucket |
| Contact form → saved + emails admin | [`/api/contact`](src/app/api/contact/route.ts) + [`lib/email.ts`](src/lib/email.ts) |

> **Security note:** `blog_previews` is a SECURITY DEFINER view exposing only
> non-body columns (and translated title/excerpt only), so an anonymous visitor sees
> a locked post's teaser but never its body.

---

## 5. Storage buckets

`schema.sql` creates four buckets:

| Bucket             | Public | Use                                   |
| ------------------ | ------ | ------------------------------------- |
| `portfolio-images` | ✅      | project thumbnails                    |
| `blog-images`      | ✅      | post cover images                     |
| `avatars`          | ✅      | profile / headshot / CV uploads       |
| `press-assets`     | ❌      | press kit PDF + logos (login to grab) |

Upload images in the admin forms (or paste any allowed external URL — hosts are in
`next.config.mjs`). Press assets store an **object path** and are signed for
logged-in users via `/api/press-download`.

---

## 6. Deploy (Vercel)

1. Push to GitHub, import into Vercel.
2. Add **all** env vars from `.env.local` to the Vercel project — including
   `ANTHROPIC_API_KEY` (translation runs server-side) — and set `NEXT_PUBLIC_SITE_URL`
   to your production URL. Redeploy after adding new env vars.
3. In **Supabase → Authentication → URL Configuration**, add your production domain
   to the redirect allow-list (`https://yourdomain.com/auth/callback`).
4. Deploy. Pushing to `main` auto-deploys.

---

## 7. Design system

- **Background** `#050508` · **cyan** `#00F5FF` · **purple** `#7B2FFF` · **muted** `#8892A4`
- Glassmorphism cards (`.glass`), neon hover glow (`.glass-hover`)
- Hero: animated particle field + floating grid + a one-shot **glitch** on the name
- Scroll reveals via IntersectionObserver; all motion respects `prefers-reduced-motion`

Tokens live in [`tailwind.config.ts`](tailwind.config.ts) and [`globals.css`](src/app/globals.css).
