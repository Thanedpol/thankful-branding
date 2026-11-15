# SEO Change Log

| Date | URL | Change | Expected effect | Verified |
|---|---|---|---|---|
| 2026-11-15 | / | One JSON-LD `@graph`: WebPage `#webpage` (dateModified, speakable), WebSite `#website`, Person `#person` (8 sameAs incl. LinkedIn), Organization `#brand` (sameAs YouTube + TikTok), FAQPage `#faq` | Engines merge the person, brand and site into one entity; fixes "sameAs 1, @id 1, no author, no date" | Rendered HTML parsed: 6 nodes, ids linked |
| 2026-11-15 | / | 44-word answer-first passage `#who-is-thank` in About (TH/EN/ZH); first `<p>` is now the tagline, not the one-word label | Quotable answer to "who is Thank Thanedpol"; fixes Passage Citability | Rendered HTML: passage present, 44 words |
| 2026-11-15 | /#faq | Visible FAQ (6 Q&A, server-rendered `<details>`) matching FAQPage schema; corrected the contact answer (no contact form is rendered) | Schema matches visible text; more citable passages | Screenshot checked |
| 2026-11-15 | /about | New fact page: TH + EN passage, facts table, 8 YouTube series, 9 certificates, profiles (`rel="me"`), hire/contact; AboutPage schema | A landing page for name queries; About page detected | Screenshot checked; schema parsed |
| 2026-11-15 | /privacy, /terms | New pages written from what the code collects and does; linked from footer | Trust pages detected; required for accounts and shop | Screenshot checked |
| 2026-11-15 | all | Footer: About → /about, FAQ, Privacy, Terms; LinkedIn and GitHub fallbacks with `rel="me"` | Every page links the trust pages and profiles | Rendered HTML checked |
| 2026-11-15 | /blog/* | Byline links to /about with `rel="author"`; BlogPosting author/publisher reference `#person` | Author entity on every article | Typecheck + build |
| 2026-11-15 | /robots.txt | Named Applebot, meta-webindexer, meta-externalfetcher, Amzn-SearchBot, Amzn-User, MistralAI-Index | Explicit welcome as in Rainmojo's rules | Rendered robots.txt checked |
| 2026-11-15 | /sitemap.xml | Added /about, /privacy, /terms | New pages discovered | Rendered sitemap checked |
| 2026-11-15 | /llms.txt | Added LinkedIn, GitHub, facts page, About and legal links | LLM guide matches the site | Rendered llms.txt checked |
| 2026-11-15 | / | `<time datetime>` on latest-update dates; carousel `role="status"` live region | Freshness signal; fixes DYN-01 | Rendered HTML checked |
