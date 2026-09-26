# Mid-Autumn Mooncake Site — Build Kit

## The plan, in order
1. Generate the mooncake video clip (prompt in §2) on a free tool.
2. Extract it to a 30fps frame sequence with ffmpeg (command in §2).
3. Drop your mooncake `.glb` model into `public/models/`.
4. Hand the agent prompt in §3 to your coding agent, point it at your frames + model.
5. Test on an actual Android phone (not just a resized browser window) before sending.
6. Send her the link.

## Quick reality check
Mid-Autumn Festival 2026 fell on Friday, Sept 25 — mainland China's holiday runs Sept 25–27. You're still right inside the window, not late.

## Culture cheat-sheet (for content + easter eggs)
- **Chang'e (嫦娥)** — the moon goddess. She drank an elixir of immortality and floated to the moon, separated forever from her husband Houyi. This is the festival's core "longing across distance, reunited by the same moon" myth — very fitting for two friends who just met.
- **Jade Rabbit (玉兔)** — lives on the moon with Chang'e, endlessly pounding herbal medicine under an osmanthus tree. This is the "rabbit in the moon" — good material for a corner pop-up sprite/GIF.
- **Osmanthus tree (桂树)** — blooms right around this festival. Small drifting gold-blossom particles in the background nod to this.
- **Mooncakes (月饼)** — round shape = wholeness/reunion. A salted egg yolk center often stands in for the full moon itself. Classic fillings: lotus seed paste, red bean, five-kernel.
- **Lanterns + moon-gazing** — families eat outdoors at night and look at the moon together.
- Two short Chinese lines for on-page titles (both are centuries-old public-domain phrases, not modern lyrics):
  - 中秋节快乐 (Zhōngqiū jié kuàilè) — "Happy Mid-Autumn Festival"
  - 但愿人长久,千里共婵娟 (dàn yuàn rén cháng jiǔ, qiān lǐ gòng chán juān) — a ~1000-year-old Su Shi line: roughly "may we live long, and share this same beautiful moon though we're far apart."

## Assumptions baked into the prompts below (say the word if you want any changed)
- **Theme**: auto-switches by the visitor's device clock (morning / dusk / night) **plus** a manual toggle — not one generic dark mode.
- **Stack**: 100% free. GSAP (including ScrollTrigger) became fully free for everyone, commercial use included, after Webflow's 2025 acquisition — no license key needed anymore.
- **No split-open animation** — just the pop-out + gentle wiggle/zigzag drift, like you settled on.
- **Mini mooncake** = the site favicon, plus a small icon that trails the scroll on mobile.

---

## 1. Free stack & folder structure

**Stack (all free):**
- Vite + React
- Three.js (raw, or `@react-three/fiber` if your agent prefers it — either is free and fine)
- GSAP + ScrollTrigger (free, confirmed above)
- Tailwind CSS
- Hosting: Vercel free tier or GitHub Pages
- Frame extraction: `ffmpeg` (free, open source)

**Folder structure:**
```
mooncake-site/
├── public/
│   ├── models/            # mooncake.glb (Draco-compressed)
│   ├── frames/             # frame_0001.webp ... frame_00XX.webp
│   ├── images/             # rabbit.gif, lantern.png, textures, favicon
│   └── locales/            # en.json, zh.json
├── src/
│   ├── components/
│   ├── three/              # scene setup, loaders, controls
│   ├── styles/             # theme tokens
│   └── App.jsx
```

---

## 2. Video-generation prompt (god-tier)

**Recommended free tool right now:** CapCut's AI video generator (Dreamina, Seedance 2.0) — generous daily free credits, clean exports, built-in frame/edit tools. Kling AI and Pika are solid free-tier backups if you want a second style option.

Ask for a **vertical 9:16** clip (mobile-first) — most tools default to 5–8 second clips, which is enough.

**Variant A — Hero rotation (recommended primary, cleanest for scroll-scrubbing):**
```
A single perfect round mooncake, golden-brown lattice pattern stamped on top,
resting on dark polished wood. Soft warm lantern light from the left, cool
moonlight from the right. Slow 360-degree orbit around the mooncake, shallow
depth of field, subtle steam/mist drifting past in the foreground. Background:
soft-focus red paper lanterns and a full moon glowing through thin clouds.
Tiny gold osmanthus petals drift and settle near the cake. Cinematic macro
food photography style, warm color grade, gentle and intimate mood — not
dramatic. Seamless loopable motion. Vertical 9:16, 5 seconds.
```

**Variant B — Particle formation (more "made with love/friendship" feeling, better as an intro clip):**
```
Swirling golden light particles and soft falling osmanthus petals drift
together in darkness, slowly assembling into the shape of a round mooncake
with a lattice pattern, as if formed from warmth and friendship. Once
assembled, the mooncake glows briefly and settles onto dark wood, lit by
warm lantern light with a full moon softly glowing in the background.
Gentle, tender, magical mood, cinematic macro style, warm color grade.
Vertical 9:16, 5-6 seconds.
```

**Extracting the 30fps frame sequence (free, via ffmpeg):**
```bash
ffmpeg -i mooncake.mp4 -vf "fps=30,scale=720:-1" -q:v 3 public/frames/frame_%04d.webp
```
Tip: you don't need every single frame for smooth scroll-scrubbing — trimming the source clip to ~2.5–3s (roughly 75–90 frames) keeps the whole sequence under a few MB, which matters since she'll be loading this over mobile data.

---

## 3. Website build prompt (god-tier — paste this whole block to your coding agent)

```
You are building a single-page, mobile-first, scroll-driven website. It's a
personal Mid-Autumn Festival gift for one specific person — a friend, 18,
Chinese, currently a boarding high-school student. She will open this almost
certainly on her phone, so mobile must look and feel better than desktop —
desktop is secondary and just needs to not be broken.

TECH STACK (all free/open-source, no paid keys):
- Vite + React
- Three.js for the 3D mooncake model
- GSAP + ScrollTrigger (scrub-based, no license needed — fully free)
- Tailwind CSS
- Plain JSON files for i18n (no paid translation service)

FOLDER STRUCTURE (keep it exactly this organized):
public/models/   -> the .glb mooncake model (I will provide it)
public/frames/   -> frame_0001.webp ... frame_00XX.webp, a 30fps sequence
public/images/   -> rabbit gif/sprite, lantern art, favicon
public/locales/  -> en.json, zh.json

VISUAL IDENTITY:
Not a generic black "dark mode" tech site. Build THREE color themes, all moon-
themed, switchable both automatically (by device clock) and manually via a
toggle button in the corner:
- "dawn" (roughly 5am-11am): soft pastel pink/blue/gold gradient sky
- "dusk" (roughly 11am-7pm... use warm afternoon/evening tones, amber/orange/
  rose, lantern-glow accents)
- "night" (7pm-5am): deep indigo/near-black sky, visible stars, glowing full
  moon, warm lantern-light accents so it never feels flat/dead black
Store each theme as CSS custom properties (--bg, --accent, --text, --glow)
so switching is instant with no re-render flicker. Default to whichever
theme matches the visitor's local device time; a small toggle in the corner
lets them cycle themes manually.

LANGUAGE: 
Toggle button (EN / 中文) switching all copy via the locale JSON files.
Include at least one Chinese title/greeting even in the English mode as a
cultural touch (e.g. "中秋节快乐" under the English "Happy Mid-Autumn
Festival" heading).

SCROLL JOURNEY (in this order):
1. Hero: full moon glowing in the background, a short greeting title
   (bilingual), soft twinkling stars, gentle idle motion, "scroll to
   continue" hint.
2. Frame-sequence section: pin the viewport and scrub through the 30fps
   mooncake video frames (public/frames/) tied 1:1 to scroll position using
   GSAP ScrollTrigger with scrub: true, drawing frames onto a <canvas> via
   drawImage (NOT a <video> tag — canvas scrubbing is what makes it feel
   scroll-controlled). Preload all frames before allowing scroll to start
   this section; show a lightweight loading state if they aren't ready yet.
3. Pop-out: once the frame sequence finishes, crossfade the canvas out and
   fade in a Three.js WebGL canvas containing the real 3D mooncake model,
   positioned exactly where the flat mooncake in the last frame appeared, so
   the transition feels seamless rather than jarring.
4. Drift section: as the user keeps scrolling, the 3D mooncake gently
   auto-rotates and follows a soft zigzag drift path with a subtle wiggle
   (small oscillating rotation, not a bounce), staying pinned/visible while
   the page scrolls past it. Small "pop-in" 2D/GIF elements (the moon
   rabbit, a lantern, a few osmanthus petals) animate in from random screen
   corners as the user scrolls, using IntersectionObserver so they only
   trigger once, on-screen.
5. Closing section: a short bilingual message area (I'll write the actual
   words myself later — leave a clearly marked placeholder), the moon
   visible one more time in the background, and a subtle looping ambient
   animation (drifting stars or petals) so the page doesn't feel "finished"
   the moment scrolling stops.

MOBILE-FIRST PERFORMANCE RULES (these matter more than desktop polish):
- Serve frame images as .webp, scaled to roughly 720px wide max.
- Lazy-load anything below the fold; don't block first paint on the full
  frame sequence or the 3D model.
- Respect `prefers-reduced-motion`: provide a reduced-motion fallback that
  keeps the content but drops the heavy scrubbing/rotation.
- Compress the .glb with Draco compression; target well under 5MB.
- Target a real 60fps scroll feel on a mid-range Android phone, not just a
  desktop Chrome dev tools simulation — avoid heavy per-frame JS work outside
  requestAnimationFrame, and avoid layout thrash.
- Add a WebGL-unsupported fallback (e.g. show a still image of the mooncake
  instead of failing silently) — some older phones may not support it.
- No console errors, no broken states if the user scrolls fast or jumps
  around. Add a simple loading screen with a progress percentage while
  frames/model preload.

FAVICON: 
Use a small mooncake icon as the favicon — a "mini mooncake" nod, per the
brief.

DELIVERABLE:
A clean, well-commented, working Vite project I can run locally, plus clear
instructions for deploying it free on Vercel or GitHub Pages. Keep the code
organized enough that I can swap in my final video frames, model, and
closing message text myself without needing to touch the animation logic.
```

---

## 4. A few personalization ideas (optional, your call)
- A light, funny nod to the burger-and-cola conversation somewhere in the closing message — keep it playful, not preachy, since she already told you she's changing that herself.
- Since you're sending the link directly rather than surprising her, consider a one-line intro right at the very top addressed to her by name, so it's clearly *for her* the second the page loads.
- The Su Shi line in §1 (但愿人长久,千里共婵娟) works nicely as a closing-section caption given you two just met and are far apart.
