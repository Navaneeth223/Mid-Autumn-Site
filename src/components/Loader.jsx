import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { PhaseDisc } from './MoonPhaseMeter.jsx'
import { usePrefs } from '../state/prefs.jsx'
import { useReducedMotion } from '../hooks/useReducedMotion.js'

// ---------------------------------------------------------------------------
// Loading screen.
//  - poster-hero.webp (best Variant-A still) as a dimmed, slowly drifting bg
//  - progress rendered as the moon "filling in" (phase 0 -> 7, new -> full)
//  - scroll stays locked (body.scroll-locked) until `done`, then we fade out
//    and hand control to the app (onGone -> unmount).
// ---------------------------------------------------------------------------
export default function Loader({ poster, progress, done, onGone }) {
  const ref = useRef(null)
  const { t } = usePrefs()
  const reduced = useReducedMotion()
  const phase = Math.max(0, Math.min(7, Math.floor(progress * 7.999)))
  const pct = Math.round(progress * 100)

  useEffect(() => {
    if (!done || !ref.current) return
    const el = ref.current
    if (reduced) {
      onGone()
      return
    }
    gsap.to(el, {
      opacity: 0,
      duration: 0.9,
      ease: 'power2.inOut',
      delay: 0.15,
      onComplete: onGone,
    })
    gsap.to(el.querySelector('[data-poster]'), { scale: 1.06, duration: 1.4, ease: 'power1.out' })
  }, [done, onGone, reduced])

  return (
    <div ref={ref} className="fixed inset-0 z-50 overflow-hidden" style={{ background: 'var(--bg-0)' }}>
      {/* poster backdrop (the "poster" pays off here before the hero) */}
      <img
        data-poster
        src={poster}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        style={{ opacity: 0.5 }}
        draggable="false"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 100% at 50% 30%, transparent 20%, var(--bg-0) 78%), linear-gradient(180deg, transparent 40%, var(--bg-0) 100%)',
        }}
      />

      {/* moon-filling progress */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-5">
        <PhaseDisc phase={phase} size={92} />
        <div className="font-display text-lg tracking-wide" style={{ color: 'var(--text)' }}>
          {t('loader.line')}
        </div>
        <div
          className="text-sm tabular-nums tracking-[0.3em]"
          style={{ color: 'var(--accent)' }}
          aria-live="polite"
        >
          {pct}%
        </div>
      </div>
    </div>
  )
}
