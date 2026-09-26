import { forwardRef } from 'react'

// ---------------------------------------------------------------------------
// Cross-section overlay — the long-press reward. A simple layered circle
// (crust -> paste -> yolk, deliberately not a real 3D cutaway per the brief)
// plus the one-line meaning: round = reunion, yolk = the full moon itself.
// ---------------------------------------------------------------------------
const CrossSectionOverlay = forwardRef(function CrossSectionOverlay({ title, text }, ref) {
  return (
    <div
      ref={ref}
      className="pointer-events-none absolute z-30 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
      style={{ opacity: 0, visibility: 'hidden' }}
    >
      <div className="relative h-36 w-36 md:h-44 md:w-44">
        {/* crust */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle at 40% 32%, #E8B571 0%, #B97E2C 78%)',
            boxShadow: '0 16px 44px var(--shadow)',
          }}
        />
        {/* paste */}
        <div
          className="absolute inset-[16%] rounded-full"
          style={{ background: 'radial-gradient(circle at 42% 36%, #F7E3B9 0%, #E9CD8E 80%)' }}
        />
        {/* yolk — the moon itself */}
        <div
          className="yolk-glow absolute inset-[38%] rounded-full"
          style={{ background: 'radial-gradient(circle at 45% 40%, #FFE9A8 0%, #E8B84B 85%)' }}
        />
      </div>
      <div className="glass-card mt-3 max-w-[16rem] p-3 text-center md:max-w-xs">
        <p className="font-display text-sm md:text-base" style={{ color: 'var(--accent)' }}>
          {title}
        </p>
        <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--text-dim)' }}>
          {text}
        </p>
      </div>
    </div>
  )
})

export default CrossSectionOverlay
