import { useScrollFraction } from '../hooks/useScrollFraction.js'

// ---------------------------------------------------------------------------
// The 8-phase moon strip, re-created inline from moon-phases.svg (same
// geometry) so any single phase renders crisply at any size — used TWICE by
// the brief: as the loading-progress "moon filling in" (PhaseDisc) AND as
// the pinned scroll-progress meter below (new moon at page top, FULL moon
// exactly at the closing section).
// ---------------------------------------------------------------------------

const PHASES = [
  { cx: 40, d: 'M40,15 A30,30 0 0 1 40,75 A30.00,30 0 0 1 40,15 Z' },
  { cx: 110, d: 'M110,15 A30,30 0 0 1 110,75 A21.43,30 0 0 1 110,15 Z' },
  { cx: 180, d: 'M180,15 A30,30 0 0 1 180,75 A12.86,30 0 0 1 180,15 Z' },
  { cx: 250, d: 'M250,15 A30,30 0 0 1 250,75 A4.29,30 0 0 1 250,15 Z' },
  { cx: 320, d: 'M320,15 A30,30 0 0 1 320,75 A4.29,30 0 0 0 320,15 Z' },
  { cx: 390, d: 'M390,15 A30,30 0 0 1 390,75 A12.86,30 0 0 0 390,15 Z' },
  { cx: 460, d: 'M460,15 A30,30 0 0 1 460,75 A21.43,30 0 0 0 460,15 Z' },
  { cx: 530, d: 'M530,15 A30,30 0 0 1 530,75 A30.00,30 0 0 0 530,15 Z' },
]

// One moon phase disc. `active` lights it up with a soft glow.
export function PhaseDisc({ phase = 0, size = 44, active = true }) {
  const p = PHASES[Math.max(0, Math.min(7, phase))]
  return (
    <svg
      viewBox={`${p.cx - 32} 13 64 64`}
      width={size}
      height={size}
      style={active ? { filter: 'drop-shadow(0 0 7px var(--glow))' } : { opacity: 0.45 }}
      aria-hidden="true"
    >
      <circle cx="32" cy="32" r="30" fill="#FCEFD9" />
      <path d={p.d} fill="#1B1B3A" transform={`translate(${p.cx - 40} 0)`} />
      <circle cx="32" cy="32" r="30" fill="none" stroke="#D9A441" strokeWidth="1.5" opacity="0.6" />
    </svg>
  )
}

// Fixed corner meter showing overall page scroll as a moon phase.
export default function MoonPhaseMeter() {
  const fraction = useScrollFraction()
  const idx = Math.max(0, Math.min(7, Math.floor(fraction * 7.999)))
  return (
    <div
      className="glass-card fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-full px-3 py-2"
      title="the moon fills in as you travel"
    >
      <PhaseDisc phase={idx} size={34} />
      <div className="hidden flex-col leading-none sm:flex">
        <span className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-dim)' }}>
          moon
        </span>
        <span className="text-[11px] font-medium tabular-nums" style={{ color: 'var(--accent)' }}>
          {Math.round(fraction * 100)}%
        </span>
      </div>
    </div>
  )
}
