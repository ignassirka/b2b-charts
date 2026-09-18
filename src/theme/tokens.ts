/**
 * Design tokens — the single source of truth for every colour in the app.
 *
 * LIGHT values are sampled from the source design (Figma node 631-121546) and are
 * authoritative. DARK values do not exist in the source design; they are derived here
 * (same hue, lightness only) and are marked PROVISIONAL.
 *
 * No other file in src/ may contain a hex literal.
 */

/**
 * Tone mapping for the 5-colour categorical palette.
 *
 * true  → dark tone is the resting fill, light tone is the hover/active fill (design assumption)
 * false → inverted
 *
 * Flip this one boolean to invert the mapping everywhere.
 */
export const DARK_TONE_IS_DEFAULT = true

/** Opacity of the dashed threshold rule.
 * ESTIMATED — read off anti-aliased pixels in the reference screenshot, not a published token. */
export const THRESHOLD_OPACITY = 0.35

/** Opacity applied to non-hovered series/segments. */
export const DIM_OPACITY = 0.4

/** Opacity of the modal backdrop scrim, over its own near-black tint rather than theme text. */
export const SCRIM_OPACITY = 0.5

/**
 * The scrim behind a modal is a fixed dark veil in both themes — its job is to recede the page,
 * not to read as themed text, so it is not derived from `textStrong` (which is near-white in dark
 * mode and would brighten the backdrop instead of dimming it).
 */
const SCRIM_TINT = '#05060B'

export type ToneName = 'dark' | 'light'
export type MultiIndex = 0 | 1 | 2 | 3 | 4

/** `#RRGGBB` → `rgba(r, g, b, a)`. Kept here so alpha-derived colours stay in the token file. */
export function withAlpha(hex: string, alpha: number): string {
  const v = hex.replace('#', '')
  const n = parseInt(v, 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

const light = {
  pageBg: '#F5F6FD',
  cardSurface: '#FFFFFF',
  cardSurfaceRaised: '#FFFFFF',
  cardBorder: '#E9EAFA',
  textMuted: '#65717F',
  // Figma "glyph/glyph" — the only strong-text value present in the source design.
  textStrong: '#0B0B0B',
  seriesNeutral: '#707070',
  seriesAlert: '#C3434E',
  signalNeutral: '#8B95A1',
  signalGood: '#61B778',
  signalWarning: '#EC9537',
  signalBad: '#DF4853',
  multi: [
    { dark: '#4582D5', light: '#68A3ED' },
    { dark: '#4B9BB8', light: '#60BCD9' },
    { dark: '#5E3BE4', light: '#7A6EF1' },
    { dark: '#73289C', light: '#9637D3' },
    { dark: '#667180', light: '#8B95A1' },
  ],
}

const dark = {
  pageBg: '#0E1016', // PROVISIONAL — pending design review
  cardSurface: '#171A24', // PROVISIONAL — pending design review
  cardSurfaceRaised: '#1E2230', // PROVISIONAL — pending design review
  cardBorder: '#2A2F3E', // PROVISIONAL — pending design review
  textMuted: '#9AA4B2', // PROVISIONAL — pending design review (6.9:1 on cardSurface)
  textStrong: '#E8EBF2', // PROVISIONAL — pending design review (15.4:1 on cardSurface)
  seriesNeutral: '#9A9A9A', // PROVISIONAL — pending design review (6.2:1, hue unchanged)
  seriesAlert: '#E8717A', // PROVISIONAL — pending design review (5.8:1, hue 355°)
  signalNeutral: '#A4AEBA', // PROVISIONAL — pending design review
  signalGood: '#7FC993', // PROVISIONAL — pending design review (8.8:1, hue 135°)
  signalWarning: '#F2AC5E', // PROVISIONAL — pending design review (hue 30°)
  signalBad: '#EA6F79', // PROVISIONAL — pending design review (hue 356°)
  multi: [
    // PROVISIONAL — pending design review. Hue held constant per pair, lightness raised
    // until each dark tone clears 3:1 against cardSurface.
    { dark: '#6B9FE4', light: '#93BEF5' }, // hue 214°
    { dark: '#6FB6D0', light: '#8FCEE3' }, // hue 196°
    { dark: '#8A74F0', light: '#A99CF6' }, // hue 251°
    { dark: '#A95FD1', light: '#C48CE4' }, // hue 279°
    { dark: '#8E99A8', light: '#AEB7C2' }, // hue 215°
  ],
}

export type ThemeName = 'light' | 'dark'

/** CSS custom property names. Every consumer reads colour through one of these. */
export const cssVarNames = {
  pageBg: '--page-bg',
  cardSurface: '--card-surface',
  cardSurfaceRaised: '--card-surface-raised',
  cardBorder: '--card-border',
  textMuted: '--text-muted',
  textStrong: '--text-strong',
  seriesNeutral: '--series-neutral',
  seriesAlert: '--series-alert',
  signalNeutral: '--signal-neutral',
  signalGood: '--signal-good',
  signalWarning: '--signal-warning',
  signalBad: '--signal-bad',
  gridLine: '--grid-line',
  thresholdLine: '--threshold-line',
  scrim: '--scrim',
} as const

export function multiVarName(index: number, tone: ToneName): string {
  return `--multi-${index + 1}-${tone}`
}

function varMap(source: typeof light): Record<string, string> {
  const map: Record<string, string> = {
    [cssVarNames.pageBg]: source.pageBg,
    [cssVarNames.cardSurface]: source.cardSurface,
    [cssVarNames.cardSurfaceRaised]: source.cardSurfaceRaised,
    [cssVarNames.cardBorder]: source.cardBorder,
    [cssVarNames.textMuted]: source.textMuted,
    [cssVarNames.textStrong]: source.textStrong,
    [cssVarNames.seriesNeutral]: source.seriesNeutral,
    [cssVarNames.seriesAlert]: source.seriesAlert,
    [cssVarNames.signalNeutral]: source.signalNeutral,
    [cssVarNames.signalGood]: source.signalGood,
    [cssVarNames.signalWarning]: source.signalWarning,
    [cssVarNames.signalBad]: source.signalBad,
    [cssVarNames.gridLine]: withAlpha(source.textMuted, 0.18),
    [cssVarNames.thresholdLine]: withAlpha(source.seriesAlert, THRESHOLD_OPACITY),
    [cssVarNames.scrim]: withAlpha(SCRIM_TINT, SCRIM_OPACITY),
  }
  source.multi.forEach((pair, i) => {
    map[multiVarName(i, 'dark')] = pair.dark
    map[multiVarName(i, 'light')] = pair.light
  })
  return map
}

export const themeVars: Record<ThemeName, Record<string, string>> = {
  light: varMap(light),
  dark: varMap(dark),
}

function block(selector: string, vars: Record<string, string>): string {
  const body = Object.entries(vars)
    .map(([name, value]) => `  ${name}: ${value};`)
    .join('\n')
  return `${selector} {\n${body}\n}`
}

/** `:root` + `[data-theme="dark"]` rules, generated so no stylesheet needs a literal colour. */
export const themeStylesheet = [
  block(':root', themeVars.light),
  block('[data-theme="dark"]', themeVars.dark),
].join('\n\n')

/** Ordered token groups for the Foundations tab. */
export const foundationGroups = [
  {
    name: 'Surfaces & text',
    caption: 'Page chrome, card chrome and the two text weights.',
    swatches: [
      { label: 'Page background', varName: cssVarNames.pageBg },
      { label: 'Card surface', varName: cssVarNames.cardSurface },
      { label: 'Card surface (raised)', varName: cssVarNames.cardSurfaceRaised },
      { label: 'Card border', varName: cssVarNames.cardBorder },
      { label: 'Axis + label text', varName: cssVarNames.textMuted },
      { label: 'Strong text', varName: cssVarNames.textStrong },
    ],
  },
  {
    name: 'Data series',
    caption: 'The two plain-data colours: everything resting, and everything wrong.',
    swatches: [
      { label: 'Neutral series', varName: cssVarNames.seriesNeutral },
      { label: 'Alert series', varName: cssVarNames.seriesAlert },
    ],
  },
  {
    name: 'Signal palette',
    caption: 'Semantic. Use only when the colour itself carries the good/bad judgement.',
    swatches: [
      { label: 'Neutral', varName: cssVarNames.signalNeutral },
      { label: 'Good', varName: cssVarNames.signalGood },
      { label: 'Warning', varName: cssVarNames.signalWarning },
      { label: 'Bad', varName: cssVarNames.signalBad },
    ],
  },
  {
    name: 'Derived',
    caption: 'Alpha-derived from the values above — never authored separately.',
    swatches: [
      { label: 'Gridline', varName: cssVarNames.gridLine },
      { label: 'Threshold rule', varName: cssVarNames.thresholdLine },
      { label: 'Modal scrim', varName: cssVarNames.scrim },
    ],
  },
] as const

/** Series names used wherever the categorical palette is shown as a legend. */
export const multiPaletteLabels = ['Palette 1', 'Palette 2', 'Palette 3', 'Palette 4', 'Palette 5']
