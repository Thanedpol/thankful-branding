# Portfolio thumbnails

Drop the project thumbnail images here. The portfolio entries reference them by
filename, so the names must match exactly:

| File name              | Used by project                                  |
| ---------------------- | ------------------------------------------------ |
| `yem-internship.jpg`   | Video Editor — Y.E.M. Young Executive Management  |
| `sumo-service.jpg`     | Siam Global Group — SUMO Service                  |

These resolve to `/portfolio/yem-internship.jpg` and `/portfolio/sumo-service.jpg`
(Next.js serves everything in `public/` from the site root).

`.jpg` is assumed — if you save them as `.png`, update the `thumbnail_url` to
`.png` in the Admin → Portfolio editor (and in `supabase/add-video-work.sql`
/ `src/lib/demo-data.ts`).

You can also skip local files entirely: upload each image in the Supabase
**Storage → portfolio-images** bucket and paste its public URL into the
Admin → Portfolio thumbnail field instead.
