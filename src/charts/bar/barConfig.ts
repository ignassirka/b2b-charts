/**
 * Bar data and options, assembled from the direction contract.
 *
 * Bars are where directions diverge hardest — D1 wants 6px hairline columns nearly flush, D2
 * wants 22px rounded lozenges floating with no axis, D4 wants 44px blocks with zero gap and
 * the value set inside. All of that is resolved here rather than in the shell.
 */

import type { ChartOptions, ScriptableContext } from 'chart.js'
import type { GlobalControls } from '../../components/ControlPanel'
import type { Unit } from '../../data/mockData'
import type { ChartDirection } from '../../theme/directions'
import type { SeriesState, ThemeTokens } from '../../theme/useThemeTokens'
import {
  barAnimation,
  categoryAxis,
  furnitureConfig,
  legendConfig,
  pointInteraction,
  restyleTransition,
  textStyle,
  thresholdAnnotation,
  valueAxis,
  zoomConfig,
  type ChartSize,
  type SizeSpec,
  type ZoomWindow,
} from '../chartOptions'
import {
  barGeometry,
  emphasisWidth,
  gateColor,
  outlineBorder,
  seriesPaint,
  tokenValue,
  tonePair,
  type GateFacts,
} from '../directionStyle'
import { directionAxisValue } from '../directionStyle'
import { formatValue } from '../format'
import type { Chart } from 'chart.js'

export interface BarSeries {
  label: string
  values: number[]
  colorAt: (index: number, state: SeriesState) => string
}

export interface BarBuildArgs {
  labels: string[]
  tickLabels: string[] | undefined
  series: BarSeries[]
  unit: Unit
  tokens: ThemeTokens
  direction: ChartDirection
  global: GlobalControls
  spec: SizeSpec
  size: ChartSize
  axisMax: number
  axisMin: number | undefined
  stepSize: number | undefined
  horizontal: boolean
  threshold: number | null
  stacked: boolean
  thickness: number
  radius: number
  thicknessScale: number
  hover: { datasetIndex: number; index: number } | null
  edgeLabelColors: string[] | undefined
  valueLabels: boolean
  reduced: boolean
  cardIndex: number
  zoomWindow: ZoomWindow | null
  reportZoom: (chart: Chart) => void
  /** Palette slot per dataset, so gradients pair correctly. */
  slotFor: (datasetIndex: number) => number
}

/** Rounds the outer end of a bar only — a stack keeps square joins between its segments. */
function cornerRadius(radius: number, horizontal: boolean, isCap: boolean) {
  if (!isCap || radius <= 0) return 0
  return horizontal
    ? { topRight: radius, bottomRight: radius, topLeft: 0, bottomLeft: 0 }
    : { topLeft: radius, topRight: radius, bottomLeft: 0, bottomRight: 0 }
}

function factsFor(
  args: BarBuildArgs,
  datasetIndex: number,
  index: number,
  lastIndex: number,
): GateFacts {
  const value = args.series[datasetIndex].values[index]
  return {
    hovered: args.hover?.datasetIndex === datasetIndex && args.hover.index === index,
    breaching: args.threshold !== null && value >= args.threshold,
    latest: index === lastIndex,
    largest: false,
  }
}

export function buildBarData(args: BarBuildArgs) {
  const { series, direction, tokens, horizontal, stacked, hover } = args
  const geometry = barGeometry(direction, args.thickness, args.radius, args.thicknessScale)
  const anyActive = hover !== null

  return {
    labels: args.labels,
    datasets: series.map((entry, datasetIndex) => {
      const lastIndex = entry.values.length - 1
      const paintFor = (ctx: ScriptableContext<'bar'>) => {
        const index = ctx.dataIndex
        const facts = factsFor(args, datasetIndex, index, lastIndex)
        const resolved = entry.colorAt(index, facts.hovered ? 'hover' : 'default')
        const base = gateColor(resolved, facts, direction, tokens)
        if (anyActive && !facts.hovered) return tokens.dim(base, direction.series.idleOpacity)

        const area = ctx.chart.chartArea
        if (!area) return base
        const pair = tonePair(args.slotFor(datasetIndex), tokens)
        const partner = base === pair.dark ? pair.light : base === pair.light ? pair.dark : base
        return seriesPaint(base, partner, direction, tokens, {
          ctx: ctx.chart.ctx,
          from: horizontal ? area.left : area.bottom,
          to: horizontal ? area.right : area.top,
          axis: horizontal ? 'x' : 'y',
        })
      }

      const outline = outlineBorder(entry.colorAt(0, 'default'), direction)

      /**
       * Weight is the non-colour channel for a breach: an outline direction thickens its
       * stroke, and a filled one gains an edge in its own colour, so D5's above-threshold
       * bars read as heavier even in a greyscale screenshot.
       */
      const edgeWidth = (ctx: ScriptableContext<'bar'>) => {
        const facts = factsFor(args, datasetIndex, ctx.dataIndex, lastIndex)
        if (outline) return emphasisWidth(outline.width, facts, direction)
        if (!facts.breaching) return 0
        return Math.max(0, Math.round((direction.emphasis.breachWeight - 1) * 2))
      }

      return {
        label: entry.label,
        data: entry.values,
        backgroundColor: paintFor,
        borderColor: (ctx: ScriptableContext<'bar'>) =>
          gateColor(
            entry.colorAt(ctx.dataIndex, 'default'),
            factsFor(args, datasetIndex, ctx.dataIndex, lastIndex),
            direction,
            tokens,
          ),
        borderWidth: edgeWidth,
        borderRadius: cornerRadius(
          geometry.borderRadius,
          horizontal,
          !stacked || datasetIndex === series.length - 1,
        ),
        maxBarThickness: geometry.maxBarThickness,
        categoryPercentage: geometry.categoryPercentage,
        barPercentage: geometry.barPercentage,
        borderSkipped: false as const,
      }
    }),
  }
}

export function buildBarOptions(args: BarBuildArgs): ChartOptions<'bar'> {
  const {
    direction, tokens, global, spec, size, unit, labels, tickLabels, series, horizontal,
    stacked, threshold, axisMax, axisMin, stepSize, edgeLabelColors, valueLabels, reduced,
    cardIndex, zoomWindow, reportZoom,
  } = args

  const valueSide = horizontal ? 'x' : 'y'
  const categorySide = horizontal ? 'y' : 'x'
  const showEdge = Boolean(edgeLabelColors)
  const labelText = textStyle(direction, size, 'value')
  const insideLabels = direction.labelling.valueLabelPlacement === 'inside'

  return {
    indexAxis: horizontal ? ('y' as const) : ('x' as const),
    layout: { padding: { right: showEdge ? labelText.size * 4.6 : 0 } },
    animation: barAnimation({ cardIndex, reduced }, labels.length, direction),
    transitions: restyleTransition(direction),
    interaction: pointInteraction,
    scales: {
      [valueSide]: {
        ...valueAxis(valueSide, {
          global, tokens, size: spec, direction, unit, max: axisMax, min: axisMin, stepSize,
        }),
        stacked,
      },
      [categorySide]: {
        ...categoryAxis(categorySide, {
          global,
          tokens,
          size: spec,
          direction,
          tickLabels,
          min: zoomWindow?.min,
          max: zoomWindow?.max,
          maxTicksLimit: horizontal ? 12 : 6,
        }),
        stacked,
      },
    },
    plugins: {
      legend: legendConfig(global, tokens, spec, series.length, direction),
      furniture: {
        ...furnitureConfig(global, tokens, direction),
        // A horizontal chart's baseline is its left edge, which the frame already draws.
        baseline: horizontal ? ('none' as const) : direction.frame.baseline,
      },
      annotation: thresholdAnnotation(
        valueSide,
        threshold,
        tokens,
        direction,
        threshold === null ? undefined : directionAxisValue(threshold, unit, direction),
      ),
      zoom: zoomConfig(size, tokens, reportZoom),
      barValueLabels: {
        // A ranked row already prints its value in the right-hand column; printing it at the
        // bar end as well would say the same number twice.
        enabled: valueLabels && !showEdge,
        // A stack only has room for one number: its total, at the cap.
        rows: stacked
          ? {
              [series.length - 1]: labels.map((_, i) =>
                directionAxisValue(
                  series.reduce((sum, entry) => sum + entry.values[i], 0),
                  unit,
                  direction,
                ),
              ),
            }
          : Object.fromEntries(
              series.map((entry, i) => [
                i,
                entry.values.map((v) => directionAxisValue(v, unit, direction)),
              ]),
            ),
        color: tokens.textMuted,
        insideColor: tokens.cardSurface,
        font: labelText.size,
        horizontal,
        placement: insideLabels ? ('inside' as const) : ('outside' as const),
        text: labelText,
      },
      edgeValueLabels: {
        enabled: showEdge,
        values: series[0].values.map((v) => formatValue(v, unit)),
        colors: edgeLabelColors ?? [tokens.textMuted],
        font: labelText.size,
        text: labelText,
      },
      reveal: {
        enabled: direction.motion.reveal === 'wipe',
        axis: horizontal ? ('y' as const) : ('x' as const),
        durationMs: direction.motion.entryMs,
        steps: 10,
        reduced,
      },
      datasetEffects: {
        enabled: direction.series.glow > 0 || direction.series.contactShadow,
        glow: Object.fromEntries(series.map((_, i) => [i, direction.series.glow])),
        colors: Object.fromEntries(
          series.map((entry, i) => [i, entry.colorAt(0, 'default')]),
        ),
        contactShadow: direction.series.contactShadow,
        contactColor: tokens.dim(tokens.textStrong, 0.3),
      },
      crosshair: { enabled: false, color: tokens.textMuted, width: 1, dash: [] },
      breachPulse: {
        enabled: false,
        threshold: null,
        axis: valueSide,
        ruleColor: tokenValue('seriesNeutral', tokens),
        ruleWidth: 1,
        dash: [4, 4] as [number, number],
        marker: null,
        breaching: false,
        pulse: false,
        reduced,
      },
    },
  }
}
