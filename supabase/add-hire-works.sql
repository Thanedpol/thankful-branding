-- ═══════════════════════════════════════════════════════════════════════════
--  Editable sample work for the "รับงาน" section and the /work page.
--  Run once in Supabase → SQL Editor; safe to re-run.
--
--  One row per clip (YouTube or TikTok), edited in Admin → Hire.
--  World-readable except hidden rows; admin-writable. Until this runs the
--  site shows the built-in clips from src/lib/hire.ts.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.hire_works (
  id            uuid primary key default gen_random_uuid(),
  kind          text not null check (kind in ('youtube', 'tiktok')),
  url           text not null,
  video_id      text not null,
  title         text,
  cover_url     text,
  display_order integer not null default 0,
  hidden        boolean not null default false,
  created_at    timestamptz not null default now(),
  unique (kind, video_id)
);

alter table public.hire_works enable row level security;

drop policy if exists "hire_works public read" on public.hire_works;
create policy "hire_works public read" on public.hire_works
  for select using (hidden = false);

drop policy if exists "hire_works admin write" on public.hire_works;
create policy "hire_works admin write" on public.hire_works
  for all using (public.is_admin()) with check (public.is_admin());

grant select on public.hire_works to anon, authenticated;

-- The clips the site shows today, so nothing disappears when this table
-- takes over. Re-running does not duplicate them.
insert into public.hire_works (kind, url, video_id, title, cover_url, display_order) values
  ('youtube', 'https://www.youtube.com/watch?v=JPq_-LxLya0', 'JPq_-LxLya0',
   'AI ทำงาน 1 งาน ราคาแค่กาแฟแก้วเดียว & 20+ Use Case จริง สรุปงาน QwenWork: Out of Office', null, 0),
  ('youtube', 'https://www.youtube.com/watch?v=0kia92uPuVM', '0kia92uPuVM',
   'คนที่ใช้ AI เป็น จะมาแทนคนที่ใช้ AI ไม่เป็น & วิธีทำงาน UXUI เปลี่ยน | สรุปงาน AXONS UXUI Day 2026', null, 1),
  ('youtube', 'https://www.youtube.com/watch?v=3PECrxJ6sOQ', '3PECrxJ6sOQ',
   'ประชากรไทยอาจเหลือครึ่งเดียวใน 50 ปี | สรุป Spotlight Day 2026 เมื่อกติกาโลกถูกเขียนใหม่', null, 2),
  ('youtube', 'https://www.youtube.com/watch?v=uqzxMQN7OO0', 'uqzxMQN7OO0',
   'ค่าไฟไทยแพงกว่าเวียดนาม-อินโดนีเซีย? | สรุป Spotlight Day 2026 ไฟสะอาดคือ ใบอนุญาตส่งออก', null, 3),
  ('tiktok', 'https://www.tiktok.com/@thankful63/video/7699358788184296724', '7699358788184296724',
   'นวัตกรรมแรกของชีพี ไม่ใช่เครื่องจักร | พิธีเปิด CP Innovation Exposition 2026',
   '/hire/tiktok-7699358788184296724.jpg', 4),
  ('tiktok', 'https://www.tiktok.com/@thankful63/video/7710913831660178694', '7710913831660178694',
   'สรุปงาน Adobe MAX 2026 Ep.1',
   '/hire/tiktok-7710913831660178694.jpg', 5),
  ('tiktok', 'https://www.tiktok.com/@thankful63/video/7710920396559682868', '7710920396559682868',
   'สรุปงาน Adobe MAX 2026 Ep.2',
   '/hire/tiktok-7710920396559682868.jpg', 6),
  ('tiktok', 'https://www.tiktok.com/@thankful63/video/7708331767484157190', '7708331767484157190',
   'หุ้น IBM พุ่ง 5% เพราะ Quantum จริงไหม | สรุปงาน SCBX Quantum Outlook 2026 Ep.1',
   '/hire/tiktok-7708331767484157190.jpg', 7),
  ('tiktok', 'https://www.tiktok.com/@thankful63/video/7708360303121255732', '7708360303121255732',
   'ข้อมูลหลุดวันนี้ ถอดรหัสได้วันหน้า ธนาคารรับมือ Quantum ยังไง | SCBX Quantum Outlook 2026 EP.2',
   '/hire/tiktok-7708360303121255732.jpg', 8),
  ('tiktok', 'https://www.tiktok.com/@thankful63/video/7692010001908452629', '7692010001908452629',
   'อีก 2 ปี แบรนด์กว่า 60% จะปล่อย AI ออกไปคุยกับลูกค้าเอง | สรุปงาน MKT CON 2026',
   '/hire/tiktok-7692010001908452629.jpg', 9)
on conflict (kind, video_id) do nothing;
