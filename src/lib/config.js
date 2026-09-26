// ---------------------------------------------------------------------------
// Central configuration — every magic number used by the scroll experience
// lives here so the experience can be tuned without touching animation logic.
// ---------------------------------------------------------------------------

// Relative asset paths (Vite `base: './'` keeps them working on any host).
export const BASE = import.meta.env.BASE_URL || '/'
export const assetUrl = (p) => BASE + p

export const PATHS = {
  frames: (i) => assetUrl(`frames/frame_${String(i + 1).padStart(4, '0')}.webp`),
  model: assetUrl('models/mooncake.glb'),
  dracoDecoder: assetUrl('models/draco/'),
  closingBg: assetUrl('images/closing-bg.webp'),
  images: {
    rabbit: assetUrl('images/jade-rabbit.svg'),
    lantern: assetUrl('images/paper-lantern.svg'),
    branch: assetUrl('images/osmanthus-branch.svg'),
    // Chang'e easter-egg art (Moon Palace vignette — rendered from assect/change-art.svg)
    change: assetUrl('images/change-art.png'),
    petal: assetUrl('images/petal.svg'),
  },
  locales: { en: assetUrl('locales/en.json'), zh: assetUrl('locales/zh.json') },
}

// The Variant-B frame sequence (extracted at the video's native 24fps, 2×
// re-master from the 1080p source — lanczos downscale, webp q84 — so the scrub
// stays crisp on high-dpr phones).
export const FRAMES = { count: 121, width: 1440, height: 736 }

// Where things sit INSIDE the last Variant-B frame (fractions 0..1 of the
// frame image). The 3D cake is placed onto the flat cake's spot, and the
// moon hotspot is placed onto the glowing moon, no matter the viewport.
// (Measured on frame_0121: cake center ≈ (0.47, 0.38), moon ≈ (0.60, 0.16).)
export const CAKE_ANCHOR = { x: 0.47, y: 0.38, size: 0.42 }
export const MOON_ANCHOR = { x: 0.6, y: 0.16, r: 0.16 }

// Master scroll-timeline breakpoints (fractions of the pinned stage):
//   0.00 – 0.62  frame-sequence scrub (Variant B formation) — deliberately
//                wide so the swirl / burst / settle reads slow and cinematic
//   0.62 – 0.70  crossfade 2D canvas -> WebGL mooncake ("pop-out": the cake
//                steps out of the last frame)
//   0.70 – 1.00  swell + settle + easter eggs (the finale; nothing after it)
// NOTE: these are fractions of the GSAP timeline, whose total duration must
// stay 1.0 — a tl.call scheduled beyond the end stretches the duration and
// silently rescales every beat (that's how the formation once became ~8x too
// fast: the whole scrub was squeezed into ~8% of the pin).
export const TL = {
  scrubEnd: 0.62,
  popEnd: 0.70,
}

// Scroll length of the pinned stage, in viewport heights (800% => ~495vh for
// the 121 formation frames, ~65vh for the pop-out crossfade, ~240vh of
// finale/easter eggs).
export const PIN_DISTANCE_VH = 800

// Loading weight split for the progress percentage.
export const LOAD_WEIGHTS = { frames: 0.55, model: 0.38, misc: 0.07 }
