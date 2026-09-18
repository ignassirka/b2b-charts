import { useCallback, useEffect, useMemo } from 'react'
import { Bar } from 'react-chartjs-2'
import type { Chart as ChartJS, ChartOptions } from 'chart.js'
import { useControls } from '../../components/ControlPanel'
import { usePublishChart } from '../../components/VariantCard'
import type { Unit } from '../../data/mockData'
import type { SeriesState } from '../../theme/useThemeTokens'
import { ChartFrame, useChartHover } from '../ChartFrame'
import {
  UPDATE_MODE,
  restyleTransition,
  barAnimation,
  categoryAxis,
  dimIfIdle,
  formatAxisValue,
  formatValue,
  legendConfig,
  pointInteraction,
  sizeSpec,
  thresholdAnnotation,
  useChartBase,
  useChartInstance,
  useZoomWindow,
  valueAxis,
  warnOnMixedPalette,
  zoomConfig,
  type ChartSize,
} from '../chartOptions'

export interface BarSeries {
  label: string
  values: number[]
  colorAt: (index: number, state: SeriesState) => string
}

/** Rounds the outer end of a bar only — a stack keeps square joins between its segments. */
function cornerRadius(radius: number, horizontal: boolean, isCap: boolean) {
  if (!isCap) return 0
  return horizontal
    ? { topRight: radius, bottomRight: radius, topLeft: 0, bottomLeft: 0 }
    : { topLeft: radius, topRight: radius, bottomLeft: 0, bottomRight: 0 }
}

export interface BarBaseProps {
  cardIndex: number
  size: ChartSize
  labels: string[]
  tickLabels?: string[]
  series: BarSeries[]
  unit: Unit
  axisMax: number
  axisMin?: number
  stepSize?: number
  horizontal?: boolean
  /** In chart units. Draws the dashed rule when set. */
  threshold?: number | null
  /** Variants that exist to demonstrate stacking ignore the shared layout control. */
  forceStacked?: boolean
  thicknessScale?: number
  /** Right-aligned value column, for ranked horizontal rows. */
  edgeLabelColors?: string[]
}

export function BarBase({
  cardIndex,
  size,
  labels,
  tickLabels,
  series,
  unit,
  axisMax,
  axisMin,
  stepSize,
  horizontal = false,
  threshold = null,
  forceStacked = false,
  thicknessScale = 1,
  edgeLabelColors,
}: BarBaseProps) {
  const { global, tokens, motion } = useChartBase(cardIndex)
  const { bar } = useControls()
  const spec = sizeSpec(size)
  const [chart, attachChart] = useChartInstance<ChartJS<'bar', number[], string>>()
  const zoom = useZoomWindow(size, labels.length)

  const stacked = forceStacked || bar.layout === 'stacked'
  const resolveColor = useCallback(
    (datasetIndex: number, index: number) => series[datasetIndex].colorAt(index, 'hover'),
    [series],
  )
  const format = useCallback((value: number) => formatValue(value, unit), [unit])
  const { hover, onHover, frameHandlers } = useChartHover({
    kind: series.length > 1 ? 'point' : 'slice',
    resolveColor,
    format,
  })

  const anyActive = hover !== null
  const radius = bar.cornerRadius

  const restingColors = useMemo(
    () => series.flatMap((entry, i) => entry.values.map((_, j) => series[i].colorAt(j, 'default'))),
    [series],
  )
  useEffect(
    () => warnOnMixedPalette(series.map((s) => s.label).join(' + '), restingColors, tokens),
    [series, restingColors, tokens],
  )

  const data = useMemo(
    () => ({
      labels,
      datasets: series.map((entry, datasetIndex) => ({
        label: entry.label,
        data: entry.values,
        backgroundColor: entry.values.map((_, index) => {
          const isActive = hover?.datasetIndex === datasetIndex && hover.index === index
          return dimIfIdle(
            entry.colorAt(index, isActive ? 'hover' : 'default'),
            isActive,
            anyActive,
            tokens,
          )
        }),
        borderRadius: cornerRadius(
          radius,
          horizontal,
          !stacked || datasetIndex === series.length - 1,
        ),
        maxBarThickness: bar.thickness * thicknessScale,
        borderSkipped: false as const,
      })),
    }),
    [labels, series, hover, anyActive, tokens, radius, horizontal, stacked, bar.thickness, thicknessScale],
  )

  const options = useMemo<ChartOptions<'bar'>>(() => {
    const valueSide = horizontal ? 'x' : 'y'
    const categorySide = horizontal ? 'y' : 'x'
    const showEdge = Boolean(edgeLabelColors)
    return {
      indexAxis: horizontal ? ('y' as const) : ('x' as const),
      layout: { padding: { right: showEdge ? spec.font * 4.6 : 0 } },
      animation: barAnimation(motion, labels.length),
      transitions: restyleTransition,
      interaction: pointInteraction,
      onHover,
      scales: {
        [valueSide]: {
          ...valueAxis(valueSide, { global, tokens, size: spec, unit, max: axisMax, min: axisMin, stepSize }),
          stacked,
        },
        [categorySide]: {
          ...categoryAxis(categorySide, {
            global,
            tokens,
            size: spec,
            tickLabels,
            min: zoom.window?.min,
            max: zoom.window?.max,
            maxTicksLimit: horizontal ? 12 : 6,
          }),
          stacked,
        },
      },
      plugins: {
        legend: legendConfig(global, tokens, spec, series.length),
        annotation: thresholdAnnotation(valueSide, threshold, tokens),
        zoom: zoomConfig(size, tokens, zoom.report),
        barValueLabels: {
          enabled: bar.valueLabels,
          // A stack only has room for one number: its total, at the cap.
          rows: stacked
            ? {
                [series.length - 1]: labels.map((_, i) =>
                  formatAxisValue(
                    series.reduce((sum, entry) => sum + entry.values[i], 0),
                    unit,
                  ),
                ),
              }
            : Object.fromEntries(
                series.map((entry, i) => [i, entry.values.map((v) => formatAxisValue(v, unit))]),
              ),
          color: tokens.textMuted,
          font: spec.font,
          horizontal,
        },
        edgeValueLabels: {
          enabled: showEdge,
          values: series[0].values.map((v) => formatValue(v, unit)),
          colors: edgeLabelColors ?? [tokens.textMuted],
          font: spec.font,
        },
      },
    }
  }, [
    horizontal, edgeLabelColors, spec, motion, labels, tickLabels, onHover, global,
    tokens, unit, axisMax, axisMin, stepSize, stacked, threshold, size, series, bar.valueLabels, zoom.window, zoom.report,
  ])

  usePublishChart(
    useMemo(
      () => ({
        config: { type: 'bar', data, options },
        chart,
        unit,
        zoomed: zoom.zoomed,
        resetZoom: zoom.reset,
      }),
      [data, options, chart, unit, zoom.zoomed, zoom.reset],
    ),
  )

  return (
    <ChartFrame hover={hover} handlers={frameHandlers} height={size === 'fullscreen' ? 'fill' : 208}>
      <Bar ref={attachChart} data={data} options={options} updateMode={UPDATE_MODE} />
    </ChartFrame>
  )
}
