import { useEffect, useRef } from 'react'
import { gsap, ScrollTrigger } from '../lib/gsap.js'
import { PATHS } from '../lib/config.js'
import { usePrefs } from '../state/prefs.jsx'
import { useReducedMotion } from '../hooks/useReducedMotion.js'

// ---------------------------------------------------------------------------
// 1. HERO — greeting addressed to Ames by name, the fixed 中秋节快乐 line as
//    a cultural touch, glowing moon, swaying paper lantern, drifting stars
//    (from the ambient canvas), and a "scroll to begin" hint.
//    Content gently parallaxes away as the scroll journey starts.
// ---------------------------------------------------------------------------
export default function Hero({ ready }) {
  const { t } = usePrefs()
  const ref = useRef(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (!ready || !ref.current) return
    const el = ref.current
    const items = el.querySelectorAll('[data-hero-item]')

    if (reduced) {
      gsap.set(items, { opacity: 1, y: 0 })
      return
    }
    // entrance: soft rise, one item after another
    gsap.fromTo(
      items,
      { opacity: 0, y: 26 },
      { opacity: 1, y: 0, stagger: 0.14, duration: 1.15, ease: 'power3.out', clearProps: 'transform' },
    )
    // exit: parallax away while the scrub section pins
    gsap.to(el.querySelector('[data-hero-inner]'), {
      opacity: 0,
      y: -80,
      ease: 'none',
      scrollTrigger: { trigger: el, start: 'top top', end: '70% top', scrub: true },
    })
    return () => {
      ScrollTrigger.getAll().forEach((st) => {
        if (st.trigger === el) st.kill()
      })
    }
  }, [ready, reduced])

  return (
    <section
      ref={ref}
      className="sky relative z-10 flex h-svh items-center justify-center overflow-hidden"
    >
      {/* glowing full moon */}
      <div
        data-hero-item
        className="absolute right-[10%] top-[13%] h-28 w-28 rounded-full md:right-[14%] md:top-[15%] md:h-36 md:w-36"
        style={{
          background:
            'radial-gradient(circle at 38% 32%, #fffaf0 0%, var(--glow) 55%, var(--accent-soft) 100%)',
          boxShadow: '0 0 60px 18px var(--accent-soft), 0 0 140px 60px var(--accent-soft)',
          opacity: 0,
        }}
      />

      {/* osmanthus branch, faint, top-left */}
      <img
        src={PATHS.images.branch}
        alt=""
        draggable="false"
        className="absolute -left-6 -top-2 w-40 -scale-x-100 opacity-30 md:w-56"
      />

      {/* swaying paper lantern, bottom-left */}
      <img
        src={PATHS.images.lantern}
        alt=""
        draggable="false"
        className="lantern-sway absolute bottom-[6%] left-[7%] w-20 drop-shadow-[0_14px_30px_var(--shadow)] md:w-28"
      />

      <div data-hero-inner className="relative z-10 mx-6 max-w-2xl text-center">
        {/* the Chinese line stays in BOTH language modes — cultural touch */}
        <p
          data-hero-item
          className="font-display text-sm tracking-[0.55em] md:text-base"
          style={{ color: 'var(--accent)', opacity: 0 }}
        >
          中秋节快乐
        </p>
        <h1
          data-hero-item
          className="font-display mt-4 text-4xl leading-tight md:text-6xl"
          style={{ color: 'var(--text)', opacity: 0 }}
        >
          {t('hero.title')}
        </h1>
        <p
          data-hero-item
          className="mx-auto mt-6 max-w-md text-base leading-relaxed md:text-lg"
          style={{ color: 'var(--text-dim)', opacity: 0 }}
        >
          {t('hero.personal')}
        </p>
      </div>

      {/* scroll hint */}
      <div
        data-hero-item
        className="absolute bottom-7 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1"
        style={{ color: 'var(--text-dim)', opacity: 0 }}
      >
        <span className="text-xs tracking-[0.28em] uppercase">{t('hero.scrollHint')}</span>
        <svg width="18" height="10" viewBox="0 0 18 10" className="hint-bob" aria-hidden="true">
          <path d="M1 1 L9 8 L17 1" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </div>
    </section>
  )
}
