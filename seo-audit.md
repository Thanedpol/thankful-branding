# SEO / AI Search Audit — thankful-branding.vercel.app (2026-11-15)

Goal (from `seo-brief.md`): AI assistants and Google name and describe Thank Thanedpol correctly as the Thai-language AI & business news creator behind the Thankful YouTube channel, and send more hire inquiries and blog readers.

Scope: every finding in the Rainmojo report (`Thankful 3.pdf`, 14 พ.ย. 2569) plus a review of the code and the rendered HTML. The skill's full 320-item checklist was **not** scored item by item. Areas outside the report (Core Web Vitals, backlinks, rank tracking) are listed under "Cannot verify" with the access they need.

## Baseline (Rainmojo, before this change)

| Area | Score |
|---|---|
| Overall readiness | 77 / 100 |
| Google SEO (crawl, meta, SSR, semantics) | 100 / 100 |
| AI citability (AISO) | 54 / 100 |
| AI agent readiness (static) | 93 / 100 |
| Tech modernity | Grade C (68) — Next.js version not advertised, so currency can't be read |

Per engine (Rainmojo estimate): Meta AI 68% · Claude 66% · Copilot 64% · Apple 53% · Gemini 51% · DeepSeek 42% · ChatGPT 39% · Grok 39% · Perplexity 38% · Qwen 33%.

No Search Console, Bing Webmaster or AI-prompt baseline was available to the agent (see plan, weeks 1–2).

## Checklist

Status: pass · partial · fail · cannot-verify. "Fixed" means fixed in this change (see `seo-changelog.md`).

### Crawl, index, render
- pass — robots.txt allows every documented AI answer bot; `/admin` and `/api` stay private. Evidence: report p.3; `src/app/robots.ts`.
- fixed — bots named in Rainmojo's recommended rules but missing from our explicit list: Applebot, meta-webindexer, meta-externalfetcher, Amzn-SearchBot, Amzn-User, MistralAI-Index. They were already allowed through `*`; now named. `src/app/robots.ts`.
- pass — content is in the server HTML (838 words before this change), title/description/canonical, H1, Open Graph, viewport, crawlable `<a href>` links. Report p.3–4.
- pass — sitemap.xml and llms.txt exist and are valid. Report p.2, p.4.
- fixed — new pages `/about`, `/privacy`, `/terms` added to the sitemap. `src/app/sitemap.ts`.
- cannot-verify — Bing index, IndexNow on Bing's side, Google index state. Needs: Bing Webmaster Tools and Search Console (owner).

### Answer-first passages (AI citability)
- fixed (was fail) — "first paragraph 4 words, 0 paragraphs of 40–80 words". The page's first `<p>` was the one-word label "Thankful". Now the label is a `<div>` and the first paragraph is the tagline (17 words), and the About section carries a 44-word self-contained passage (`#who-is-thank`) answering "who is Thank Thanedpol" with checkable numbers (8 series, 3 languages). Same passage in TH and EN on `/about`, ZH in the Chinese UI. `src/lib/seo.ts` (`WHO_IS_*`), `src/components/About.tsx`, `src/components/Hero.tsx`.
- fixed (was fail) — FAQPage structured data existed but the FAQ wasn't visible on the page. Now a visible, server-rendered FAQ section (`#faq`, 6 questions) matches the schema. `src/components/FaqSection.tsx`.
- fixed — FAQ answer said "contact via the contact form on the website", but no page renders the form. Answer now points to the hire section, email and LinkedIn. `src/lib/seo.ts`.
- partial — blog posts: many have no excerpt (noted in `src/app/llms.txt/route.ts`), so there is no answer-first summary at the top of each article. Owner action (plan, days 31–90).

### Entity trust (schema, sameAs, author)
- fixed (was "ควรแก้") — "Organization schema, sameAs 1 link, no author name, 1 @id node". The brand node had only YouTube in sameAs and the Person node had no `@id`. Now one `@graph` with linked `@id`s: WebPage `/#webpage` → WebSite `/#website` → Person `/#person` → Organization `/#brand`; brand sameAs = YouTube + TikTok (both carry the brand name); Person sameAs = 8 profiles including the LinkedIn the owner confirmed. `src/lib/seo.ts`, `src/app/page.tsx`.
- fixed — author: the WebPage and WebSite now declare `author`; blog bylines link to `/about` with `rel="author"`; footer and `/about` profile links carry `rel="me"`. `src/app/blog/[slug]/page.tsx`, `src/components/Footer.tsx`.
- fixed — no About page detected. New `/about` fact page (names and wrong spellings to avoid, work, YouTube series, 9 certificates, all profiles, contact) with AboutPage schema; the Person node's `mainEntityOfPage` points to it. `src/app/about/page.tsx`.
- fail (off-site) — no Wikidata / Wikipedia entity, no Knowledge Graph panel. Owner action with draft below.
- n/a — X profile: owner has none (confirmed). Grok's X criteria can't be met without one.

### Freshness
- fixed (was "page declares no dates") — homepage WebPage now has `dateModified` = newest episode or article; the latest-updates strip uses `<time datetime>`; `/about`, `/privacy`, `/terms` show a dated "ปรับปรุงล่าสุด". `src/app/page.tsx`, `src/components/LatestUpdates.tsx`.

### Trust pages
- pass — contact (mailto) and blog detected. Report p.3.
- fixed — About, Privacy policy, Terms of use now exist and are linked from the footer. The privacy page describes only what the code collects (accounts, orders via Stripe, contact messages, hashed view counts, theme/language in the browser) and the processors (Vercel, Supabase, Stripe, Resend, YouTube/TikTok embeds). Published on the owner's approval. `src/app/privacy/page.tsx`, `src/app/terms/page.tsx`.
- fixed — FAQ detected on the page (`#faq`), linked from the footer.
- n/a — returns, shipping, pricing pages: digital shop only; the terms page covers delivery by email and order problems. Rainmojo does not deduct for these.

### AI agent readiness
- fixed (was 0/4) — DYN-01 no live region. The social carousel now announces the profile in front through `role="status"`. `src/components/SocialPopBook.tsx`.
- pass — 0 unnamed buttons/links, 0 unlabeled inputs, landmarks complete. Report p.2.

### Speakable / Apple
- fixed — `speakable` (SpeakableSpecification) on the homepage (`#who-is-thank`, `#faq`) and `/about`.

### Multilingual (Qwen: hreflang)
- fail — TH / EN / ZH switch on the same URL in the browser, so there are no language URLs to declare with hreflang. Needs per-language routes (`/en`, `/zh`) — an owner decision, sized in the plan.

### Cannot verify (access needed)
- Core Web Vitals and real speed — Search Console or PageSpeed field data.
- Index coverage, queries, clicks — Search Console (owner grants access or exports).
- Bing index / Copilot visibility — Bing Webmaster Tools.
- Mentions on Reddit, X, press; backlinks — external tools.
- Actual AI answers — the prompt sample below, run by the owner or with access granted.

## Top 10 priorities

1. Answer-first passage + visible FAQ (done).
2. Linked entity graph with full sameAs (done).
3. `/about` fact page (done).
4. Verify the site in Google Search Console and Bing Webmaster Tools, submit the sitemap, request indexing of `/about`.
5. Run the prompt sample (below) once as the baseline.
6. Put the same name spelling and the site URL in every profile bio (YouTube, TikTok, Instagram, both Facebook pages, LinkedIn).
7. Create a Wikidata item, then add its URL to `personJsonLd` sameAs.
8. Add a 40–80-word summary (excerpt) to every blog post, starting with the most-read.
9. Privacy and terms pages (done — owner to read once).
10. Decide on language URLs (hreflang) and on a custom domain.

## Plan

| When | Item | Owner | Done when |
|---|---|---|---|
| Weeks 1–2 | Read `/privacy` and `/terms`; correct anything that doesn't match how you run the shop | Owner | Pages say what you actually do |
| Weeks 1–2 | Search Console: verify, submit `sitemap.xml`, inspect and request indexing for `/`, `/about` | Owner | `/about` shows "URL is on Google" |
| Weeks 1–2 | Bing Webmaster Tools: import from Search Console, submit sitemap | Owner | Sitemap status "Success" |
| Weeks 1–2 | Prompt sample: run the 12 prompts below in ChatGPT, Gemini, Perplexity, Claude, Copilot; note whether Thank is named, spelled right, and which sources are cited | Owner (or agent with access) | Baseline table saved |
| Weeks 1–2 | Re-run the Rainmojo report | Owner | New scores recorded here |
| Weeks 3–4 | Same name spelling + site URL in every profile bio | Owner | All 7 profiles link back |
| Weeks 3–4 | Wikidata item (draft below); then send the Q-id to add to sameAs | Owner → Agent | Item live; sameAs updated |
| Days 31–90 | Excerpt (40–80 words, answer-first) on every post via Admin | Owner (agent can draft) | No post without excerpt |
| Days 31–90 | Decide: per-language URLs for hreflang; custom domain | Owner | Decision recorded |
| Monthly | Re-run prompt sample and Rainmojo; log changes | Owner / Agent | Row added to changelog |

Next check date: 2026-12-15.

## Prompt sample (run each in every assistant, new chat, logged out where possible)

1. Thank Thanedpol คือใคร
2. ธเนศพล เดชาดวงสกุล ทำงานอะไร
3. คุณแต้ง ช่อง YouTube Thankful2026
4. Who is Thank Thanedpol?
5. ครีเอเตอร์เล่าข่าว AI ภาษาไทย แนะนำใครบ้าง
6. ช่อง YouTube สรุปข่าว AI ภาษาไทยรายสัปดาห์
7. AI ฉับไว News คือรายการอะไร
8. Physical AI & Robotics News ภาษาไทย
9. จ้างทำคอนเทนต์ข่าว AI ภาษาไทย ติดต่อใคร
10. Thank Thanedpol Insightist
11. Thankful Branding website
12. Thanedpol Dechaduangsakul LinkedIn

## Wikidata draft (for the owner to create)

- Label (th): ธเนศพล เดชาดวงสกุล · Label (en): Thanedpol Dechaduangsakul
- Also known as: Thank Thanedpol; คุณแต้ง
- Description (th): คอนเทนต์ครีเอเตอร์ข่าว AI และธุรกิจชาวไทย · (en): Thai AI and business news content creator
- instance of (P31): human (Q5)
- occupation (P106): content creator
- employer (P108): Insightist AI Transformation Thailand — only if an item exists
- official website (P856): https://thankful-branding.vercel.app/
- YouTube channel ID (P2397), TikTok username (P7085): thankful63, Instagram username (P2003): newerathank, LinkedIn personal profile ID (P6634): thanedpol-dechaduangsakul-64b9b5137
- Wikidata needs references; cite the site's `/about` page and an independent source (press, event page) if one exists, or the item may be deleted.

## Follow-up 2026-11-15 (second pass)

- How Rainmojo counts words: its "first paragraph 4 words" matches the old pillars line "AI · SCIENCE · BUSINESS · TECHNOLOGY" only under a letter-run or dictionary word count, not whitespace. Thai paragraphs were therefore measured with both `\p{L}+` runs and `Intl.Segmenter` and written to land in 40–80 under both. Result on the home page: 6 qualifying paragraphs (was 0).
- fixed — comparison table: the 8 YouTube series compared by group, topic, latest episode and date (`#series-compare`).
- corrected — the site claimed articles are readable in 3 languages. The database has no `translations` column (the migration `supabase/add-blog-translations.sql` was never run), so every article shows in Thai. All passages, the FAQ, /about, /terms, llms.txt and the Blog schema now say articles are in Thai and the interface switches language. If the migration is run and posts are translated, these can say 3 languages again.
- CDN / proxy note ("ตรวจพบ CDN หรือพร็อกซีอยู่หน้า host"): the headers `Server: Vercel`, `X-Vercel-Cache`, `Age` come from Vercel's edge network, which serves every page. It cannot be removed while the site is on Vercel and should not be: it is what makes the site fast. Rainmojo only lowers its confidence in header-based modernity checks to "inferred"; its report states this section is not a security or ranking check. What could be improved was done: the framework was updated, and the page now declares dates (the "content freshness" item).
