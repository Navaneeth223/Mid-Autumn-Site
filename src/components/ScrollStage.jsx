import { useEffect, useRef } from 'react'
import { gsap, ScrollTrigger } from '../lib/gsap.js'
import { CAKE_ANCHOR, FRAMES, MOON_ANCHOR, PIN_DISTANCE_VH, TL } from '../lib/config.js'
import { coverRect, framePointToCanvas } from '../lib/geom.js'
import { createCakeScene } from '../three/createCakeScene.js'
import { usePrefs } from '../state/prefs.jsx'
import { useReducedMotion } from '../hooks/useReducedMotion.js'
import JadeRabbit from './JadeRabbit.jsx'
import ChangEPanel from './ChangEPanel.jsx'
import CrossSectionOverlay from './CrossSectionOverlay.jsx'
import PetalLayer from './PetalLayer.jsx'

// ---------------------------------------------------------------------------
// 3 + 4 + 5. THE PINNED STAGE — the whole scroll journey lives here:
//
//   0.00–0.55  frame scrub: 121 Variant-B frames drawn 1:1 onto a <canvas>
//              (drawImage, NOT <video>), tied to scroll via ScrollTrigger
//   0.42–0.52  the "formation" caption fades through
//   0.55–0.64  pop-out: 2D canvas crossfades -> Three.js mooncake positioned
//              exactly where the flat cake sits in the last frame
//   0.64–1.00  drift: zigzag path + wiggle + auto-rotate, easter eggs arm:
//              rabbit hops in · moon becomes tappable · long-press overlay
//
// All scroll-driven mutation happens on ONE plain object (stRef) with
// transform/opacity writes only — no layout reads/writes per frame.
// ---------------------------------------------------------------------------
export default function ScrollStage({ assets, active }) {
  const reduced = useReducedMotion()
  const { t } = usePrefs()

  const sectionRef = useRef(null)
  const viewRef = useRef(null)
  const canvasRef = useRef(null)
  const threeRef = useRef(null)
  const shadowRef = useRef(null)
  const hotspotRef = useRef(null)
  const cakeHitRef = useRef(null)
  const moonHintRef = useRef(null)
  const pressHintRef = useRef(null)
  const orbitHintRef = useRef(null)
  const captionRef = useRef(null)
  const rabbitRef = useRef(null)
  const petalRef = useRef(null)
  const changERef = useRef(null)
  const crossRef = useRef(null)

  const sceneRef = useRef(null)
  const stRef = useRef({ frame: 0, fade: 0, dx: 0, dy: 0, rotY: 0, zoom: 0 })
  const lastDrawn = useRef(-1)
  const flags = useRef({ rabbit: false, moonHint: false, pressHint: false, orbitHint: false })
  const stageActive = useRef(false)
  const hotspotShown = useRef(false)
  const moonTapped = useRef(false)
  const changeOpen = useRef(false)
  const anchorRef = useRef({ moon: { x: 0, y: 0, r: 0 }, cake: { x: 0, y: 0 } })
  const viewSize = useRef({ w: 1, h: 1 })

  // ------------------------------------------------------------ canvas draw
  const draw = (idx) => {
    const cv = canvasRef.current
    if (!cv) return
    const i = Math.max(0, Math.min(FRAMES.count - 1, Math.round(idx)))
    if (i === lastDrawn.current) return
    let img = assets.frames[i]
    if (!img) {
      for (let d = 1; d < FRAMES.count && !img; d++) {
        img = assets.frames[i - d] || assets.frames[i + d]
      }
    }
    if (!img) return
    const ctx = cv.getContext('2d')
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    // cover-fit: fill the canvas, center-crop the 16:9 frame (the cake sits
    // near the center of the source, so portrait phones still frame it well)
    const r = coverRect(
      img.naturalWidth || FRAMES.width,
      img.naturalHeight || FRAMES.height,
      cv.width,
      cv.height,
    )
    // successive cover draws fully overwrite -> no clearRect needed
    ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, r.x, r.y, r.w, r.h)
    lastDrawn.current = i
  }

  const sizeCanvas = () => {
    const cv = canvasRef.current
    const view = viewRef.current
    if (!cv || !view) return
    const rect = view.getBoundingClientRect()
    viewSize.current = { w: rect.width, h: rect.height }
    const dpr = Math.min(window.devicePixelRatio || 1, 2) // crisp on high-dpr phones
    const w = Math.round(rect.width * dpr)
    const h = Math.round(rect.height * dpr)
    if (cv.width !== w || cv.height !== h) {
      cv.width = w
      cv.height = h
    }
    lastDrawn.current = -1
    draw(stRef.current.frame)
  }

  // ---------------------------------------------- overlay placement (cheap)
  // Everything overlay-ish is positioned from the shared cover mapping so it
  // stays glued to the video content on any viewport. Runs on resize only.
  const layoutOverlays = () => {
    const view = viewRef.current
    if (!view) return
    const rect = view.getBoundingClientRect()
    const r = coverRect(FRAMES.width, FRAMES.height, rect.width, rect.height)
    const p2c = (fx, fy) =>
      framePointToCanvas(fx, fy, FRAMES.width, FRAMES.height, rect.width, rect.height)

    const moon = p2c(MOON_ANCHOR.x, MOON_ANCHOR.y)
    const moonR = MOON_ANCHOR.r * r.w
    anchorRef.current.moon = { x: moon.x, y: moon.y, r: moonR }
    const cake = p2c(CAKE_ANCHOR.x, CAKE_ANCHOR.y)
    anchorRef.current.cake = cake

    const setBox = (el, x, y, w, h) => {
      if (!el) return
      el.style.left = `${x}px`
      el.style.top = `${y}px`
      if (w != null) el.style.width = `${w}px`
      if (h != null) el.style.height = `${h}px`
    }

    setBox(hotspotRef.current, moon.x, moon.y, moonR * 2.4, moonR * 2.4)
    setBox(
      cakeHitRef.current,
      cake.x,
      cake.y,
      CAKE_ANCHOR.size * r.w * 1.18,
      CAKE_ANCHOR.size * r.h * 1.7,
    )
    setBox(
      shadowRef.current,
      cake.x,
      cake.y + CAKE_ANCHOR.size * r.h * 0.92,
      CAKE_ANCHOR.size * r.w * 1.5,
      CAKE_ANCHOR.size * r.w * 0.3,
    )
    setBox(pressHintRef.current, cake.x, cake.y + CAKE_ANCHOR.size * r.h * 1.35)
    setBox(orbitHintRef.current, cake.x, cake.y + CAKE_ANCHOR.size * r.h * 1.35)
    setBox(moonHintRef.current, moon.x, moon.y + moonR + 14)
  }

  // --------------------------------------------------- scroll-state applier
  const applyScrollState = () => {
    const st = stRef.current
    const withCake = !!sceneRef.current
    draw(st.frame)

    const cv = canvasRef.current
    if (cv) {
      if (withCake) {
        cv.style.opacity = String(1 - st.fade * 0.55) // dim, keep the moon glowing
        cv.style.transform = ''
      } else {
        // no-WebGL fallback: drift the 2D backdrop itself so the journey survives
        cv.style.opacity = '1'
        if (st.fade > 0.001) {
          cv.style.transform = `translate(${(st.dx * 100).toFixed(2)}%, ${(st.dy * 100).toFixed(2)}%) scale(${(0.94 + 0.06 * st.fade).toFixed(3)})`
        } else {
          cv.style.transform = ''
        }
      }
    }

    if (sceneRef.current) {
      sceneRef.current.apply({
        opacity: st.fade,
        dx: st.dx,
        dy: st.dy,
        // st.pitch = the resting 3/4 pose eased in right after the pop-out;
        // the visitor's trackball / pan / zoom all live inside the scene.
        pitch: st.pitch,
        // st.zoom = post-pop swell so the 3D cake reads hero-sized on wide
        // viewports, where the cover-crop barely overflows (portrait phones
        // already overflow ~3.8x, so they get no boost).
        scale:
          (0.94 + 0.06 * st.fade) *
          (1 + st.zoom * (viewSize.current.w > viewSize.current.h ? 0.1 : 0)),
      })
      sceneRef.current.setActive(stageActive.current && st.fade > 0.01)
    }

    if (shadowRef.current) {
      shadowRef.current.style.opacity = String(withCake ? st.fade * 0.85 : 0)
    }

    // hotspot appears once the pop-out has finished
    const wantHotspot = st.fade > 0.85
    if (wantHotspot !== hotspotShown.current) {
      hotspotShown.current = wantHotspot
      gsap.set(hotspotRef.current, { autoAlpha: wantHotspot ? 1 : 0 })
      if (!wantHotspot && changeOpen.current) {
        changeOpen.current = false
        changERef.current?.hide()
      }
    }

    // no-WebGL fallback: keep the hotspot glued to the drifting moon
    if (!withCake && hotspotRef.current) {
      const m = anchorRef.current.moon
      hotspotRef.current.style.left = `${m.x + st.dx * viewSize.current.w}px`
      hotspotRef.current.style.top = `${m.y + st.dy * viewSize.current.h}px`
    }

    // the cake pad becomes a product-viewer surface once the pop-out lands:
    // touch-action none so orbit/pan/zoom gestures work (the rest of the
    // screen still scrolls the page), plus a grab cursor on desktop.
    if (cakeHitRef.current) {
      const live = !!sceneRef.current && st.fade > 0.8
      cakeHitRef.current.style.touchAction = live ? 'none' : 'pan-y'
      cakeHitRef.current.style.cursor = live ? 'grab' : ''
    }

    // re-arm one-shots when the user scrolls back into the scrub zone; the
    // visitor's orbit/pan/zoom also resets so the pop-out stays pixel-exact
    if (st.fade < 0.1) {
      flags.current = { rabbit: false, moonHint: false, pressHint: false, orbitHint: false }
      sceneRef.current?.resetView(true)
      for (const r of [moonHintRef, pressHintRef, orbitHintRef]) {
        if (r.current) {
          gsap.killTweensOf(r.current)
          gsap.set(r.current, { autoAlpha: 0 })
        }
      }
    }
  }

  // ------------------------------------------------------------ easter eggs
  const enterRabbit = (instant = false) => {
    const el = rabbitRef.current
    const view = viewRef.current
    if (!el || !view) return
    const vw = view.clientWidth
    const vh = view.clientHeight
    const side = Math.random() < 0.5 ? 'left' : 'right'
    const toX = side === 'left' ? vw * 0.05 + Math.random() * vw * 0.07 : vw * 0.74 + Math.random() * vw * 0.09
    const toY = vh * 0.6 + Math.random() * vh * 0.16
    gsap.set(el, { left: toX, top: toY, visibility: 'visible' })
    if (instant) {
      gsap.set(el, { x: 0, y: 0, rotation: 0, opacity: 1 })
      return
    }
    gsap.fromTo(
      el,
      {
        x: side === 'left' ? -vw * 0.55 : vw * 0.55,
        y: vh * 0.55,
        rotation: side === 'left' ? -16 : 16,
        opacity: 0,
      },
      { x: 0, y: 0, rotation: 0, opacity: 1, duration: 1.15, ease: 'back.out(1.3)' },
    )
  }

  const onRabbitTap = (cx, cy) => {
    const rect = viewRef.current?.getBoundingClientRect()
    if (!rect) return
    petalRef.current?.burst(cx - rect.left, cy - rect.top)
    gsap.fromTo(rabbitRef.current, { y: 0 }, { y: -20, duration: 0.16, yoyo: true, repeat: 1, ease: 'power2.out' })
  }

  const toggleChangE = () => {
    moonTapped.current = true
    gsap.to(moonHintRef.current, { autoAlpha: 0, duration: 0.3, overwrite: true })
    if (changeOpen.current) {
      changeOpen.current = false
      changERef.current?.hide()
    } else {
      changeOpen.current = true
      changERef.current?.show(anchorRef.current.moon)
    }
  }

  const showMoonHint = () => {
    const el = moonHintRef.current
    if (!el || moonTapped.current) return
    gsap.killTweensOf(el)
    gsap.fromTo(el, { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out' })
    gsap.to(el, { autoAlpha: 0, duration: 0.6, delay: 6 })
  }

  const showPressHint = () => {
    const el = pressHintRef.current
    if (!el) return
    gsap.killTweensOf(el)
    gsap.fromTo(el, { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out' })
    gsap.to(el, { autoAlpha: 0, duration: 0.6, delay: 5.4 })
  }

  const showOrbitHint = () => {
    const el = orbitHintRef.current
    if (!el) return
    gsap.killTweensOf(el)
    gsap.fromTo(el, { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out' })
    gsap.to(el, { autoAlpha: 0, duration: 0.6, delay: 6.5 })
  }

  const hidePressHint = () =>
    gsap.to(pressHintRef.current, { autoAlpha: 0, duration: 0.3, overwrite: true })

  // -------------------------------------------------- reliable tap the moon
  // The old button relied purely on click synthesis, which mobile sometimes
  // swallowed. Pointer-based tap: a quick press + release without dragging,
  // with the click event kept only as the keyboard (Enter/Space) path.
  const armMoonTap = () => {
    const el = hotspotRef.current
    if (!el) return () => {}
    let sx = 0
    let sy = 0
    let t0 = 0
    let armed = false
    let clickHandled = false
    const down = (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return
      sx = e.clientX
      sy = e.clientY
      t0 = performance.now()
      armed = true
    }
    const up = (e) => {
      if (!armed) return
      armed = false
      if (performance.now() - t0 > 400) return
      if (Math.hypot(e.clientX - sx, e.clientY - sy) > 12) return
      clickHandled = true
      window.setTimeout(() => {
        clickHandled = false
      }, 450)
      toggleChangE()
    }
    const click = () => {
      if (clickHandled) {
        clickHandled = false
        return
      }
      toggleChangE()
    }
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointerup', up)
    el.addEventListener('click', click)
    return () => {
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('click', click)
    }
  }

  // long-press (works for touch + mouse-hold) on the mooncake
  const armLongPress = () => {
    const el = cakeHitRef.current
    if (!el) return () => {}
    let timer = 0
    let sx = 0
    let sy = 0
    const down = (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return
      if (stRef.current.fade < 0.8) return // only meaningful after the pop-out
      if (!e.isPrimary && timer) {
        clearTimeout(timer) // a second finger = a pinch gesture, not a long-press
        timer = 0
        return
      }
      sx = e.clientX
      sy = e.clientY
      timer = window.setTimeout(() => {
        timer = 0
        hidePressHint()
        const overlay = crossRef.current
        if (!overlay) return
        overlay.style.left = `${anchorRef.current.cake.x}px`
        overlay.style.top = `${anchorRef.current.cake.y}px`
        gsap.killTweensOf(overlay)
        gsap.fromTo(
          overlay,
          { autoAlpha: 0, scale: 0.9, y: 10 },
          { autoAlpha: 1, scale: 1, y: 0, duration: 0.45, ease: 'power3.out' },
        )
        gsap.to(overlay, { autoAlpha: 0, scale: 0.96, duration: 0.5, delay: 2.8, ease: 'power2.in' })
      }, 480)
    }
    // any real drag = the user is scrolling, not pressing -> cancel
    const move = (e) => {
      if (timer && Math.hypot(e.clientX - sx, e.clientY - sy) > 9) {
        clearTimeout(timer)
        timer = 0
      }
    }
    const up = () => {
      if (timer) {
        clearTimeout(timer)
        timer = 0
      }
    }
    el.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    return () => {
      clearTimeout(timer)
      el.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
  }

  // -------------------------------------------------- product-viewer on cake
  // One finger / mouse drag = trackball rotation (any axis — flip it over and
  // see the top). Two fingers = pinch zoom + twist roll (z axis) + the average
  // movement pans the cake anywhere on screen; on release it springs home.
  // Wheel = zoom. Right-button or Shift+drag = pan (desktop). Double-tap or
  // double-click = reset. Long-press (hold still) still shows the cross-section.
  const armCakeViewer = () => {
    const el = cakeHitRef.current
    if (!el) return () => {}
    const pointers = new Map() // id -> { x, y, sx, sy, t }
    let mode = 'orbit' // 'orbit' | 'pan' | 'gesture'
    let lastPinch = 0
    let lastTwist = 0
    let lastTap = { t: 0, x: 0, y: 0 }

    const live = () => stRef.current.fade > 0.8 && !!sceneRef.current

    const onDown = (e) => {
      if (!live()) return
      if (pointers.size === 0) {
        mode = e.pointerType === 'mouse' && (e.button === 2 || e.shiftKey) ? 'pan' : 'orbit'
      }
      el.setPointerCapture(e.pointerId)
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: performance.now() })
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()]
        lastPinch = Math.hypot(a.x - b.x, a.y - b.y)
        lastTwist = Math.atan2(b.y - a.y, b.x - a.x)
        mode = 'gesture'
      }
      sceneRef.current?.setInteracting(true)
      el.style.cursor = 'grabbing'
    }

    const onMove = (e) => {
      const p = pointers.get(e.pointerId)
      const s = sceneRef.current
      if (!p || !s) return
      const dx = e.clientX - p.x
      const dy = e.clientY - p.y
      p.x = e.clientX
      p.y = e.clientY
      if (pointers.size === 1) {
        if (mode === 'pan') s.panBy(dx, dy)
        else s.orbitBy(dx, dy)
      } else if (pointers.size === 2) {
        const [a, b] = [...pointers.values()]
        const d = Math.hypot(a.x - b.x, a.y - b.y)
        if (lastPinch > 0 && d > 0) s.zoomBy(d / lastPinch)
        lastPinch = d
        // two-finger twist rolls around the view axis
        const ang = Math.atan2(b.y - a.y, b.x - a.x)
        let dA = ang - lastTwist
        if (dA > Math.PI) dA -= Math.PI * 2
        if (dA < -Math.PI) dA += Math.PI * 2
        if (Math.abs(dA) > 0.01) s.rollBy(-dA)
        lastTwist = ang
        // the average movement of both fingers pans the cake
        s.panBy(dx / 2, dy / 2)
      }
    }

    const onUp = (e) => {
      const p = pointers.get(e.pointerId)
      if (!p) return
      pointers.delete(e.pointerId)
      if (pointers.size === 0) {
        sceneRef.current?.setInteracting(false)
        if (live()) el.style.cursor = 'grab'
        lastPinch = 0
        // double-tap / double-click resets the view
        const dt = performance.now() - p.t
        const moved = Math.hypot(e.clientX - p.sx, e.clientY - p.sy)
        if (dt < 300 && moved < 12) {
          const now = performance.now()
          if (now - lastTap.t < 350 && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 48) {
            lastTap.t = 0
            sceneRef.current?.resetView()
          } else {
            lastTap = { t: now, x: e.clientX, y: e.clientY }
          }
        }
      } else {
        mode = 'orbit'
        lastPinch = 0
      }
    }

    const onWheel = (e) => {
      if (!live()) return
      e.preventDefault()
      sceneRef.current?.zoomBy(Math.exp(-e.deltaY * 0.0012))
    }
    const onContext = (e) => {
      if (live()) e.preventDefault() // keep right-drag pan usable
    }
    const onDbl = () => {
      if (live()) sceneRef.current?.resetView()
    }

    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onUp)
    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('contextmenu', onContext)
    el.addEventListener('dblclick', onDbl)
    return () => {
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onUp)
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('contextmenu', onContext)
      el.removeEventListener('dblclick', onDbl)
    }
  }

  // ------------------------------------------------------------------ setup
  useEffect(() => {
    if (!active) return
    const section = sectionRef.current
    const view = viewRef.current
    let tl = null
    let disposeLongPress = () => {}
    let disposeViewer = () => {}
    let disposeMoonTap = () => {}

    let resizeRaf = 0
    const onResize = () => {
      if (resizeRaf) cancelAnimationFrame(resizeRaf)
      resizeRaf = requestAnimationFrame(() => {
        resizeRaf = 0
        sizeCanvas()
        layoutOverlays()
        sceneRef.current?.resize()
      })
    }

    if (reduced) {
      // ------- reduced-motion variant: content preserved, heavy motion gone.
      // No pin, no scrub, no 3D: final frame + resting rabbit + clickable
      // moon + long-press still work (transitions stay tiny).
      sizeCanvas()
      layoutOverlays()
      draw(FRAMES.count - 1)
      enterRabbit(true)
      hotspotShown.current = true
      gsap.set(hotspotRef.current, { autoAlpha: 1 })
      disposeLongPress = armLongPress()
      disposeMoonTap = armMoonTap()
      window.addEventListener('resize', onResize, { passive: true })
      return () => {
        window.removeEventListener('resize', onResize)
        disposeLongPress()
        petalRef.current?.setDrifting(false)
      }
    }

    // ------- full experience
    sceneRef.current = createCakeScene(threeRef.current, { gltf: assets.gltf })
    sizeCanvas()
    layoutOverlays()
    draw(0)
    disposeLongPress = armLongPress()
    disposeViewer = armCakeViewer()
    disposeMoonTap = armMoonTap()

    const st = stRef.current
    const apply = () => applyScrollState()

    tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: `+=${PIN_DISTANCE_VH}%`,
        pin: view,
        pinSpacing: true,
        anticipatePin: 1,
        scrub: true,
        onToggle: (self) => {
          stageActive.current = self.isActive
          petalRef.current?.setDrifting(self.isActive)
          apply()
        },
      },
    })

    // 1) the formation scrub (frames 1:1 with scroll)
    tl.to(st, { frame: FRAMES.count - 1, duration: TL.scrubEnd, onUpdate: apply }, 0)

    // 2) formation caption breathes in and out near the end of the scrub
    tl.fromTo(
      captionRef.current,
      { autoAlpha: 0, y: 12 },
      { autoAlpha: 1, y: 0, duration: 0.05, ease: 'power2.out' },
      0.42,
    )
    tl.to(captionRef.current, { autoAlpha: 0, duration: 0.04 }, 0.5)

    // 3) pop-out crossfade (2D canvas -> WebGL cake)
    tl.to(st, { fade: 1, duration: TL.popEnd - TL.scrubEnd, onUpdate: apply }, TL.scrubEnd)

    // 4) after the pop: a gentle swell to hero size, then the cake settles
    // into a 3/4 pose and PARKS — no more zigzag wander. The visitor takes
    // over from here: trackball rotate / move / zoom (armCakeViewer).
    tl.to(st, { zoom: 1, duration: 0.14, ease: 'sine.inOut', onUpdate: apply }, TL.popEnd)
    tl.to(st, { pitch: 0.3, duration: 0.32, ease: 'sine.inOut', onUpdate: apply }, TL.popEnd + 0.02)

    // 5) easter-egg arming (guarded one-shots; re-armed by applyScrollState)
    tl.call(() => {
      if (!flags.current.pressHint) {
        flags.current.pressHint = true
        showPressHint()
      }
    }, null, TL.popEnd + 0.02)
    tl.call(() => {
      if (!flags.current.rabbit) {
        flags.current.rabbit = true
        enterRabbit()
      }
    }, null, TL.popEnd + 0.05)
    tl.call(() => {
      if (!flags.current.moonHint) {
        flags.current.moonHint = true
        showMoonHint()
      }
    }, null, TL.popEnd + 0.08)
    tl.call(() => {
      if (!flags.current.orbitHint) {
        flags.current.orbitHint = true
        showOrbitHint()
      }
    }, null, TL.popEnd + 6.1)

    window.addEventListener('resize', onResize, { passive: true })
    return () => {
      window.removeEventListener('resize', onResize)
      if (resizeRaf) cancelAnimationFrame(resizeRaf)
      disposeLongPress()
      disposeViewer()
      disposeMoonTap()
      petalRef.current?.setDrifting(false)
      if (tl) {
        tl.scrollTrigger?.kill()
        tl.kill()
      }
      sceneRef.current?.dispose()
      sceneRef.current = null
      ScrollTrigger.refresh()
    }
  }, [active, reduced, assets])

  // ------------------------------------------------------------------ view
  return (
    <section
      ref={sectionRef}
      className="relative z-10 h-svh"
      style={{ backgroundColor: 'var(--bg-0)' }}
      aria-label="the mooncake journey"
    >
      <div ref={viewRef} className="relative h-svh w-full overflow-hidden">
        {/* 2D frame canvas (scrub) */}
        <canvas ref={canvasRef} className="absolute inset-0 z-[1] h-full w-full will-change-transform" />

        {/* 3D mooncake (pop-out + drift) */}
        <div ref={threeRef} className="pointer-events-none absolute inset-0 z-[5]" />

        {/* soft ground shadow under the 3D cake */}
        <div
          ref={shadowRef}
          className="pointer-events-none absolute z-[4] -translate-x-1/2 -translate-y-1/2 rounded-[50%]"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.55) 0%, transparent 68%)',
            opacity: 0,
            width: 10,
            height: 10,
          }}
        />

        {/* moon tap hotspot (pointer-tap armed in armMoonTap) */}
        <button
          ref={hotspotRef}
          type="button"
          aria-label={t('stage.moonHint')}
          className="absolute z-[45] -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full border-0 bg-transparent p-0"
          style={{ visibility: 'hidden', opacity: 0 }}
        >
          <span
            className="ring-pulse absolute inset-0 rounded-full"
            style={{
              border: '1.5px solid var(--accent)',
              boxShadow: '0 0 18px var(--accent-soft)',
              pointerEvents: 'none',
            }}
          />
        </button>

        {/* hint chips */}
        <div
          ref={moonHintRef}
          className="glass-card absolute z-30 -translate-x-1/2 whitespace-nowrap px-3 py-1.5 text-[11px] tracking-wide"
          style={{ opacity: 0, visibility: 'hidden', color: 'var(--text-dim)' }}
        >
          {t('stage.moonHint')}
        </div>
        <div
          ref={pressHintRef}
          className="glass-card absolute z-30 -translate-x-1/2 whitespace-nowrap px-3 py-1.5 text-[11px] tracking-wide"
          style={{ opacity: 0, visibility: 'hidden', color: 'var(--text-dim)' }}
        >
          {t('stage.longPressHint')}
        </div>
        <div
          ref={orbitHintRef}
          className="glass-card absolute z-30 -translate-x-1/2 whitespace-nowrap px-3 py-1.5 text-[11px] tracking-wide"
          style={{ opacity: 0, visibility: 'hidden', color: 'var(--text-dim)' }}
        >
          {t('stage.orbitHint')}
        </div>

        {/* easter-egg layers */}
        <PetalLayer ref={petalRef} />
        <JadeRabbit ref={rabbitRef} onPound={onRabbitTap} />
        <ChangEPanel ref={changERef} name={t('stage.change.name')} text={t('stage.change.text')} />
        <CrossSectionOverlay ref={crossRef} title={t('stage.cross.title')} text={t('stage.cross.text')} />

        {/* invisible long-press pad over the cake (scroll gestures still pass) */}
        <div
          ref={cakeHitRef}
          className="absolute z-[6] -translate-x-1/2 -translate-y-1/2"
          style={{ touchAction: 'pan-y' }}
        />

        {/* formation caption */}
        <p
          ref={captionRef}
          className="font-display absolute bottom-[9%] left-1/2 z-20 w-full -translate-x-1/2 px-8 text-center text-sm italic tracking-wide md:text-base"
          style={{
            opacity: 0,
            visibility: 'hidden',
            color: 'var(--text-dim)',
            textShadow: '0 2px 14px var(--bg-0)',
          }}
        >
          {t('stage.formation')}
        </p>
      </div>
    </section>
  )
}




