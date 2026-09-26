import { useEffect, useState } from 'react'
import { PreferencesProvider } from './state/prefs.jsx'
import { preloadAssets } from './lib/preload.js'
import { ScrollTrigger } from './lib/gsap.js'
import AmbientCanvas from './components/AmbientCanvas.jsx'
import Loader from './components/Loader.jsx'
import UIControls from './components/UIControls.jsx'
import ScrollMeter from './components/ScrollMeter.jsx'
import Hero from './components/Hero.jsx'
import ScrollStage from './components/ScrollStage.jsx'
import Closing from './components/Closing.jsx'

// ---------------------------------------------------------------------------
// App shell.
//   boot      -> preloadAssets (frames + model + locales + poster) with a
//                single weighted progress number for the loader
//   loader    -> poster bg + moon-phase progress; scroll LOCKED until done
//   app       -> hero -> festival panel (cake image + message) -> pinned
//                scroll stage (formation -> 3D cake finale), plus ambient
//                canvas, corner controls and the moon-phase scroll meter
// ---------------------------------------------------------------------------
export default function App() {
  const [assets, setAssets] = useState(null)
  const [progress, setProgress] = useState(0)
  const [loaderGone, setLoaderGone] = useState(false)

  const ready = !!assets
  const loaderDone = ready // Loader starts fading the moment assets resolve

  // ---- boot ---------------------------------------------------------------
  useEffect(() => {
    // a reload in the middle of the page would break pin measurement
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)

    document.body.classList.add('scroll-locked')
    let alive = true
    preloadAssets((p) => alive && setProgress(p)).then((res) => {
      if (!alive) return
      setAssets(res)
    })
    return () => {
      alive = false
    }
  }, [])

  // ---- unlock scroll once the loader has faded ----------------------------
  useEffect(() => {
    if (!loaderGone) return
    document.body.classList.remove('scroll-locked')
    requestAnimationFrame(() => ScrollTrigger.refresh())
  }, [loaderGone])

  // ---- the experience -----------------------------------------------------
  // PreferencesProvider wraps BOTH phases so the loader can use translations.
  return (
    <PreferencesProvider locales={assets?.locales ?? { en: {}, zh: {} }}>
      <AmbientCanvas />
      {ready ? (
        <>
          <UIControls />
          <Hero ready={loaderGone} />
          <Closing />
          <ScrollStage assets={assets} active={loaderGone} />
          <ScrollMeter />
        </>
      ) : (
        <Loader progress={progress} done={false} onGone={() => {}} />
      )}
      {!loaderGone && ready && (
        <Loader progress={progress} done={loaderDone} onGone={() => setLoaderGone(true)} />
      )}
    </PreferencesProvider>
  )
}
