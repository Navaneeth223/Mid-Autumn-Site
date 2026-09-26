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
// around a hand-drawn vignette — the jade rabbit pounding the elixir beneath a
// full moon (pure SVG art; no emoji or character glyphs). Progress is
// LERPed in a rAF loop and written straight to the DOM (no React re-renders),
// so the arc, the tip dot and the percentage never pop no matter how unevenly
// assets arrive. Scroll stays locked (body.scroll-locked) until `done`, then
// we fade out and hand control to the app (onGone -> unmount).
// ---------------------------------------------------------------------------

const R = 88
const CIRC = 2 * Math.PI * R
const STARS = [
  [12, 18], [26, 64], [38, 12], [57, 78], [66, 24],
  [74, 56], [85, 16], [91, 70], [18, 84], [47, 92],
]

// A tiny 4-petal osmanthus blossom (sprig decoration around the moon).
const Blossom = ({ x, y, r = 2 }) => (
  <g fill="#F0C767">
    {[0, 90, 180, 270].map((a) => (
      <circle
        key={a}
        cx={x + r * Math.cos((a * Math.PI) / 180)}
        cy={y + r * Math.sin((a * Math.PI) / 180)}
        r={r * 0.72}
      />
    ))}
    <circle cx={x} cy={y} r={r * 0.55} fill="#C89B4B" />
  </g>
)

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

      {/* the golden arc + breathing moon vignette (jade rabbit seal) */}
      <div data-seal className="relative" style={{ willChange: 'transform' }}>
        <svg width="220" height="220" viewBox="0 0 220 220" aria-hidden="true">
          <defs>
            <linearGradient id="loaderGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFE9B0" />
              <stop offset="55%" stopColor="#F0C767" />
              <stop offset="100%" stopColor="#C89B4B" />
            </linearGradient>
            <radialGradient id="moonHalo" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#F7D98F" stopOpacity="0.5" />
              <stop offset="55%" stopColor="#F0C767" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#F0C767" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="moonBody" cx="38%" cy="30%" r="80%">
              <stop offset="0%" stopColor="#FFFBEC" />
              <stop offset="55%" stopColor="#F9E7BC" />
              <stop offset="100%" stopColor="#EFD08A" />
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
          {/* the seal — jade rabbit pounding the elixir beneath a full moon */}
          <g className="seal-breath" style={{ transformOrigin: '110px 110px' }}>
            <circle cx="110" cy="107" r="76" fill="url(#moonHalo)" />
            <circle cx="110" cy="107" r="52" fill="url(#moonBody)" stroke="#F0C767" strokeOpacity="0.5" strokeWidth="1" />
            {/* faint craters */}
            <g fill="#D9A85F">
              <ellipse cx="88" cy="84" rx="6.5" ry="4.6" opacity="0.22" />
              <ellipse cx="134" cy="70" rx="5" ry="3.5" opacity="0.2" />
            </g>
            {/* the rabbit — night silhouette, sitting and leaning toward its mortar */}
            <g fill="var(--bg-0)">
              <ellipse cx="108" cy="72" rx="4.5" ry="12.5" transform="rotate(-14 108 72)" />
              <ellipse cx="122" cy="70" rx="4.5" ry="12.5" transform="rotate(10 122 70)" />
              <circle cx="116" cy="90" r="10.5" />
              <ellipse cx="117" cy="101" rx="6.5" ry="9" transform="rotate(-18 117 101)" />
              <ellipse cx="126" cy="112" rx="13" ry="18.5" />
              <circle cx="130" cy="127" r="9.5" />
              <ellipse cx="124" cy="134" rx="6" ry="3.5" />
              <circle cx="133.5" cy="126.5" r="4.5" />
            </g>
            {/* mortar, same silhouette */}
            <g fill="var(--bg-0)">
              <path d="M74,137 Q75,152 90,153 Q105,152 106,137 Z" />
              <ellipse cx="90" cy="137" rx="13.5" ry="4.5" />
            </g>
            {/* pestle + paw — gently pounding (see .loader-pestle in index.css) */}
            <g className="loader-pestle" style={{ transformOrigin: '110px 120px' }}>
              <circle cx="112" cy="121" r="5.5" fill="var(--bg-0)" />
              <line x1="110" y1="120" x2="95" y2="134" stroke="var(--bg-0)" strokeWidth="4" strokeLinecap="round" />
            </g>
            {/* a single gold eye catches the light */}
            <circle cx="112.5" cy="87" r="1.5" fill="#F0C767" opacity="0.9" />
            {/* osmanthus sprig drifting off the moon's shoulder */}
            <g>
              <path d="M134,66 C144,60 152,58 158,60" stroke="url(#loaderGold)" strokeWidth="1.6" fill="none" strokeLinecap="round" />
              <Blossom x={150} y={57} />
              <Blossom x={141} y={64} r={2.6} />
              <Blossom x={157} y={68} r={2.4} />
            </g>
            {/* a few fixed gold stars between moon and ring */}
            <g fill="#F0C767">
              <circle cx="48" cy="96" r="1.6" opacity="0.85" />
              <circle cx="172" cy="84" r="1.6" opacity="0.85" />
              <circle cx="163" cy="140" r="1.3" opacity="0.7" />
              <circle cx="57" cy="146" r="1.3" opacity="0.7" />
            </g>
            {/* delicate inner ring */}
            <circle cx="110" cy="110" r="68" fill="none" stroke="#F0C767" strokeOpacity="0.3" strokeWidth="1" strokeDasharray="1 7" strokeLinecap="round" />
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
