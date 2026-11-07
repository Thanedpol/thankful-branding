-- Show or hide the Resume buttons above "ผลงานเด่น" on the home page.
-- Off by default. Run once in Supabase → SQL Editor; safe to re-run.
alter table public.site_profile
  add column if not exists show_resume boolean not null default false;
