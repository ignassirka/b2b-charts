import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  DARK_TONE_IS_DEFAULT,
  cssVarNames,
  multiVarName,
  themeStylesheet,
  withAlpha,
  type ThemeName,
  type ToneName,
} from './tokens'

const STYLE_ID = 'theme-tokens'

/** Injected once, at module load, so `:root` is populated before the first paint. */
function ensureStylesheet() {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = themeStylesheet
  document.head.appendChild(style)
}
ensureStylesheet()

export type SeriesState = 'default' | 'hover'

export interface ThemeTokens {
  name: ThemeName
  pageBg: string
  cardSurface: string
  cardSurfaceRaised: string
  cardBorder: string
  textMuted: string
  textStrong: string
  seriesNeutral: string
  seriesAlert: string
  signal: { neutral: string; good: string; warning: string; bad: string }
  multi: { dark: string; light: string }[]
  gridLine: string
  thresholdLine: string
  /** Resting vs hover fill for categorical series `index`, honouring DARK_TONE_IS_DEFAULT. */
  seriesTone: (index: number, state?: SeriesState) => string
  /** Resting vs hover fill for a flat colour that has no light/dark pair. */
  dim: (color: string, alpha: number) => string
}

const MULTI_COUNT = 5

function readVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

function resolveTokens(name: ThemeName): ThemeTokens {
  const multi = Array.from({ length: MULTI_COUNT }, (_, i) => ({
    dark: readVar(multiVarName(i, 'dark')),
    light: readVar(multiVarName(i, 'light')),
  }))
  const restingTone: ToneName = DARK_TONE_IS_DEFAULT ? 'dark' : 'light'
  const hoverTone: ToneName = DARK_TONE_IS_DEFAULT ? 'light' : 'dark'

  return {
    name,
    pageBg: readVar(cssVarNames.pageBg),
    cardSurface: readVar(cssVarNames.cardSurface),
    cardSurfaceRaised: readVar(cssVarNames.cardSurfaceRaised),
    cardBorder: readVar(cssVarNames.cardBorder),
    textMuted: readVar(cssVarNames.textMuted),
    textStrong: readVar(cssVarNames.textStrong),
    seriesNeutral: readVar(cssVarNames.seriesNeutral),
    seriesAlert: readVar(cssVarNames.seriesAlert),
    signal: {
      neutral: readVar(cssVarNames.signalNeutral),
      good: readVar(cssVarNames.signalGood),
      warning: readVar(cssVarNames.signalWarning),
      bad: readVar(cssVarNames.signalBad),
    },
    multi,
    gridLine: readVar(cssVarNames.gridLine),
    thresholdLine: readVar(cssVarNames.thresholdLine),
    seriesTone: (index, state = 'default') =>
      multi[index % MULTI_COUNT][state === 'hover' ? hoverTone : restingTone],
    dim: withAlpha,
  }
}

interface ThemeContextValue {
  theme: ThemeName
  setTheme: (theme: ThemeName) => void
  tokens: ThemeTokens
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeName>('light')

  // Written synchronously before paint so `resolveTokens` never reads a stale theme.
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = theme
  }

  const tokens = useMemo(() => resolveTokens(theme), [theme])
  const value = useMemo(() => ({ theme, setTheme, tokens }), [theme, tokens])

  return createElement(ThemeContext.Provider, { value }, children)
}

function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('ThemeProvider is missing')
  return ctx
}

/** Live token values for the active theme. Charts read colour only through this. */
export function useThemeTokens(): ThemeTokens {
  return useThemeContext().tokens
}

export function useTheme(): Pick<ThemeContextValue, 'theme' | 'setTheme'> {
  const { theme, setTheme } = useThemeContext()
  return { theme, setTheme }
}

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(query.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  return reduced
}
