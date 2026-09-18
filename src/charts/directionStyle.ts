/**
 * Contract → canvas translators.
 *
 * Everything a direction implies about geometry, paint, type and motion is resolved here, so
 * the three shells stay declarative and no chart component ever branches on a direction id.
 *
 * Colour rule: these helpers only ever receive token strings and alphas. They build gradients
 * between the two tones of one categorical pair, patterns from a single token, and glows from
 * the element's own colour — never a new hue.
 */

import type { Chart, ScriptableContext } from 'chart.js'
import type {
  ChartDirection,
  FontStackId,
  SeriesSpec,
  TokenRef,
} from '../theme/directions'
import type { ThemeTokens } from '../theme/useThemeTokens'
import { formatAxisValue, formatNumber, formatValue, type ChartSize } from './chartOptions'
import type { Unit } from '../data/mockData'

// ---------------------------------------------------------------------------- tokens & type

export function tokenValue(ref: TokenRef, tokens: ThemeTokens): string {
  switch (ref) {
    case 'pageBg':
      return tokens.pageBg
    case 'cardSurface':
      return tokens.cardSurface
    case 'cardSurfaceRaised':
      return tokens.cardSurfaceRaised
    case 'cardBorder':
      return tokens.cardBorder
    case 'textMuted':
      return tokens.textMuted
    case 'textStrong':
      return tokens.textStrong
    case 'seriesNeutral':
      return tokens.seriesNeutral
    case 'gridLine':
      return tokens.gridLine
  }
}

export const FONT_STACKS: Record<FontStackId, string> = {
  sans: 'Inter, system-ui, -apple-system, sans-serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  display: 'Georgia, "Iowan Old Style", "Times New Roman", serif',
}

export function chartFontFamily(direction: ChartDirection): string {
  const { fontStack, tabularNumerals } = direction.type
  // Tabular figures matter most for the mono stack, which is already fixed-advance.
  return tabularNumerals && fontStack === 'sans'
    ? `${FONT_STACKS.sans}`
    : FONT_STACKS[fontStack]
}

export interface ChartFontSpec {
  family: string
  size: number
  weight: number
  /** Chart.js has no letter-spacing option; canvas plugins apply it themselves. */
  tracking: number
}

/** One place that decides how big in-chart type is, for a given direction and card size. */
export function chartFont(
  direction: ChartDirection,
  size: ChartSize,
  role: 'tick' | 'label' | 'value',
): ChartFontSpec {
  const scale = size === 'fullscreen' ? 1.3 : 1
  const base =
    role === 'tick'
      ? direction.type.tickSize
      : role === 'label'
        ? direction.type.labelSize
        : direction.type.valueLabelSize
  return {
    family: chartFontFamily(direction),
    size: Math.round(base * scale),
    weight: direction.type.weight,
    tracking: direction.type.tracking,
  }
}

/** `500 11px Inter, …` for direct canvas drawing. */
export function canvasFont(spec: ChartFontSpec): string {
  return `${spec.weight} ${spec.size}px ${spec.family}`
}

// ---------------------------------------------------------------------------- numbers

/** Abbreviated (2.7M) vs full precision (2,688,571) is a direction decision, not a unit one. */
export function directionAxisValue(value: number, unit: Unit, direction: ChartDirection): string {
  if (direction.type.numberStyle === 'full') {
    return unit.format === 'count' ? formatNumber(value) : formatValue(value, unit).replace(/\s.*$/, '')
  }
  return formatAxisValue(value, unit)
}

/** The hero figure in a donut hole, abbreviated or spelled out per direction. */
export function directionHeroValue(value: number, unit: Unit, direction: ChartDirection): string {
  // A percentage is already short, and rounding it to "1k" would be nonsense.
  if (unit.format !== 'count') return formatValue(value, unit)
  if (direction.type.numberStyle === 'full') return formatNumber(value)
  if (Math.abs(value) >= 1_000_000) return `${Math.round(value / 100_000) / 10}M`
  if (Math.abs(value) >= 10_000) return `${Math.round(value / 1000)}k`
  return formatNumber(value)
}

// ---------------------------------------------------------------------------- paint

/**
 * A pattern built from one token colour — hatching, never a second hue. Cached per colour and
 * per canvas, because `createPattern` allocates and bars ask for one per element.
 */
const patternCache = new WeakMap<CanvasRenderingContext2D, Map<string, CanvasPattern>>()

function hatchPattern(
  ctx: CanvasRenderingContext2D,
  color: string,
  background: string,
): CanvasPattern | string {
  const key = `${color}|${background}`
  let perCanvas = patternCache.get(ctx)
  if (!perCanvas) {
    perCanvas = new Map()
    patternCache.set(ctx, perCanvas)
  }
  const cached = perCanvas.get(key)
  if (cached) return cached

  const tile = document.createElement('canvas')
  const step = 6
  tile.width = step
  tile.height = step
  const tileCtx = tile.getContext('2d')
  if (!tileCtx) return color

  tileCtx.fillStyle = color
  tileCtx.fillRect(0, 0, step, step)
  // A single diagonal cut in the surface colour: the fill stays one hue, just interrupted.
  tileCtx.strokeStyle = background
  tileCtx.lineWidth = 1.5
  tileCtx.beginPath()
  tileCtx.moveTo(-step, step)
  tileCtx.lineTo(step, -step)
  tileCtx.moveTo(0, step * 2)
  tileCtx.lineTo(step * 2, 0)
  tileCtx.stroke()

  const pattern = ctx.createPattern(tile, 'repeat')
  if (!pattern) return color
  perCanvas.set(key, pattern)
  return pattern
}

export interface PaintContext {
  ctx: CanvasRenderingContext2D
  /** Pixel band the gradient should span. */
  from: number
  to: number
  /** Horizontal for bar rows and donut arcs, vertical for columns and lines. */
  axis: 'x' | 'y'
}

/**
 * The fill for one element, honouring the direction's fill mode.
 *
 * `gradient` interpolates between the dark and light tone of the SAME pair — `partner` is that
 * second tone, supplied by the caller which knows the element's palette slot.
 */
export function seriesPaint(
  color: string,
  partner: string,
  direction: ChartDirection,
  tokens: ThemeTokens,
  paint: PaintContext | null,
): string | CanvasGradient | CanvasPattern {
  const mode = direction.series.fill
  if (mode === 'solid' || !paint) return color
  if (mode === 'outline') return tokens.dim(color, 0.12)
  if (mode === 'pattern') return hatchPattern(paint.ctx, color, tokens.cardSurface)

  const { ctx, from, to, axis } = paint
  const gradient =
    axis === 'y'
      ? ctx.createLinearGradient(0, from, 0, to)
      : ctx.createLinearGradient(from, 0, to, 0)
  gradient.addColorStop(0, partner)
  gradient.addColorStop(1, color)
  return gradient
}

/** Outline directions draw the shape's edge rather than its body. */
export function outlineBorder(
  color: string,
  direction: ChartDirection,
): { color: string; width: number } | null {
  if (direction.series.fill !== 'outline') return null
  return { color, width: Math.max(1, direction.series.strokeWidth) }
}

// ---------------------------------------------------------------------------- geometry

export interface BarGeometry {
  maxBarThickness: number
  categoryPercentage: number
  barPercentage: number
  borderRadius: number
}

/**
 * Bar geometry, with the contextual controls layered on top of the direction defaults.
 * `flush = 1` in D4 removes the gap entirely so the row reads as one segmented block.
 */
export function barGeometry(
  direction: ChartDirection,
  thickness: number,
  radius: number,
  thicknessScale: number,
): BarGeometry {
  const flush = direction.series.barFlush
  return {
    maxBarThickness: Math.max(2, thickness * thicknessScale),
    categoryPercentage: flush,
    barPercentage: flush >= 1 ? 1 : Math.min(1, flush + 0.08),
    borderRadius: radius,
  }
}

export function donutSpacing(direction: ChartDirection): number {
  return direction.series.donutGap
}

/** Chart.js draws a round arc cap via `borderRadius` on the arc element. */
export function donutArcRadius(direction: ChartDirection, ringPx: number): number {
  return direction.series.donutArcCap === 'round' ? Math.max(2, ringPx / 2) : 0
}

/** Index of the slice a direction pulls out of the ring, or null when none does. */
export function donutOffsetIndex(direction: ChartDirection, values: number[]): number | null {
  if (direction.series.donutOffset !== 'largest' || !values.length) return null
  let best = 0
  values.forEach((value, index) => {
    if (value > values[best]) best = index
  })
  return best
}

export const POINT_STYLES: Record<SeriesSpec['pointShape'], string | false> = {
  circle: 'circle',
  cross: 'crossRot',
  rect: 'rect',
  halo: 'circle',
  none: false,
}

// ---------------------------------------------------------------------------- motion

export interface EntrySpec {
  duration: number
  easing: ChartDirection['motion']['easing']
  stagger: number
  reveal: ChartDirection['motion']['reveal']
}

export function entrySpec(direction: ChartDirection, cardIndex: number): EntrySpec & { delay: number } {
  const { entryMs, easing, staggerMs, reveal } = direction.motion
  return { duration: entryMs, easing, stagger: staggerMs, reveal, delay: cardIndex * staggerMs }
}

/** Post-mount restyle tween. D4 is mechanical, so its hover transition is genuinely zero. */
export function restyleTransitionFor(direction: ChartDirection, mode: string) {
  return {
    [mode]: {
      animation: { duration: direction.motion.hoverMs, easing: direction.motion.easing },
    },
  }
}

// ---------------------------------------------------------------------------- emphasis gate

export interface GateFacts {
  /** The element is the hovered one. */
  hovered: boolean
  /** Value sits at or past the threshold the variant declared. */
  breaching: boolean
  /** Last point of a time series. */
  latest: boolean
  /** Largest slice of a part-to-whole chart. */
  largest: boolean
}

export const NO_FACTS: GateFacts = {
  hovered: false,
  breaching: false,
  latest: false,
  largest: false,
}

/**
 * D5's rule: colour is a scarce resource. When the gate is `earned`, an element renders in the
 * neutral token unless it has earned its own colour.
 *
 * The variant's own resolver still decides WHICH colour that is, so a signal variant stays
 * signal and a categorical variant stays categorical — the gate only decides whether the
 * earned colour is spent at all.
 */
export function gateColor(
  resolved: string,
  facts: GateFacts,
  direction: ChartDirection,
  tokens: ThemeTokens,
): string {
  if (direction.emphasis.colorGate === 'all') return resolved
  const earned = facts.hovered || facts.breaching || facts.latest || facts.largest
  return earned ? resolved : tokens.seriesNeutral
}

/** Weight is the second channel every direction can use to say "look here". */
export function emphasisWidth(
  base: number,
  facts: GateFacts,
  direction: ChartDirection,
): number {
  const { focusWeight, breachWeight } = direction.emphasis
  if (facts.breaching) return base * breachWeight
  if (facts.hovered) return base * focusWeight
  return base
}

/** Dash pattern for a breaching series, when the direction expresses breach through dashing. */
export function breachDash(direction: ChartDirection, breaching: boolean): number[] | undefined {
  if (!breaching || !direction.emphasis.breachDash) return undefined
  return [direction.emphasis.thresholdDashOn, direction.emphasis.thresholdDashOff]
}

// ---------------------------------------------------------------------------- canvas effects

/** Glow drawn from the element's own colour — a shadow, never a second hue. */
export function applyGlow(
  ctx: CanvasRenderingContext2D,
  color: string,
  direction: ChartDirection,
  reduced: boolean,
) {
  const blur = direction.series.glow
  if (!blur || reduced) return
  ctx.shadowColor = color
  ctx.shadowBlur = blur
}

export function clearShadow(ctx: CanvasRenderingContext2D) {
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0
}

/** Scriptable helper: the two tones of the pair a categorical index maps to. */
export function tonePair(index: number, tokens: ThemeTokens): { dark: string; light: string } {
  return tokens.multi[index % tokens.multi.length]
}

export function chartOf(ctx: ScriptableContext<'bar' | 'line' | 'doughnut'>): Chart {
  return ctx.chart
}
