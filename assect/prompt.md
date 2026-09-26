# Mid-Autumn Site — Master Build Prompt v2 (for Ames)

This supersedes/extends `mooncake-site-buildkit.md`. Paste everything below to
your coding agent as one prompt.

## What I actually saw in your two videos (so you know why I'm steering you)
- **Variant A (rotation/dolly):** a perfectly baked mooncake beside a glowing
  red lantern, camera slowly pulls back and down as the full moon rises into
  soft focus behind it through drifting mist. Clean, calm, "product shot"
  energy.
- **Variant B (swirling):** total darkness → gold light-particles and petals
  swirl and condense → a glowing, translucent mooncake solidifies out of the
  light → settles onto dark wood with petals scattered around it and the full
  moon glowing softly behind. This is genuinely lovely, and it's the right
  call — the formation-from-light arc *is* the "made from friendship" feeling
  you were after, and it maps 1:1 onto a scroll-scrub (scroll down = the cake
  comes together; scroll back up = it dissolves back into light, which reads
  as magical, not broken).

**Decision: use Variant B as the main scroll-scrubbed sequence. Don't waste
Variant A** — repurpose its best two frames as (1) the static poster/loading
image shown before the user starts scrolling, and (2) a soft background
image behind the closing section. Extract those two stills yourself from the
Variant A file wherever you land in your own edit.

## Personalization — this must be woven through, not bolted on
Her name is **Kelsey Ames**, and she goes by **"Ames."** He goes by **"Navi."**
- Page `<title>`: something like `For Ames 🌕`
- Hero section: a line addressed to her by name (write the exact wording
  yourself later — leave a clearly marked placeholder, e.g.
  `<!-- PERSONAL_MESSAGE_HERE -->`)
- Closing section signature: "— Navi" (or however he wants to sign it)
- Do NOT translate "Ames" into Chinese characters — keep it in Latin script
  in both language modes, it's a name.

## Asset manifest (exact files, use these names)
```
public/
├── frames/                     # Variant B, 30fps sequence, ~75-90 frames
│   └── frame_0001.webp ... frame_00XX.webp
├── images/
│   ├── poster-hero.webp        # best still from Variant A (cake+lantern+moon)
│   ├── closing-bg.webp         # another Variant A still, moon glowing
│   ├── jade-rabbit.svg         # provided — moon rabbit w/ mortar & pestle
│   ├── paper-lantern.svg       # provided — red lantern
│   ├── osmanthus-branch.svg    # provided — gold blossoms + loose petals
│   ├── change-silhouette.svg   # provided — Chang'e figure + moon glow
│   └── moon-phases.svg         # provided — 8-frame new→full moon strip
├── models/
│   └── mooncake.glb            # pending — see 3D MODEL section below
└── locales/
    ├── en.json
    └── zh.json
```
All five SVGs are hand-built, license-free, transparent-background, and
already sized sensibly for web use — drop them straight in, no editing
needed unless you want to recolor per theme.

## Stack (unchanged, all free)
Vite + React, Three.js, GSAP + ScrollTrigger (100% free since Webflow's 2025
acquisition, no license key needed), Tailwind CSS. Host on Vercel free tier
or GitHub Pages.

## Theme system (unchanged)
Three CSS-variable themes — dawn / dusk / night — auto-selected by device
clock, manual toggle available. Night theme especially should let
`moon-phases.svg` and `change-silhouette.svg` read clearly (they're designed
against a dark background).

## The scroll journey, fully choreographed

**1. Loading / poster** — `poster-hero.webp` as background, soft fade-in,
small looping shimmer on the lantern glow. Loading-progress bar rendered as
the moon filling in via `moon-phases.svg` (swap frames 0→7 as assets load —
reuse this exact same strip later as the scroll-progress indicator, so it
pays off twice).

**2. Hero** — greeting title (bilingual), personal line to Ames, gentle
star twinkle, `paper-lantern.svg` softly swaying bottom-corner, "scroll to
begin" hint.

**3. Frame-sequence section (Variant B, pinned, scrub: true)** — canvas
scrubs through the 75-90 webp frames 1:1 with scroll position. While this
plays, fade in 2-3 loose petal sprites from `osmanthus-branch.svg` drifting
across the canvas independent of the frame sequence, so it doesn't feel like
a flat video-in-a-box.

**4. Pop-out** — crossfade canvas → Three.js WebGL mooncake model, positioned
to match the last frame exactly.

**5. Drift + easter eggs (this is the "more actions" section)** — while the
3D cake auto-rotates and zigzag-drifts:
   - **Tap/click the moon in the background** → `change-silhouette.svg` fades
     in beside it with a short caption (EN/ZH) naming Chang'e and the elixir
     legend. Tap again to dismiss.
   - **`jade-rabbit.svg` hops in from a random screen corner** on
     IntersectionObserver, idles, occasionally "pounds" (a 2-frame CSS
     keyframe wobble on the pestle). Tapping it triggers a burst of 6-8 gold
     osmanthus petals (reuse the loose petals from `osmanthus-branch.svg`,
     animated outward with GSAP and fading over ~1s).
   - **Long-press / long-hover the 3D mooncake** → briefly reveal a
     cross-section overlay (a simple layered circle graphic is fine — doesn't
     need to be a real 3D cutaway) with a one-line caption: round shape =
     reunion, the center = the full moon itself.
   - **Scroll-progress indicator**: pin `moon-phases.svg` in a corner, and
     switch which of the 8 phase icons is "active/highlighted" based on
     overall scroll percentage — new moon at the very top of the page, full
     moon exactly at the closing section.

**6. Closing** — `closing-bg.webp` behind a short bilingual message
(placeholder for his own words), signed "— Navi." Fade in the Su Shi line
（但愿人长久，千里共婵娟）as a soft-glowing caption. Ambient petal drift
continues in a slow loop so the page doesn't feel "finished."

## Mobile-first performance rules (unchanged, still non-negotiable)
webp frames ~720px wide; lazy-load below the fold; respect
`prefers-reduced-motion`; Draco-compress the .glb under 5MB; target a real
60fps on mid-range Android; WebGL-unsupported fallback shows `poster-hero.webp`
instead of failing; loading screen with a percentage; no console errors on
fast/erratic scrolling.

## Deliverable
A clean, runnable Vite project, organized so he can drop in the final
`mooncake.glb` and his own personal message text without touching animation
logic. Include a short README noting free deploy steps for Vercel/GitHub
Pages.

---

## Generating `mooncake.glb` (free, do this part yourself before handing off)
You haven't generated the 3D model yet — here's the fastest free path:

1. **Get a clean reference image.** Grab a still frame straight from either
   of your own videos — `b_mid` or `b_end` framing works well since it's a
   near-frontal 3/4 view with a plain-ish background. Crop tight around just
   the mooncake (single object, clear silhouette = better reconstruction).
2. **Convert image → 3D:**
   - **Tripo3D** (tripo3d.ai) — best free option here: ~300-600 free
     credits/month, exports straight to `.glb`, and it's specifically tuned
     for exactly this kind of single hard-surface object.
   - **Upsampler** (upsampler.com) — zero signup, no watermark, free daily
     GPU minutes, also exports `.glb`. Good for a quick first pass before
     committing credits elsewhere.
   - **Hunyuan3D** — genuinely free/open-source option (~20 generations/day)
     if you want a backup.
3. Drop the result into `public/models/mooncake.glb`. If the auto-generated
   base/underside looks rough (common with single-image reconstruction), it's
   fine — the site only ever shows the cake from the front/top angles.

## Notes
- If you want the five SVG icons in a different color per theme, they're
  plain flat shapes with named hex fills — trivial for the agent to
  find/replace or wrap in CSS `filter: hue-rotate()` per theme.
- Everything above is free-tool-only, per your usual rule.
