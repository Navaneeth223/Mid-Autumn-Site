import { useEffect, useRef } from 'react'
import { useReducedMotion } from '../hooks/useReducedMotion.js'

// ---------------------------------------------------------------------------
// Fixed full-viewport ambient canvas BEHIND everything: twinkling stars +
// slow drifting osmanthus petals. Palette + densities are read from the
// active theme's CSS variables (see theme.css --star / --petal / counts).
// Reduced motion: one static frame, no loop.
// ---------------------------------------------------------------------------

export default function AmbientCanvas() {
  const ref = useRef(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    let w = 0
    let h = 0
    let raf = 0
    let running = !document.hidden
    let stars = []
    let petals = []
    let pal = { star: '255,244,214', petal: '#e8b84b', starCount: 120, petalCount: 4 }

    const readPalette = () => {
      const cs = getComputedStyle(document.documentElement)
      pal.star = cs.getPropertyValue('--star').trim() || '255,244,214'
      pal.petal = cs.getPropertyValue('--petal').trim() || '#e8b84b'
      pal.starCount = parseInt(cs.getPropertyValue('--star-count')) || 120
      pal.petalCount = parseInt(cs.getPropertyValue('--petal-count')) || 4
    }

    const newPetal = (anywhere) => ({
      x: Math.random() * w,
      y: anywhere ? Math.random() * h : -24,
      vy: 14 + Math.random() * 24,
      sway: 10 + Math.random() * 22,
      ph: Math.random() * Math.PI * 2,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 1.1,
      s: 0.55 + Math.random() * 0.8,
    })

    const seed = () => {
      stars = Array.from({ length: pal.starCount }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.4 + Math.random() * 1.2,
        ph: Math.random() * Math.PI * 2,
        sp: 0.3 + Math.random() * 1.1,
      }))
      petals = Array.from({ length: pal.petalCount }, () => newPetal(true))
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      readPalette()
      seed()
      if (reduced) drawStatic()
    }

    const drawPetal = (p, alpha) => {
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rot)
      ctx.globalAlpha = alpha
      ctx.fillStyle = pal.petal
      ctx.beginPath()
      ctx.ellipse(0, 0, 4.2 * p.s, 6.4 * p.s, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }

    const drawStatic = () => {
      ctx.clearRect(0, 0, w, h)
      for (const s of stars) {
        ctx.fillStyle = `rgba(${pal.star},0.5)`
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fill()
      }
      for (const p of petals) drawPetal(p, 0.5)
    }

    let last = 0
    const loop = (t) => {
      raf = requestAnimationFrame(loop)
      const dt = Math.min(0.05, (t - last) / 1000 || 0.016)
      last = t
      const ts = t / 1000
      ctx.clearRect(0, 0, w, h)
      // stars
      for (const s of stars) {
        const a = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(ts * s.sp + s.ph))
        ctx.fillStyle = `rgba(${pal.star},${a.toFixed(3)})`
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fill()
      }
      // petals (sway on a sine, respawn above the top edge)
      for (let i = 0; i < petals.length; i++) {
        const p = petals[i]
        p.y += p.vy * dt
        p.x += Math.sin(ts * 0.8 + p.ph) * p.sway * dt
        p.rot += p.vr * dt
        if (p.y > h + 30) petals[i] = newPetal(false)
        if (p.x < -30) p.x = w + 20
        if (p.x > w + 30) p.x = -20
        drawPetal(p, 0.72)
      }
    }

    const start = () => {
      if (reduced || raf) return
      last = performance.now()
      raf = requestAnimationFrame(loop)
    }
    const stop = () => {
      if (raf) cancelAnimationFrame(raf)
      raf = 0
    }
    const onVis = () => {
      running = !document.hidden
      running ? start() : stop()
    }

    // re-palette whenever data-theme flips on <html>
    const themeObserver = new MutationObserver(() => {
      readPalette()
      seed()
      if (reduced) drawStatic()
    })
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

    window.addEventListener('resize', resize, { passive: true })
    document.addEventListener('visibilitychange', onVis)
    resize()
    if (!reduced) start()
    else drawStatic()

    return () => {
      stop()
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVis)
      themeObserver.disconnect()
    }
  }, [reduced])

  return <canvas ref={ref} className="pointer-events-none fixed inset-0 z-0" aria-hidden="true" />
}
