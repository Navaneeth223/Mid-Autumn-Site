import { forwardRef, useImperativeHandle, useRef } from 'react'
import { gsap } from '../lib/gsap.js'

// ---------------------------------------------------------------------------
// Petal layer — two jobs:
//   1. setDrifting(true): 2-3 petals float across the pinned stage while the
//      frame sequence plays, so the scrub never feels like "a video in a box".
//   2. burst(x, y): the gold-petal explosion when the rabbit is tapped
//      (6-8 petals, outward + gravity-ish arc, ~1s fade).
// Petals are INLINE svg (not <img>) because the petal file uses currentColor,
// which only inherits through inline SVG.
// ---------------------------------------------------------------------------

function Petal({ size = 14, style, className, ...rest }) {
  return (
    <svg
      viewBox="0 0 16 24"
      width={size}
      className={className}
      style={{ color: 'var(--petal)', ...style }}
      aria-hidden="true"
      {...rest}
    >
      <ellipse cx="8" cy="12" rx="5" ry="7.5" fill="currentColor" transform="rotate(25 8 12)" />
    </svg>
  )
}

const PetalLayer = forwardRef(function PetalLayer(_, ref) {
  const rootRef = useRef(null)
  const driftTimelines = useRef([])

  useImperativeHandle(ref, () => ({
    setDrifting(on) {
      const root = rootRef.current
      if (!root) return
      if (on && driftTimelines.current.length === 0) {
        const w = () => root.clientWidth
        const h = () => root.clientHeight
        driftTimelines.current = [0, 1, 2].map((i) => {
          const el = root.querySelector(`[data-drift='${i}']`)
          const travel = 9 + i * 2.5
          const tl = gsap.timeline({ repeat: -1, repeatRefresh: true, delay: i * 2.6 })
          tl.fromTo(
            el,
            { x: -30, y: h() * (0.12 + i * 0.18), rotation: 0, opacity: 0 },
            { opacity: 0.85, duration: 0.8 },
            0,
          )
            .to(el, { x: w() + 40, duration: travel, ease: 'none' }, 0)
            .to(
              el,
              {
                y: `+=${(0.5 + Math.random() * 0.5) * h() * 0.35}`,
                rotation: 260,
                duration: travel,
                ease: 'sine.inOut',
              },
              0,
            )
            .to(el, { opacity: 0, duration: 0.6 }, travel - 0.6)
          return tl
        })
      } else if (!on) {
        driftTimelines.current.forEach((tl) => tl.kill())
        driftTimelines.current = []
      }
    },

    burst(x, y) {
      const root = rootRef.current
      if (!root) return
      const n = 7
      for (let i = 0; i < n; i++) {
        const el = document.createElement('span')
        el.style.cssText =
          'position:absolute;left:0;top:0;will-change:transform,opacity;color:var(--petal);'
        el.innerHTML = `<svg viewBox="0 0 16 24" width="${9 + Math.random() * 6}"><ellipse cx="8" cy="12" rx="5" ry="7.5" fill="currentColor" transform="rotate(25 8 12)"/></svg>`
        root.appendChild(el)
        const ang = Math.random() * Math.PI * 2
        const dist = 55 + Math.random() * 85
        gsap.set(el, { x, y, rotation: 0, opacity: 1 })
        gsap.to(el, {
          x: x + Math.cos(ang) * dist,
          y: y + Math.sin(ang) * dist * 0.75 + 34, // slight fall
          rotation: (Math.random() - 0.5) * 420,
          opacity: 0,
          duration: 0.95 + Math.random() * 0.25,
          ease: 'power1.out',
          onComplete: () => el.remove(),
        })
      }
    },
  }))

  return (
    <div
      ref={rootRef}
      className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
      aria-hidden="true"
    >
      <Petal size={13} className="absolute left-0 top-0" style={{ opacity: 0 }} data-drift="0" />
      <Petal size={17} className="absolute left-0 top-0" style={{ opacity: 0 }} data-drift="1" />
      <Petal size={11} className="absolute left-0 top-0" style={{ opacity: 0 }} data-drift="2" />
    </div>
  )
})

export default PetalLayer
