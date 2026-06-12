-- ═══════════════════════════════════════════════════════════════════════════
--  Seed data — run AFTER schema.sql.
--
--  ⚠️  ADMIN ACCOUNT (Thank only):
--  There is NO admin self-registration. Create the single admin like this:
--    1. Supabase Dashboard → Authentication → Users → "Add user"
--       email: thank@example.com   (set a strong password, confirm email = true)
--    2. The on_auth_user_created trigger inserts a profile with role 'member'.
--    3. Run the UPDATE below to promote that one account to 'admin'.
--  Repeat the UPDATE for no one else, ever.
-- ═══════════════════════════════════════════════════════════════════════════

-- Promote the seeded admin (change the email to match the user you created):
update public.profiles
  set role = 'admin'
  where email = 'thank@example.com';

-- ─── Singleton rows ────────────────────────────────────────────────────────
insert into public.site_profile (id, name, headline, long_bio, social_links)
values (
  1,
  'Thank Thanedpol',
  'AI Engineer & Researcher — building intelligent systems from the future',
  'I design and ship AI systems at the intersection of research and product. My work spans large language models, autonomous agents, and human-centred machine intelligence. I believe the most powerful technology feels inevitable — quiet, precise, and a little bit like science fiction.',
  '{"github":"https://github.com/","linkedin":"https://linkedin.com/in/","x":"https://x.com/","email":"thank@example.com"}'::jsonb
)
on conflict (id) do update set
  name = excluded.name, headline = excluded.headline,
  long_bio = excluded.long_bio, social_links = excluded.social_links;

insert into public.press_kit (id, short_bio, long_bio, awards, media_contact_email, logo_files)
values (
  1,
  'Thank Thanedpol is an AI engineer and researcher working at the frontier of applied machine intelligence.',
  'Thank Thanedpol is an AI engineer and researcher. His work focuses on large language models, autonomous agents, and the design of AI systems that augment human capability. He speaks and writes about the future of intelligent software.',
  array['Featured Speaker — AI Frontiers 2025', 'Top AI Builder Award 2024'],
  'press@example.com',
  '[]'::jsonb
)
on conflict (id) do nothing;

-- ─── Sample portfolio projects ───────────────────────────────────────────────
insert into public.portfolio (title, description, tech_tags, category, featured, display_order, thumbnail_url, project_url) values
  ('Neural Agent Orchestrator', 'A multi-agent runtime that coordinates autonomous LLM workers across long-horizon tasks.', array['TypeScript','LangGraph','Postgres'], 'AI', true, 1, 'https://picsum.photos/seed/agent/800/600', 'https://example.com'),
  ('Synaptic — Realtime ML Dashboard', 'Streaming inference observability with sub-second latency visualisation.', array['Next.js','WebGL','Rust'], 'Web', true, 2, 'https://picsum.photos/seed/synaptic/800/600', 'https://example.com'),
  ('Glitch UI Kit', 'A cyberpunk design system with motion primitives and shader-driven components.', array['Figma','Framer','GLSL'], 'Design', true, 3, 'https://picsum.photos/seed/glitch/800/600', 'https://example.com'),
  ('Vision Transformer Playground', 'Interactive notebook for probing attention maps in vision transformers.', array['Python','PyTorch','Jupyter'], 'AI', true, 4, 'https://picsum.photos/seed/vit/800/600', 'https://example.com'),
  ('Quantum Notes', 'A research-grade note tool with bidirectional links and local-first sync.', array['Svelte','SQLite','CRDT'], 'Web', true, 5, 'https://picsum.photos/seed/quantum/800/600', 'https://example.com'),
  ('Aurora Render Engine', 'Experimental WebGPU renderer for volumetric sci-fi environments.', array['WebGPU','WGSL','TypeScript'], 'Other', true, 6, 'https://picsum.photos/seed/aurora/800/600', 'https://example.com');

-- ─── Real video-editor work ───────────────────────────────────────────────────
insert into public.portfolio (title, description, tech_tags, category, featured, display_order, thumbnail_url, project_url) values
  ('Video Editor — Y.E.M. Young Executive Management', 'Internship social activity at Y.E.M. Young Executive Management (Allianz Ayudhya). Video editor for content on practical life skills — capturing the internship atmosphere and interviews.', array['Video Editing','Storytelling','Social Content'], 'Design', true, 1, '/portfolio/yem-internship.jpg', 'https://fb.watch/q7dPzSPYiK/'),
  ('Siam Global Group — SUMO Service', 'End-to-end video production for SUMO tool-repair content, pre to post. Lighting setup (brightness & angle), camera framing, set & background dressing, briefing technicians on script & storytelling, scene-by-scene shooting, editing in CapCut, and publishing to TikTok with captions and post copy.', array['CapCut','TikTok','Videography','Lighting'], 'Design', true, 2, '/portfolio/sumo-service.jpg', null);

-- ─── Sample blog posts ────────────────────────────────────────────────────────
insert into public.blog_posts (title, slug, excerpt, body, tags, is_public, status, published_at, cover_image_url) values
  ('Why Agents Beat Pipelines', 'why-agents-beat-pipelines',
   'A practical look at why autonomous agent loops outperform rigid pipelines for open-ended work.',
   '<p>Pipelines assume you know the shape of the problem in advance. Agents do not...</p><p>This is a public post — anyone can read the full body.</p>',
   array['AI','Agents'], true, 'published', now(), 'https://picsum.photos/seed/post1/1200/630'),
  ('The Hidden Cost of Context Windows', 'hidden-cost-of-context-windows',
   'Members-only deep dive into the economics of long-context inference and how to budget tokens.',
   '<p>This is an EXCLUSIVE member-only post. The excerpt is visible to everyone, but the full body is locked behind login...</p><p>Here is the privileged analysis members paid attention for.</p>',
   array['AI','Economics'], false, 'published', now(), 'https://picsum.photos/seed/post2/1200/630'),
  ('Designing Interfaces for the Year 2049', 'interfaces-2049',
   'How sci-fi aesthetics inform real product decisions — and where they break down.',
   '<p>Cyberpunk UI looks great in trailers. Shipping it is another matter...</p>',
   array['Design','Future'], true, 'published', now(), 'https://picsum.photos/seed/post3/1200/630');
