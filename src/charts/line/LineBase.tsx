import { useCallback, useEffect, useMemo } from 'react'
import { Line } from 'react-chartjs-2'
import type {
  Chart as ChartJS,
  ChartOptions,
  ScriptableContext,
  ScriptableLineSegmentContext,
} from 'chart.js'
import { useControls } from '../../components/ControlPanel'
import { usePublishChart } from '../../components/VariantCard'
import type { Unit } from '../../data/mockData'
import { DIM_OPACITY } from '../../theme/tokens'
import type { SeriesState } from '../../theme/useThemeTokens'
import { ChartFrame, useChartHover } from '../ChartFrame'
import { setAreaAlpha } from '../plugins'
import { SpotlightStat } from '../SpotlightStat'
import {
  TRANSITION_MS,
  UPDATE_MODE,
  restyleTransition,
  categoryAxis,
  dimIfIdle,
  formatValue,
  indexInteraction,
  legendConfig,
  lineAnimations,
  lineTension,
  pointRadiusScriptable,
  sizeSpec,
  spotlightNumber,
  thresholdAnnotation,
  useChartBase,
  useChartInstance,
  useEntered,
  useZoomWindow,
  valueAxis,
  warnOnMixedPalette,
  zoomConfig,
  type ChartSize,
} from '../chartOptions'

const AREA_FADE_MS = 300

export interface LineSeriesSpec {
  label: string
  values: number[]
  tone: (state: SeriesState) => string
  /** Chart.js v4 scriptable segment colour — one dataset, two colours. */
  segment?: (ctx: ScriptableLineSegmentContext) => string | CanvasGradient | undefined
}

export interface LineBaseProps {
  cardIndex: number
  size: ChartSize
  labels: string[]
  tickLabels?: string[]
  series: LineSeriesSpec[]
  unit: Unit
  axisMax: number
  axisMin?: number
  stepSize?: number
  threshold?: number | null
  /** Variants that exist to demonstrate the gradient fill ignore the shared control. */
  forceArea?: boolean
  /** Variants that exist to demonstrate stepping ignore the shared control. */
  forceStepped?: boolean
  /** Strips axes and legend and shrinks the frame. */
  compact?: boolean
  endDot?: { color: string }
  /** The headline figure shown above the plot when the "Spotlight number" control is on.
   *  Never shown in `compact` mode — there is no room for it beside the sparkline. */
  spotlightValue?: number
  /** Short caption beside the spotlight figure — states what it is and its unit. */
  spotlightLabel?: string
}

export function LineBase({
  cardIndex,
  size,
  labels,
  tickLabels,
  series,
  unit,
  axisMax,
  axisMin,
  stepSize,
  threshold = null,
  forceArea = false,
  forceStepped = false,
  compact = false,
  endDot,
  spotlightValue,
  spotlightLabel,
}: LineBaseProps) {
  const { global, tokens, motion } = useChartBase(cardIndex)
  const { line } = useControls()
  const spec = sizeSpec(size)
  const entered = useEntered(motion)
  const [chart, attachChart] = useChartInstance<ChartJS<'line', number[], string>>()
  const zoom = useZoomWindow(size, labels.length)

  const area = forceArea || line.areaFill
  const stepped = forceStepped || line.stepped

  const resolveColor = useCallback((datasetIndex: number) => series[datasetIndex].tone('hover'), [series])
  const format = useCallback((value: number) => formatValue(value, unit), [unit])
  const { hover, onHover, frameHandlers } = useChartHover({ kind: 'point', resolveColor, format })

  const anyActive = hover !== null
  const hoveredIndex = hover?.index ?? null
  const lastIndex = series[0].values.length - 1

  const restingColors = useMemo(() => series.map((entry) => entry.tone('default')), [series])
  useEffect(
    () => warnOnMixedPalette(series.map((s) => s.label).join(' + '), restingColors, tokens),
    [series, restingColors, tokens],
  )

  // The fill ramps up only once the stroke has finished drawing itself.
  useEffect(() => {
    if (!area || !chart) return
    if (motion.reduced) {
      setAreaAlpha(chart, 1)
      chart.render()
      return
    }
    if (!entered) {
      setAreaAlpha(chart, 0)
      return
    }
    let frame = 0
    const start = performance.now()
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / AREA_FADE_MS)
      setAreaAlpha(chart, progress)
      chart.render()
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [area, entered, motion.reduced, chart])

  const data = useMemo(() => {
    const radiusOf = pointRadiusScriptable(line, size, labels.length, hoveredIndex)
    return {
      labels,
      datasets: series.map((entry, datasetIndex) => {
        const isActive = hover?.datasetIndex === datasetIndex
        const stroke = dimIfIdle(entry.tone(isActive ? 'hover' : 'default'), isActive, anyActive, tokens)
        const isEndDot = (ctx: ScriptableContext<'line'>) =>
          Boolean(endDot) && datasetIndex === 0 && ctx.dataIndex === lastIndex
        return {
          label: entry.label,
          data: entry.values,
          borderColor: stroke,
          borderWidth: isActive ? line.lineWidth + 1 : line.lineWidth,
          borderCapStyle: 'round' as const,
          borderJoinStyle: 'round' as const,
          tension: lineTension(line, stepped),
          stepped: stepped ? ('before' as const) : (false as const),
          segment: entry.segment ? { borderColor: entry.segment } : undefined,
          // The end dot reports current state, so it renders whatever the points control says.
          pointRadius: (ctx: ScriptableContext<'line'>) =>
            isEndDot(ctx) ? Math.max(4, radiusOf(ctx)) : radiusOf(ctx),
          pointBackgroundColor: (ctx: ScriptableContext<'line'>) =>
            isEndDot(ctx) ? (endDot?.color ?? stroke) : stroke,
          pointHoverRadius: (ctx: ScriptableContext<'line'>) =>
            isEndDot(ctx) ? Math.max(4, radiusOf(ctx)) : radiusOf(ctx),
          pointBorderWidth: 0,
          pointHoverBorderWidth: 0,
          fill: false as const,
        }
      }),
    }
  }, [labels, series, hover, anyActive, hoveredIndex, tokens, endDot, lastIndex, line, size, stepped])

  const options = useMemo<ChartOptions<'line'>>(() => {
    const entry = entered
      ? { animation: { duration: TRANSITION_MS, easing: 'easeOutCubic' as const }, animations: {} }
      : lineAnimations(motion, labels.length)
    return {
      ...entry,
      transitions: restyleTransition,
      interaction: indexInteraction,
      onHover,
      layout: { padding: compact ? { top: 6, bottom: 2, right: 8 } : spec.padding },
      scales: {
        y: compact
          ? { display: false, beginAtZero: axisMin === undefined, max: axisMax, min: axisMin }
          : valueAxis('y', { global, tokens, size: spec, unit, max: axisMax, min: axisMin, stepSize }),
        x: compact
          ? { display: false }
          : categoryAxis('x', {
              global,
              tokens,
              size: spec,
              tickLabels,
              min: zoom.window?.min,
              max: zoom.window?.max,
            }),
      },
      plugins: {
        legend: compact ? { display: false } : legendConfig(global, tokens, spec, series.length),
        crosshair: { enabled: line.crosshair, color: tokens.dim(tokens.textMuted, DIM_OPACITY) },
        annotation: thresholdAnnotation('y', threshold, tokens),
        zoom: zoomConfig(size, tokens, zoom.report),
        areaFade: {
          enabled: area,
          colorTop: tokens.dim(series[0].tone('default'), 0.38),
          colorBottom: tokens.dim(series[0].tone('default'), 0),
          startAlpha: motion.reduced ? 1 : 0,
        },
      },
    }
  }, [
    entered, motion, labels.length, tickLabels, onHover, compact, spec, axisMax, axisMin,
    stepSize, global, tokens, unit, threshold, area, series, size, line.crosshair, zoom.window, zoom.report,
  ])

  usePublishChart(
    useMemo(
      () => ({
        config: { type: 'line', data, options },
        chart,
        unit,
        zoomed: zoom.zoomed,
        resetZoom: zoom.reset,
      }),
      [data, options, chart, unit, zoom.zoomed, zoom.reset],
    ),
  )

  const height = size === 'fullscreen' ? 'fill' : compact ? 96 : 208
  return (
    <div className="flex w-full flex-1 flex-col">
      {!compact && global.spotlight && spotlightValue !== undefined && spotlightLabel && (
        <SpotlightStat value={spotlightNumber(spotlightValue, unit)} label={spotlightLabel} size={size} />
      )}
      <ChartFrame hover={hover} handlers={frameHandlers} height={height}>
        <Line ref={attachChart} data={data} options={options} updateMode={UPDATE_MODE} />
      </ChartFrame>
    </div>
  )
}
