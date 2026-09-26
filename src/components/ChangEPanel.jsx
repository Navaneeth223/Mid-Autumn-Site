import { forwardRef, useImperativeHandle, useRef } from 'react'
import { gsap } from '../lib/gsap.js'
import { PATHS } from '../lib/config.js'

// ---------------------------------------------------------------------------
// Chang'e panel — the reward for tapping the moon. The Moon Palace vignette
// (jade rabbit pounding the elixir, hand-built SVG rendered to PNG) + a short
// EN/ZH caption of the legend. show(anchorPx) / hide() are imperative so
// ScrollStage stays in control of timing and positioning.
// ---------------------------------------------------------------------------
const ChangEPanel = forwardRef(function ChangEPanel({ name, text }, ref) {
  const rootRef = useRef(null)

  useImperativeHandle(ref, () => ({
    show(anchor) {
      const el = rootRef.current
      if (!el) return
      // clamp inside the viewport: the moon anchor can sit near the screen
      // edge on portrait phones (cover-crop pushes it to ~90% width)
      const half = el.offsetWidth / 2
      const vw = window.innerWidth
      const x = Math.min(vw - half - 8, Math.max(half + 8, anchor.x))
      el.style.left = `${x}px`
      el.style.top = `${anchor.y + anchor.r}px`
      gsap.killTweensOf(el)
      gsap.fromTo(
        el,
        { autoAlpha: 0, y: 14, scale: 0.94 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.55, ease: 'power3.out' },
      )
    },
    hide() {
      const el = rootRef.current
      if (!el) return
      gsap.killTweensOf(el)
      gsap.to(el, { autoAlpha: 0, y: 10, duration: 0.35, ease: 'power2.in' })
    },
  }))

  return (
    <div
      ref={rootRef}
      className="absolute z-30 w-64 md:w-80"
      style={{ opacity: 0, visibility: 'hidden', transform: 'translate(-50%, 0)' }}
    >
      <img
        src={PATHS.images.change}
        alt="Chang'e's moon — the jade rabbit pounding the elixir of immortality"
        draggable="false"
        className="floaty mx-auto w-44 drop-shadow-[0_10px_30px_var(--shadow)] md:w-56"
      />
      <div className="glass-card mt-2 p-4 text-center">
        <p className="font-display text-base" style={{ color: 'var(--accent)' }}>
          {name}
        </p>
        <p className="mt-1.5 text-xs leading-relaxed md:text-[13px]" style={{ color: 'var(--text-dim)' }}>
          {text}
        </p>
      </div>
    </div>
  )
})

export default ChangEPanel
