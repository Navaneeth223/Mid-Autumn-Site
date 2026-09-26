import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { usePrefs } from '../state/prefs.jsx'
import { useReducedMotion } from '../hooks/useReducedMotion.js'

// ---------------------------------------------------------------------------
// Loading screen — rebuilt from scratch (the old moon-phase disc popped
// through 8 discrete SVGs and the late-loading poster flashed; both read as
// glitchy).
//
// New design: a quiet night sky (theme tokens) with a few twinkling stars and
// drifting gold dust, and at the center a thin golden arc that fills smoothly
// around a gently-breathing osmanthus seal carrying 月 — the moon. Progress is
// LERPed in a rAF loop and written straight to the DOM (no React re-renders),
// so the arc, the tip dot and the percentage never pop no matter how unevenly
// assets arrive. Scroll stays locked (body.scroll-locked) until `done`, then
// we fade out and hand control to the app (onGone -> unmount).
// ---------------------------------------------------------------------------

const R = 88
const CIRC = 2 * Math.PI * R
const PETALS = [0, 45, 90, 135, 180, 225, 270, 315]
const STARS = [
  [12, 18], [26, 64], [38, 12], [57, 78], [66, 24],
  [74, 56], [85, 16], [91, 70], [18, 84], [47, 92],
]

export default function Loader({ progress, done, onGone }) {
  const ref = useRef(null)
  const arcRef = useRef(null)
  const tipRef = useRef(null)
  const pctRef = useRef(null)
  const targetRef = useRef(0)
  const bornAt = useRef(0)
  const { t } = usePrefs()
  const reduced = useReducedMotion()

  useEffect(() => {
    targetRef.current = progress
  }, [progress])

  // ---- smoothing loop: arc + tip + pct all follow one lerped value --------
  useEffect(() => {
    const arc = arcRef.current
    const tip = tipRef.current
    const pct = pctRef.current
    if (!arc || !tip || !pct) return
    arc.style.strokeDasharray = String(CIRC)
    let shown = 0
    let lastWritten = -1
    let last = performance.now()
    let raf = 0
    const loop = (now) => {
      raf = requestAnimationFrame(loop)
      const dt = Math.min((now - last) / 1000, 0.05) || 0.016
      last = now
      const rate = reduced ? 30 : 7.5 // snappier when motion is reduced
      shown += (targetRef.current - shown) * (1 - Math.exp(-rate * dt))
      const v = Math.min(1, Math.max(0, shown))
      arc.style.strokeDashoffset = String(CIRC * (1 - v))
      tip.style.transform = `rotate(${(v * 360).toFixed(2)}deg)`
      const p = Math.round(v * 100)
      if (p !== lastWritten) {
        lastWritten = p
        pct.textContent = `${p}%`
      }
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [reduced])

  // ---- exit: hold a beat so quick loads don't flash, then fade -----------
  useEffect(() => {
    if (!done || !ref.current) return
    const el = ref.current
    if (reduced) {
      onGone()
      return
    }
    const hold = Math.max(0, 700 - (performance.now() - bornAt.current))
    const tid = window.setTimeout(() => {
      gsap.to(el, { opacity: 0, duration: 0.9, ease: 'power2.inOut', onComplete: onGone })
      gsap.to(el.querySelector('[data-seal]'), { scale: 1.08, duration: 1.4, ease: 'power1.out' })
    }, hold)
    return () => clearTimeout(tid)
  }, [done, onGone, reduced])

  bornAt.current = performance.now()

  return (
    <div
      ref={ref}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'var(--bg-0)' }}
      role="status"
      aria-live="polite"
    >
      {/* night-sky wash */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(130% 90% at 50% 12%, var(--bg-2) 0%, transparent 52%), radial-gradient(120% 70% at 50% 100%, var(--bg-1) 0%, transparent 60%)',
          opacity: 0.9,
        }}
      />
      {/* twinkling stars + drifting gold dust (CSS only, tiny cost) */}
      <div className="absolute inset-0" aria-hidden="true">
        {STARS.map(([x, y], i) => (
          <span
            key={i}
            className="loader-star absolute rounded-full"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              width: i % 3 === 0 ? 3 : 2,
              height: i % 3 === 0 ? 3 : 2,
              background: 'rgb(var(--star))',
              animationDelay: `${(i * 0.37).toFixed(2)}s`,
            }}
          />
        ))}
        {[0, 1, 2].map((i) => (
          <span
            key={`d${i}`}
            className="loader-dust absolute rounded-full"
            style={{
              left: `${24 + i * 26}%`,
              bottom: '9%',
              width: 5,
              height: 5,
              background: 'var(--accent)',
              animationDelay: `${(i * 2.3).toFixed(1)}s`,
            }}
          />
        ))}
      </div>

      {/* the golden arc + breathing osmanthus seal */}
      <div data-seal className="relative" style={{ willChange: 'transform' }}>
        <svg width="220" height="220" viewBox="0 0 220 220" aria-hidden="true">
          <defs>
            <linearGradient id="loaderGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFE9B0" />
              <stop offset="55%" stopColor="#F0C767" />
              <stop offset="100%" stopColor="#C89B4B" />
            </linearGradient>
            <radialGradient id="sealFace" cx="42%" cy="36%" r="80%">
              <stop offset="0%" stopColor="#FFF3D0" stopOpacity="0.9" />
              <stop offset="70%" stopColor="#F0C767" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#F0C767" stopOpacity="0.1" />
            </radialGradient>
          </defs>
          {/* track */}
          <circle cx="110" cy="110" r={R} fill="none" stroke="var(--accent-soft)" strokeWidth="2.5" />
          {/* progress arc (starts at 12 o'clock) */}
          <g transform="rotate(-90 110 110)">
            <circle
              ref={arcRef}
              cx="110"
              cy="110"
              r={R}
              fill="none"
              stroke="url(#loaderGold)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeDashoffset={CIRC}
              style={{ filter: 'drop-shadow(0 0 6px var(--glow))' }}
            />
          </g>
          {/* glowing tip dot riding the arc */}
          <g ref={tipRef} style={{ transformOrigin: '110px 110px' }}>
            <circle cx="110" cy={110 - R} r="4" fill="var(--glow)" />
          </g>
          {/* the seal — 8 osmanthus petals around 月 */}
          <g className="seal-breath" style={{ transformOrigin: '110px 110px' }}>
            {PETALS.map((a) => (
              <ellipse
                key={a}
                cx="110"
                cy="74"
                rx="11"
                ry="25"
                fill="url(#sealFace)"
                stroke="#F0C767"
                strokeOpacity="0.28"
                strokeWidth="1"
                transform={`rotate(${a} 110 110)`}
              />
            ))}
            <circle cx="110" cy="110" r="30" fill="var(--bg-0)" stroke="#F0C767" strokeOpacity="0.4" />
            <text
              x="110"
              y="123"
              textAnchor="middle"
              className="font-display"
              fontSize="38"
              fill="url(#loaderGold)"
              style={{ filter: 'drop-shadow(0 0 10px var(--accent-soft))' }}
            >
              月
            </text>
          </g>
        </svg>
      </div>

      <div className="relative mt-6 font-display text-lg tracking-wide" style={{ color: 'var(--text)' }}>
        {t('loader.line')}
      </div>
      <div
        ref={pctRef}
        className="relative mt-2 text-sm tabular-nums tracking-[0.3em]"
        style={{ color: 'var(--accent)' }}
      >
        0%
      </div>
    </div>
  )
}
