-- ═══════════════════════════════════════════════════════════════════════════
--  Add the two Video Editor projects to the portfolio.
--  Run this ONCE in the Supabase SQL Editor on a DB that already has schema.sql.
--  After running, both projects are fully editable from the Admin → Portfolio tab.
--
--  Thumbnails point to local files in /public/portfolio/. Either:
--    (a) keep the /portfolio/*.jpg paths and commit the images to public/portfolio/, OR
--    (b) upload the images to the 'portfolio-images' Storage bucket and replace
--        thumbnail_url below (and in Admin) with the public URL.
-- ═══════════════════════════════════════════════════════════════════════════

insert into public.portfolio
  (title, description, tech_tags, category, featured, display_order, thumbnail_url, project_url)
values
  (
    'Video Editor — Y.E.M. Young Executive Management',
    'Internship social activity at Y.E.M. Young Executive Management (Allianz Ayudhya). Video editor for content on practical life skills — capturing the internship atmosphere and interviews.',
    array['Video Editing', 'Storytelling', 'Social Content'],
    'Video', true, 1,
    '/portfolio/yem-internship.svg',
    'https://fb.watch/q7dPzSPYiK/'
  ),
  (
    'Siam Global Group — SUMO Service',
    'End-to-end video production for SUMO tool-repair content, pre to post. Lighting setup (brightness & angle), camera framing, set & background dressing, briefing technicians on script & storytelling, scene-by-scene shooting, editing in CapCut, and publishing to TikTok with captions and post copy.',
    array['CapCut', 'TikTok', 'Videography', 'Lighting'],
    'Video', true, 2,
    '/portfolio/sumo-service.svg',
    null
  );
