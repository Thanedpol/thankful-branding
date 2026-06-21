# Profile photo

Save your headshot here as **`thank.jpg`** (exact name):

```
public/profile/thank.jpg
```

It appears in the homepage **About** section (the spot that otherwise shows the
"TT" monogram). The site references it at `/profile/thank.jpg`.

- If the file isn't present, the About section gracefully falls back to the
  "TT" placeholder (no broken image).
- Prefer a roughly square crop (1:1) for the best fit.
- `.jpg` is assumed. To use `.png`, save as `thank.png` and update `avatar_url`
  in `src/lib/demo-data.ts` (and via Admin → Profile once Supabase is connected).

You can also set this later from **Admin → Profile → Avatar (upload)** once
Supabase is connected.
