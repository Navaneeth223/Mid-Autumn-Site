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
  poster: assetUrl('images/poster-hero.webp'),
  closingBg: assetUrl('images/closing-bg.webp'),
  images: {
    rabbit: assetUrl('images/jade-rabbit.svg'),
    lantern: assetUrl('images/paper-lantern.svg'),
    branch: assetUrl('images/osmanthus-branch.svg'),
    change: assetUrl('images/change-silhouette.svg'),
    petal: assetUrl('images/petal.svg'),
  },
  locales: { en: assetUrl('locales/en.json'), zh: assetUrl('locales/zh.json') },
}

// The Variant-B frame sequence (extracted at the video's native 24fps).
export const FRAMES = { count: 121, width: 720, height: 368 }

// Where things sit INSIDE the last Variant-B frame (fractions 0..1 of the
// frame image). The 3D cake is placed onto the flat cake's spot, and the
// moon hotspot is placed onto the glowing moon, no matter the viewport.
// (Measured on frame_0121: cake center ≈ (0.47, 0.38), moon ≈ (0.60, 0.16).)
export const CAKE_ANCHOR = { x: 0.47, y: 0.38, size: 0.42 }
export const MOON_ANCHOR = { x: 0.6, y: 0.16, r: 0.16 }

// Master scroll-timeline breakpoints (fractions of the pinned stage):
//   0.00 – 0.55  frame-sequence scrub (Variant B formation)
//   0.55 – 0.64  crossfade 2D canvas -> WebGL mooncake ("pop-out")
//   0.64 – 1.00  drift + wiggle + easter eggs
export const TL = {
  scrubEnd: 0.55,
  popEnd: 0.64,
}

// Scroll length of the pinned stage, in viewport heights (620% => plenty of
// room: ~340vh for 121 frames, ~230vh of drift/easter eggs).
export const PIN_DISTANCE_VH = 620

// Loading weight split for the progress percentage.
export const LOAD_WEIGHTS = { frames: 0.55, model: 0.38, misc: 0.07 }
