import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

// ---------------------------------------------------------------------------
// Preferences: theme (dawn/dusk/night) + language (en/zh).
//  - <html data-theme> is flipped directly -> CSS variables switch instantly,
//    zero React re-render cost for the palette.
//  - Language swaps copy through the locale JSONs (loaded once, in preload).
//  - Choices persist in localStorage; the inline <head> script already applied
//    the right theme pre-paint, we just adopt it here.
// ---------------------------------------------------------------------------

const Ctx = createContext(null)
export const THEMES = ['dawn', 'dusk', 'night']

export function PreferencesProvider({ locales, children }) {
  const [theme, setThemeState] = useState(
    () => document.documentElement.getAttribute('data-theme') || 'night',
  )
  const [lang, setLangState] = useState(() =>
    localStorage.getItem('ma-lang') === 'zh' ? 'zh' : 'en',
  )

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try {
      localStorage.setItem('ma-theme', theme)
    } catch { /* private mode */ }
    // keep the browser UI chrome (address bar) on-palette
    const meta = document.querySelector('meta[name="theme-color"]')
    const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg-0').trim()
    if (meta && bg) meta.setAttribute('content', bg)
  }, [theme])

  useEffect(() => {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en'
    try {
      localStorage.setItem('ma-lang', lang)
    } catch { /* private mode */ }
  }, [lang])

  const cycleTheme = useCallback(
    () => setThemeState((t) => THEMES[(THEMES.indexOf(t) + 1) % THEMES.length]),
    [],
  )

  // t('hero.personal') -> string from the active locale (dot-path lookup)
  const t = useCallback(
    (path) => {
      const dict = locales?.[lang]
      const v = path.split('.').reduce((o, k) => (o == null ? o : o[k]), dict)
      return typeof v === 'string' ? v : path
    },
    [locales, lang],
  )

  const value = useMemo(
    () => ({ theme, setTheme: setThemeState, cycleTheme, lang, setLang: setLangState, t, locales }),
    [theme, cycleTheme, lang, t, locales],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function usePrefs() {
  return useContext(Ctx)
}
