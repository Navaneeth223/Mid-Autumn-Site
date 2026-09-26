import { useEffect, useRef } from 'react'
import { usePrefs } from '../state/prefs.jsx'

// ---------------------------------------------------------------------------
// The journey meter — rebuilt. The old bottom-left moon badge jumped through
// 8 discrete phases and re-rendered React on every scroll frame.
//
// New design: a slim glass rail on the RIGHT edge. A golden fill grows from
// the top, a glowing dot rides its leading edge, and a tabular percentage
// sits underneath. One rAF loop measures the live scroll position every
// frame (immune to pin/refresh height changes) and writes styles directly
// to the DOM — zero React re-renders, values eased so they never stutter.
// ---------------------------------------------------------------------------

export default function ScrollMeter() {
  const fillRef = useRef(null)
  const dotRef = useRef(null)
  const pctRef = useRef(null)
  const { t } = usePrefs()

  useEffect(() => {
    const fill = fillRef.current
    const dot = dotRef.current
    const pct = pctRef.current
    if (!fill || !dot || !pct) return
    let shown = -1
    let lastWritten = -1
    let raf = 0
    const loop = () => {
      raf = requestAnimationFrame(loop)
      const max = document.documentElement.scrollHeight - window.innerHeight
      const target = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
      shown = shown < 0 ? target : shown + (target - shown) * 0.24
      const pctV = Math.round(shown * 100)
      if (pctV !== lastWritten) {
        lastWritten = pctV
        pct.textContent = `${pctV}%`
      }
      const h = `${(shown * 100).toFixed(2)}%`
      fill.style.height = h
      dot.style.top = h
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div
      className="fixed right-3 top-1/2 z-40 flex -translate-y-1/2 flex-col items-center gap-2.5"
      aria-label="scroll progress"
    >
      <span
        className="text-[9px] uppercase tracking-[0.32em]"
        style={{ color: 'var(--text-dim)', writingMode: 'vertical-rl' }}
      >
        {t('meter.label')}
      </span>
      <div
        className="relative h-[30vh] max-h-52 min-h-24 w-[3px] overflow-visible rounded-full"
        style={{ background: 'var(--accent-soft)' }}
      >
        <div
          ref={fillRef}
          className="absolute left-0 top-0 w-full rounded-full"
          style={{
            height: '0%',
            background: 'linear-gradient(180deg, var(--accent), var(--glow))',
            boxShadow: '0 0 8px var(--accent-soft)',
          }}
        />
        <div
          ref={dotRef}
          className="absolute left-1/2 h-[7px] w-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ top: '0%', background: 'var(--glow)', boxShadow: '0 0 10px 2px var(--accent-soft)' }}
        />
      </div>
      <span ref={pctRef} className="text-[11px] font-medium tabular-nums" style={{ color: 'var(--accent)' }}>
        0%
      </span>
    </div>
  )
}