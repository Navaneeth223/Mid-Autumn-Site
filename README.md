# For Ames 🌕 — a Mid-Autumn gift site

A single-page, mobile-first, scroll-driven website: a mooncake formed from
light, warmth, and a little friendship — built as a personal Mid-Autumn
Festival gift from **Navi** to **Ames**.

## The journey

1. **Loader** — a quiet night sky (twinkling stars, drifting gold dust) with a
   thin golden arc that fills smoothly around a breathing vignette: the jade
   rabbit pounding the elixir beneath a full moon. Progress is lerped in a rAF
   loop and written straight to the DOM, so nothing pops even when assets
   arrive unevenly. Scroll is locked until everything is ready.
2. **Hero** — bilingual greeting addressed to Ames, glowing moon, swaying
   paper lantern, twinkling stars, "scroll to begin".
3. **The formation (pinned scroll scrub)** — 121 video frames drawn 1:1 onto
   a `<canvas>` tied to scroll: particles swirl, petals ring, the cake
   condenses out of light and settles. Scroll back up = it dissolves again.
4. **Pop-out** — the 2D canvas crossfades into the real 3D mooncake
   (Three.js), positioned exactly where the flat cake sat in the last frame.
5. **Hands-on 3D viewer + easter eggs** — the cake swells to hero size,
   settles into a 3/4 pose, and parks (no auto-wander). From here it's a
   product viewer you can really play with:
   - **drag** → trackball spin — any axis, flip it over and see the bottom
   - **two-finger drag** (or Shift/right-drag on desktop) → move it anywhere;
     it springs home on release
   - **pinch / mouse wheel** → zoom in and out (0.55×–2.6×)
   - **two-finger twist** → roll around the view axis
   - **double-tap / double-click** → reset the view; the idle turntable
     resumes on its own whenever you let go
   - **tap the moon** → Chang'e fades in with the elixir legend (tap again to dismiss)
   - **the jade rabbit** hops in from a random corner and pounds its pestle —
     tap it for a burst of gold osmanthus petals
   - **press & hold the mooncake** → a cross-section appears: round = reunion,
     the golden yolk = the full moon itself
   - a slim journey rail on the right edge tracks progress (gold fill +
     glowing tip + live percentage)
6. **Closing** — a message signed "— Navi", under the thousand-year-old Su Shi
   line 但愿人长久，千里共婵娟, with petals still drifting.

Themes **dawn / dusk / night** auto-select by the visitor's clock (5–11 / 11–19
/ 19–5) and can be cycled manually (corner button). **EN / 中文** toggle
switches all copy. Choices persist in localStorage.

## Stack

Vite + React 19 · Three.js · GSAP ScrollTrigger · Tailwind CSS v4 · plain JSON
locales. Everything free/open-source.

## Run it

```bash
npm install
npm run dev      # prints LAN URLs — open on a real phone, not just a resized window
npm run build    # production build in dist/
npm run preview  # serve the production build locally
node scripts/smoke.mjs   # serves dist/, drives the whole journey (both
                         # viewports), fails on ANY console error, and saves
                         # screenshots to _shots/
```

## Make it yours (do this before sending the link)

All personal words live in **two JSON files** — edit the same keys in both:

| File | Key | What it is |
|---|---|---|
| `public/locales/en.json` | `hero.personal` | the line addressed to Ames on the hero |
| `public/locales/en.json` | `closing.message` | the closing message (a light burger-and-cola nod is baked in — keep, change, or delete it) |
| `public/locales/zh.json` | same keys | the Chinese versions |

Also worth knowing:

- **Page title**: `<title>` in `index.html` (currently `For Ames 🌕`).
- **Names**: "Ames" / "Navi" are names — they stay in Latin letters in both
  language modes, by design.
- **3D cake / moon hotspot placement and stage timing** live in
  `src/lib/config.js` (`CAKE_ANCHOR`, `MOON_ANCHOR`, `TL`, `PIN_DISTANCE_VH`).
- **All copy**: `public/locales/*.json`. Nothing else needs touching to
  reword the site.

## How the assets were made (and how to regenerate)

- `public/frames/` — the "swirling formation" video (Variant B), extracted at
  its native 24fps with the Kling watermark cropped away, re-mastered at 2×
  (1440px, webp q84) so the scrub stays crisp on high-dpr phones:

  ```bash
  ffmpeg -i kling_..._Swirling.mp4 -vf "crop=1920:980:0:0,scale=1440:736:flags=lanczos" \
         -c:v libwebp -quality 84 -compression_level 5 public/frames/frame_%04d.webp
  ```

- `public/images/closing-bg.webp` (and the optional `poster-hero.webp`) —
  stills from the "rotation" video (Variant A), same watermark crop:

  ```bash
  ffmpeg -ss 3.55 -i kling_..._VIDEO_A.mp4 -frames:v 1 \
         -vf "crop=1920:980:0:0,scale=1600:-2" -c:v libwebp -quality 85 poster-hero.webp
  ```

- `public/models/mooncake.glb` — the Meshy model, Draco-compressed with
  webp textures (8.79 MB → ~0.6 MB): `npm run optimize:model`

- The favicon is a crop of the cake from Variant A + a hand-made SVG mini
  mooncake (`public/images/favicon.svg`).

If you ever swap the videos, re-run the ffmpeg commands above and keep the
output names/paths identical — the site reads `public/frames/frame_0001.webp …`
and `FRAMES.count` in `src/lib/config.js`.

## Performance notes (the rules the build follows)

- Frames are ~3 MB total (1440px webp q84); the model ~0.6 MB; nothing blocks
  first paint (inline critical CSS + pre-paint theme script).
- The scrub only redraws when the frame index changes; the 2D canvas dpr is
  capped at 2, the 3D renderer at 2.5 (with ACES tone mapping + anisotropic
  textures); the 3D loop sleeps when its canvas is invisible or hidden.
- `prefers-reduced-motion` → no pin/scrub/rotation: static final frame,
  resting rabbit, instant reveals — all content still reachable.
- WebGL-unavailable → the journey still works on the 2D frame backdrop
  (drift + hotspot + rabbit + long-press all survive), no silent failure.
- Fast/erratic scrolling can't break state — one-shot guards re-arm when you
  scroll back, and every hint tween is killed on overwrite.

## Deploy (free)

**Vercel** — push to GitHub → vercel.com → Import → framework "Vite" → deploy.
Zero config (this repo already has `base: './'` and the right build command).

**GitHub Pages** — `npm run build`, then publish `dist/` (e.g.
`npx gh-pages -d dist`). Because `base` is relative, the site works from
`https://<user>.github.io/<repo>/` as-is.

## Folder map

```
public/
├── frames/           frame_0001 … frame_0121.webp (Variant B, 1440px, watermark cropped)
├── images/           closing-bg, change-art.png (Moon Palace vignette),
│                     5 theme SVGs, petal, favicons
├── models/           mooncake.glb (Draco) + draco/ decoder
└── locales/          en.json, zh.json   ← personal words live here
src/
├── components/       Loader, Hero, ScrollStage, Closing, ScrollMeter, easter eggs…
├── three/            createCakeScene.js (trackball/pan/zoom product viewer)
├── lib/              config.js (tunables), preload.js, geom.js, gsap.js
├── state/            prefs.jsx (theme + language)
├── styles/           theme.css (3 palettes), index.css (keyframes/base)
└── App.jsx
scripts/
└── smoke.mjs         end-to-end smoke test (Playwright)
```

The `assect/` folder is only raw building material (original videos, prompts,
the uncompressed model). The site never reads from it — you can delete it
whenever you like.

