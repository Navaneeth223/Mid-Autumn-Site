import { usePrefs } from '../state/prefs.jsx'

// Corner controls: theme cycle (dawn -> dusk -> night) + language (EN/中文).
// Small, glassy, always reachable — they sit above everything (z-40).
const THEME_ICON = { dawn: '🌅', dusk: '🌇', night: '🌕' }
const THEME_KEY = { dawn: 'ui.themeDawn', dusk: 'ui.themeDusk', night: 'ui.themeNight' }

export default function UIControls() {
  const { theme, cycleTheme, lang, setLang, t } = usePrefs()
  return (
    <div className="fixed right-3 top-3 z-40 flex items-center gap-2">
      <button
        type="button"
        onClick={cycleTheme}
        title={t(THEME_KEY[theme])}
        className="glass-card flex h-10 items-center gap-1.5 rounded-full px-3 text-sm transition-transform active:scale-90 hover:scale-105"
        style={{ color: 'var(--text)' }}
      >
        <span aria-hidden="true">{THEME_ICON[theme]}</span>
        <span className="hidden sm:inline text-xs tracking-wide">{t(THEME_KEY[theme])}</span>
      </button>
      <button
        type="button"
        onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
        title="language"
        className="glass-card flex h-10 items-center rounded-full px-3 text-xs font-semibold tracking-wide transition-transform active:scale-90 hover:scale-105"
        style={{ color: 'var(--accent)' }}
      >
        {lang === 'en' ? '中文' : 'EN'}
      </button>
    </div>
  )
}
