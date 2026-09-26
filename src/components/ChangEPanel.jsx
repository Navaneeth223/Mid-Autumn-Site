import { forwardRef, useImperativeHandle, useRef } from 'react'
import { gsap } from '../lib/gsap.js'
import { PATHS } from '../lib/config.js'

// ---------------------------------------------------------------------------
// Chang'e panel — the reward for tapping the moon. The silhouette + a short
// EN/ZH caption of the elixir legend. show(anchorPx) / hide() are imperative
// so ScrollStage stays in control of timing and positioning.
// ---------------------------------------------------------------------------
const ChangEPanel = forwardRef(function ChangEPanel({ name, text }, ref) {
  const rootRef = useRef(null)

  useImperativeHandle(ref, () => ({
    show(anchor) {
      const el = rootRef.current
      if (!el) return
      el.style.left = `${anchor.x}px`
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
        alt="Chang'e, the moon goddess"
        draggable="false"
        className="floaty mx-auto w-40 drop-shadow-[0_10px_30px_var(--shadow)] md:w-52"
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
