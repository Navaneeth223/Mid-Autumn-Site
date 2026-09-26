import { useEffect, useState } from 'react'

// Global scroll fraction (0 at top, 1 at the very bottom), rAF-throttled so
// it never does layout work more than once per frame. Drives the moon-phase
// scroll meter: new moon at the top, FULL moon exactly at the closing.
export function useScrollFraction() {
  const [fraction, setFraction] = useState(0)
  useEffect(() => {
    let raf = 0
    const measure = () => {
      raf = 0
      const max = document.documentElement.scrollHeight - window.innerHeight
      setFraction(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0)
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    measure()
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])
  return fraction
}
