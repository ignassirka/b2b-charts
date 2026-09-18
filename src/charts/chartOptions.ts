import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Chart, ChartOptions, PointElement, ScriptableContext, UpdateMode } from 'chart.js'
import type { AnnotationPluginOptions } from 'chartjs-plugin-annotation'
import {
  useControls,
  type GlobalControls,
  type LineSettings,
} from '../components/ControlPanel'
import type { Unit } from '../data/mockData'
import { DIM_OPACITY } from '../theme/tokens'
import {
  usePrefersReducedMotion,
  useThemeTokens,
  type SeriesState,
  type ThemeTokens,
} from '../theme/useThemeTokens'

export const ENTRY_MS = 700
export const DONUT_MS = 800
export const CARD_STAGGER_MS = 60
export const BAR_STAGGER_MS = 40
export const TRANSITION_MS = 150

export type ChartSize = 'card' | 'fullscreen'

export interface Motion {
  cardIndex: number
  reduced: boolean
}

/** Every chart variant takes the same two props. */
export interface ChartProps {
  cardIndex: number
  size?: ChartSize
}

// ---------------------------------------------------------------------------- palette roles

/**
 * Which palette a scenario is entitled to. Never user-switchable — comparing peer entities
 * demands categorical colour, judging a reading against a limit demands signal colour.
 */
export type PaletteRole = 'categorical' | 'signal'

export type SignalLevel = 'neutral' | 'good' | 'warning' | 'bad'

/** Categorical: identity only. Index picks a pair; hover takes the light tone. */
export function categoricalColor(
  index: number,
  tokens: ThemeTokens,
  state: SeriesState = 'default',
): string {
  return tokens.seriesTone(index, state)
}

/**
 * Signal: the colour IS the judgement, so there is no light/dark pair to hover into —
 * lightening "bad" would weaken it. Hover reads through the other elements dimming instead.
 */
export function signalColor(level: SignalLevel, tokens: ThemeTokens): string {
  return tokens.signal[level]
}

/**
 * A single neutral series has no peers to distinguish, so it uses the plain data colour.
 * The hover tone borrows the lighter grey rather than inventing one.
 */
export function neutralTone(tokens: ThemeTokens, state: SeriesState = 'default'): string {
  return state === 'hover' ? tokens.signal.neutral : tokens.seriesNeutral
}

/** Everything that is not the hovered element drops to 40%. */
export function dimIfIdle(
  color: string,
  isActive: boolean,
  anyActive: boolean,
  tokens: ThemeTokens,
): string {
  if (!anyActive || isActive) return color
  return tokens.dim(color, DIM_OPACITY)
}

/**
 * Dev-only guard: a dataset that draws from both palettes is telling the reader two
 * incompatible stories. Greys are shared by both and are not counted.
 */
export function warnOnMixedPalette(source: string, colors: string[], tokens: ThemeTokens) {
  if (!import.meta.env.DEV) return
  const categorical = new Set(tokens.multi.slice(0, 4).flatMap((p) => [p.dark, p.light]))
  const signal = new Set([
    tokens.signal.good,
    tokens.signal.warning,
    tokens.signal.bad,
    tokens.seriesAlert,
  ])
  const used = new Set(colors)
  const hitsCategorical = [...used].some((c) => categorical.has(c))
  const hitsSignal = [...used].some((c) => signal.has(c))
  if (hitsCategorical && hitsSignal) {
    console.warn(
      `[palette] "${source}" mixes the categorical and signal palettes in one dataset. ` +
        'Pick the role the scenario demands and use it throughout.',
    )
  }
}

// ---------------------------------------------------------------------------- formatting

/** Locale-independent, so two runs never disagree about a separator. */
export function formatNumber(value: number): string {
  const rounded = Math.round(value)
  const sign = rounded < 0 ? '-' : ''
  return sign + String(Math.abs(rounded)).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function trim(value: number, places: number): string {
  const factor = 10 ** places
  return String(Math.round(value * factor) / factor)
}

/** Full precision with the unit spelled out — tooltips and the inspector table. */
export function formatValue(value: number, unit: Unit): string {
  switch (unit.format) {
    case 'percent':
      return `${trim(value, 2)}%`
    case 'gbps':
      return `${trim(value, 1)} Gbps`
    case 'ms':
      return `${Math.round(value)} ms`
    case 'count':
      return `${formatNumber(value)} ${unit.label}`
  }
}

/** Compact form for axis ticks. */
export function formatAxisValue(value: number, unit: Unit): string {
  switch (unit.format) {
    case 'percent':
      return `${trim(value, 1)}%`
    case 'gbps':
      return trim(value, 0)
    case 'ms':
      return String(Math.round(value))
    case 'count':
      return Math.abs(value) >= 1000 ? `${trim(value / 1000, 1)}k` : formatNumber(value)
  }
}

/** Percent carries its symbol inline; every other unit is named once, on the axis. */
function axisTitleFor(unit: Unit): string | undefined {
  return unit.format === 'percent' ? undefined : unit.label
}

// ---------------------------------------------------------------------------- sizing

export interface SizeSpec {
  font: number
  legendBox: number
  legendPadding: number
  /** Multiplies the tick budget — fullscreen earns roughly 2.5× the labels. */
  tickScale: number
  padding: number
  frameHeight: number | 'fill'
}

export function sizeSpec(size: ChartSize): SizeSpec {
  return size === 'fullscreen'
    ? { font: 13, legendBox: 16, legendPadding: 18, tickScale: 2.5, padding: 8, frameHeight: 'fill' }
    : { font: 10, legendBox: 12, legendPadding: 12, tickScale: 1, padding: 2, frameHeight: 208 }
}

// ---------------------------------------------------------------------------- base hook

/**
 * react-chartjs-2 hands back `Chart | undefined` through a ref. Normalising it into state
 * (behind a stable callback, so React never re-attaches) is what lets the fullscreen
 * inspector reach the instance for zoom and reset.
 */
export function useChartInstance<T extends Chart>() {
  const [chart, setChart] = useState<Chart | null>(null)
  const attach = useCallback((instance: T | null | undefined) => {
    const next = instance ?? null
    setChart((prev) => (prev === next ? prev : next))
  }, [])
  return [chart, attach] as const
}

export function useChartBase(cardIndex: number) {
  const { global } = useControls()
  const tokens = useThemeTokens()
  const reduced = usePrefersReducedMotion()
  const motion = useMemo<Motion>(() => ({ cardIndex, reduced }), [cardIndex, reduced])
  return { global, tokens, motion }
}

/**
 * True once the entry animation has finished.
 *
 * Line variants swap their progressive draw-on config out at that point, so later updates
 * (theme, controls, hover) tween normally instead of replaying the reveal.
 */
export function useEntered(motion: Motion, duration = ENTRY_MS): boolean {
  const [entered, setEntered] = useState(motion.reduced)

  useEffect(() => {
    if (motion.reduced) {
      setEntered(true)
      return
    }
    const total = duration + motion.cardIndex * CARD_STAGGER_MS + 80
    const timer = window.setTimeout(() => setEntered(true), total)
    return () => window.clearTimeout(timer)
  }, [motion, duration])

  return entered
}

/**
 * All post-mount updates run in a transition of our own.
 *
 * It must NOT be called `active`: Chart.js treats that name as "resolve hover options", which
 * silently swaps every element's radius and border for its hover variant. A private name gives
 * the same 150ms ease-out as the DOM chrome without replaying the entry animation (`default`
 * mode only) and without hover styling leaking onto unhovered elements.
 */
// Chart.js accepts any transition name at runtime; its `UpdateMode` type only lists the built-ins.
export const UPDATE_MODE = 'restyle' as UpdateMode

export const restyleTransition = {
  [UPDATE_MODE]: { animation: { duration: TRANSITION_MS, easing: 'easeOutCubic' as const } },
}

// ---------------------------------------------------------------------------- scales

function gridFor(axis: 'x' | 'y', global: GlobalControls, tokens: ThemeTokens) {
  const show = axis === 'y' ? global.gridlines !== 'off' : global.gridlines === 'both'
  return { display: show, color: tokens.gridLine, lineWidth: 1, drawTicks: false }
}

interface AxisArgs {
  global: GlobalControls
  tokens: ThemeTokens
  size: SizeSpec
  unit?: Unit
  max?: number
  min?: number
  stepSize?: number
  /** Sparse per-index labels from the dataset — weekday at 7 days, date at 30, month at 90. */
  tickLabels?: string[]
  maxTicksLimit?: number
}

/** The axis carrying values. Always shows its unit: a bare number here is a bug. */
export function valueAxis(axis: 'x' | 'y', args: AxisArgs) {
  const { global, tokens, size, unit, max, min, stepSize } = args
  const title = unit ? axisTitleFor(unit) : undefined
  return {
    display: true,
    beginAtZero: min === undefined,
    max,
    min,
    grid: gridFor(axis, global, tokens),
    border: { display: false },
    title: {
      display: Boolean(title) && global.axisLabels,
      text: title ?? '',
      color: tokens.textMuted,
      font: { size: size.font },
      padding: { top: 0, bottom: 4 },
    },
    ticks: {
      display: global.axisLabels,
      color: tokens.textMuted,
      font: { size: size.font },
      padding: 8,
      stepSize,
      callback: (value: string | number) =>
        unit ? formatAxisValue(Number(value), unit) : formatNumber(Number(value)),
    },
  }
}

/** The axis carrying category names. */
export function categoryAxis(axis: 'x' | 'y', args: AxisArgs) {
  const { global, tokens, size, tickLabels, min, max, maxTicksLimit = 6 } = args
  const scaled = Math.round(maxTicksLimit * size.tickScale)
  return {
    display: true,
    // Carried in React state by `useZoomWindow`, so a re-render cannot undo a zoom.
    min,
    max,
    grid: gridFor(axis, global, tokens),
    border: { display: false },
    ticks: {
      display: global.axisLabels,
      color: tokens.textMuted,
      font: { size: size.font },
      padding: 8,
      // Sparse labels are already thinned by the dataset, so autoSkip must not thin them twice.
      autoSkip: !tickLabels,
      maxRotation: 0,
      maxTicksLimit: scaled,
      // Only override when the dataset supplied sparse labels; otherwise Chart.js' own
      // callback resolves the index back to its category name.
      ...(tickLabels
        ? { callback: (_value: string | number, index: number) => tickLabels[index] ?? '' }
        : {}),
    },
  }
}

/**
 * A legend with one entry names something the eye already resolves from the plot alone, so it is
 * suppressed regardless of the shared legend control. `itemCount` is slices for a donut, series
 * for a bar or line chart.
 */
export function legendConfig(
  global: GlobalControls,
  tokens: ThemeTokens,
  size: SizeSpec,
  itemCount: number,
) {
  return {
    display: global.legend !== 'off' && itemCount > 1,
    position: (global.legend === 'off' ? 'right' : global.legend) as 'top' | 'right' | 'bottom',
    labels: {
      color: tokens.textMuted,
      usePointStyle: true,
      // Figma legend: 12px swatch, 2px radius, 8px gap, 10px label
      pointStyle: 'rectRounded' as const,
      boxWidth: size.legendBox,
      boxHeight: size.legendBox,
      padding: size.legendPadding,
      font: { size: size.font },
    },
  }
}

/** Dashed rule: 1px, 4/4 dash, alert colour at 35%. */
export function thresholdAnnotation(
  axis: 'x' | 'y',
  value: number | null,
  tokens: ThemeTokens,
): AnnotationPluginOptions {
  if (value === null) return { annotations: {} }
  const bounds = axis === 'y' ? { yMin: value, yMax: value } : { xMin: value, xMax: value }
  return {
    annotations: {
      threshold: {
        type: 'line',
        ...bounds,
        borderColor: tokens.thresholdLine,
        borderWidth: 1,
        borderDash: [4, 4],
        drawTime: 'beforeDatasetsDraw',
      },
    },
  }
}

// ---------------------------------------------------------------------------- zoom

export interface ZoomWindow {
  min: number
  max: number
}

/**
 * The visible index range, held in React state.
 *
 * react-chartjs-2 replaces `chart.options` on every render, which would wipe the scale bounds
 * the zoom plugin writes directly onto the chart. Mirroring them into state and feeding them
 * back through the axis config makes a zoom survive any re-render.
 */
export function useZoomWindow(size: ChartSize, pointCount: number) {
  const [zoomWindow, setZoomWindow] = useState<ZoomWindow | null>(null)

  const report = useCallback(
    (chart: Chart) => {
      const scale = chart.scales.x
      const min = Math.round(Number(scale.min))
      const max = Math.round(Number(scale.max))
      const full = min <= 0 && max >= pointCount - 1
      setZoomWindow((prev) => {
        if (full) return prev === null ? prev : null
        if (prev && prev.min === min && prev.max === max) return prev
        return { min, max }
      })
    },
    [pointCount],
  )

  const reset = useCallback(() => setZoomWindow(null), [])
  const active = size === 'fullscreen' ? zoomWindow : null
  return { window: active, zoomed: active !== null, report, reset }
}

/** Wheel, drag and pinch on the x-axis. Only ever wired up in the fullscreen inspector. */
export function zoomConfig(size: ChartSize, tokens: ThemeTokens, report: (chart: Chart) => void) {
  if (size !== 'fullscreen') return { zoom: { wheel: { enabled: false } } }
  const notify = ({ chart }: { chart: Chart }) => report(chart)
  return {
    limits: { x: { minRange: 3 } },
    zoom: {
      wheel: { enabled: true, speed: 0.08 },
      pinch: { enabled: true },
      drag: {
        enabled: true,
        backgroundColor: tokens.dim(tokens.textMuted, 0.12),
        borderColor: tokens.dim(tokens.textMuted, 0.4),
        borderWidth: 1,
      },
      mode: 'x' as const,
      onZoom: notify,
      onZoomComplete: notify,
    },
  }
}

// ---------------------------------------------------------------------------- animation

type Anim = NonNullable<ChartOptions<'bar'>['animation']>

/** Bars grow from the baseline, staggered; the stagger shrinks so 90 bars still finish on time. */
export function barAnimation(motion: Motion, pointCount: number): Anim | false {
  if (motion.reduced) return false
  const stagger = Math.min(BAR_STAGGER_MS, 400 / Math.max(pointCount, 1))
  const base = motion.cardIndex * CARD_STAGGER_MS
  return {
    duration: ENTRY_MS,
    easing: 'easeOutCubic',
    delay: (ctx: ScriptableContext<'bar'>) =>
      ctx.type === 'data' && ctx.mode === 'default' ? base + ctx.dataIndex * stagger : 0,
  }
}

/** Doughnut sweeps clockwise from 12 o'clock (Chart.js rotation origin). */
export function donutAnimation(motion: Motion): ChartOptions<'doughnut'>['animation'] | false {
  if (motion.reduced) return false
  return {
    duration: DONUT_MS,
    easing: 'easeOutCubic',
    delay: motion.cardIndex * CARD_STAGGER_MS,
    animateRotate: true,
    animateScale: false,
  }
}

/**
 * Left-to-right draw-on: each point's x is revealed one step after the previous one, and its
 * y starts at the previous point's pixel position so the stroke extends rather than drops in.
 */
export function lineAnimations(
  motion: Motion,
  pointCount: number,
): Pick<ChartOptions<'line'>, 'animation' | 'animations'> {
  if (motion.reduced) return { animation: false }

  const total = ENTRY_MS
  const step = total / Math.max(pointCount, 1)
  const base = motion.cardIndex * CARD_STAGGER_MS

  const isEntry = (ctx: ScriptableContext<'line'>) => ctx.type === 'data' && ctx.mode === 'default'

  const delay = (ctx: ScriptableContext<'line'>) => (isEntry(ctx) ? base + ctx.dataIndex * step : 0)

  // Zero duration outside the entry pass makes Chart.js assign the value directly, so a
  // resize or hover mid-reveal can never re-run the `from: NaN` step and blank the line.
  const duration = (ctx: ScriptableContext<'line'>) => (isEntry(ctx) ? step : 0)

  const previousY = (ctx: ScriptableContext<'line'>) => {
    const scale = ctx.chart.scales.y
    if (ctx.type !== 'data' || ctx.dataIndex === 0) return scale.getPixelForValue(Number(scale.min))
    const previous = ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.dataIndex - 1] as
      | PointElement
      | undefined
    return previous ? previous.getProps(['y'], true).y : scale.getPixelForValue(Number(scale.min))
  }

  return {
    animation: { duration: total, easing: 'easeOutCubic' },
    animations: {
      x: { type: 'number', easing: 'linear', duration, from: NaN, delay },
      y: { type: 'number', easing: 'linear', duration, from: previousY, delay },
    },
  }
}

// ---------------------------------------------------------------------------- line points

/**
 * Marker radius, shrunk as the series gets crowded.
 *
 * Rule: below ~40 points the configured radius is used as-is; above that it tapers towards
 * 45% of it, so 'always' at 90-point density reads as a dotted line rather than a solid band.
 */
export function pointRadiusFor(settings: LineSettings, size: ChartSize, pointCount: number): number {
  const configured = size === 'fullscreen' ? Math.max(settings.pointRadius, 3) : settings.pointRadius
  const crowding = Math.min(1, 40 / Math.max(pointCount, 1))
  return Math.max(1.2, configured * (0.45 + 0.55 * crowding))
}

/** Fullscreen always shows markers — inspection is the whole point of opening it. */
export function pointVisibility(settings: LineSettings, size: ChartSize) {
  return size === 'fullscreen' ? 'always' : settings.points
}

export function pointRadiusScriptable(
  settings: LineSettings,
  size: ChartSize,
  pointCount: number,
  hoveredIndex: number | null,
) {
  const mode = pointVisibility(settings, size)
  const base = pointRadiusFor(settings, size, pointCount)
  return (ctx: ScriptableContext<'line'>) => {
    const hovered = ctx.dataIndex === hoveredIndex
    if (mode === 'off') return 0
    if (mode === 'always') return hovered ? base + 1.5 : base
    return hovered ? base : 0
  }
}

export function lineTension(settings: LineSettings, stepped: boolean): number {
  if (stepped) return 0
  return settings.curve === 'smooth' ? 0.4 : 0
}

/** Shared interaction config: index mode so every series lights up at the hovered position. */
export const indexInteraction = { mode: 'index', intersect: false, axis: 'x' } as const
export const pointInteraction = { mode: 'nearest', intersect: true } as const
