import { useEffect, useRef } from 'react'
import { gsap } from '../lib/gsap.js'
import { PATHS } from '../lib/config.js'
import { usePrefs } from '../state/prefs.jsx'
import { useReducedMotion } from '../hooks/useReducedMotion.js'

// ---------------------------------------------------------------------------
// 6. CLOSING — the second Variant-A still (moon glowing) behind a short
//    bilingual message signed "— Navi", the thousand-year-old Su Shi line as
//    a soft-glowing caption, and the ambient canvas keeps drifting petals so
//    the page never feels "finished".
// ---------------------------------------------------------------------------
export default function Closing() {
  const { t } = usePrefs()
  const ref = useRef(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (reduced) {
      gsap.set(el.querySelectorAll('[data-close-item]'), { opacity: 1, y: 0 })
      return
    }
    const tween = gsap.fromTo(
      el.querySelectorAll('[data-close-item]'),
      { opacity: 0, y: 26 },
      {
        opacity: 1,
        y: 0,
        stagger: 0.16,
        duration: 1.05,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 62%' },
      },
    )
    return () => {
      tween.scrollTrigger?.kill()
      tween.kill()
    }
  }, [reduced])

  return (
    <section
      ref={ref}
      className="relative z-10 flex min-h-[108svh] items-center justify-center overflow-hidden"
      aria-label="a message for you"
    >
      {/* closing backdrop (Variant-A still, moon glowing) */}
      <div className="absolute inset-0">
        <img
          src={PATHS.closingBg}
          alt=""
          draggable="false"
          className="h-full w-full object-cover"
          style={{ opacity: 0.42 }}
        />
        {/* blend top & bottom into the page sky so the seam is invisible */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, var(--bg-0) 0%, transparent 26%, transparent 62%, var(--bg-0) 100%)',
          }}
        />
      </div>

      <div className="relative z-10 mx-6 max-w-xl py-28 text-center">
        {/* Su Shi — the glowing caption */}
        <p
          data-close-item
          className="font-display text-glow text-xl leading-relaxed md:text-2xl"
          style={{ color: 'var(--accent)' }}
        >
          {t('closing.shi')}
        </p>
        <p data-close-item className="mt-2 text-xs italic" style={{ color: 'var(--text-dim)' }}>
          {t('closing.shiNote')}
        </p>

        <h2
          data-close-item
          className="font-display mt-12 text-3xl leading-snug md:text-4xl"
          style={{ color: 'var(--text)' }}
        >
          {t('closing.title')}
        </h2>
        <p
          data-close-item
          className="mx-auto mt-6 max-w-md text-base leading-loose"
          style={{ color: 'var(--text-dim)' }}
        >
          {t('closing.message')}
        </p>
        <p
          data-close-item
          className="font-display mt-12 text-lg tracking-wide"
          style={{ color: 'var(--accent)' }}
        >
          {t('closing.signature')}
        </p>
      </div>
    </section>
  )
}
