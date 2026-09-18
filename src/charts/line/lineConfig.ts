/**
 * Line data and options, assembled from the direction contract.
 *
 * This is where the emphasis model does most of its work: D5 keeps a series neutral until it
 * breaches and then thickens it and pulses its endpoint, D2 replaces the legend with a label
 * parked at the last point, D3 strokes with a gradient and haloes its markers.
 */

import type { Chart, ChartOptions, ScriptableContext, ScriptableLineSegmentContext } from 'chart.js'
import type { GlobalControls, LineSettings } from '../../components/ControlPanel'
import type { Unit } from '../../data/mockData'
import { DIM_OPACITY } from '../../theme/tokens'
import type { ChartDirection } from '../../theme/directions'
import type { SeriesState, ThemeTokens } from '../../theme/useThemeTokens'
import {
  categoryAxis,
  furnitureConfig,
  indexInteraction,
  legendConfig,
  lineAnimations,
  lineTension,
  pointRadiusScriptable,
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
  POINT_STYLES,
  breachDash,
  directionAxisValue,
  emphasisWidth,
  gateColor,
  seriesPaint,
  tonePair,
  type GateFacts,
} from '../directionStyle'

export interface LineSeriesSpec {
  label: string
  values: number[]
  tone: (state: SeriesState) => string
  /** Chart.js v4 scriptable segment colour — one dataset, two colours. */
  segment?: (ctx: ScriptableLineSegmentContext) => string | CanvasGradient | undefined
}

export interface LineBuildArgs {
  labels: string[]
  tickLabels: string[] | undefined
  series: LineSeriesSpec[]
  unit: Unit
  tokens: ThemeTokens
  direction: ChartDirection
  global: GlobalControls
  line: LineSettings
  spec: SizeSpec
  size: ChartSize
  axisMax: number
  axisMin: number | undefined
  stepSize: number | undefined
  threshold: number | null
  area: boolean
  stepped: boolean
  compact: boolean
  endDot: { color: string } | null
  hover: { datasetIndex: number; index: number } | null
  entered: boolean
  reduced: boolean
  cardIndex: number
  zoomWindow: ZoomWindow | null
  reportZoom: (chart: Chart) => void
}

/** Whether a series ends above its limit — drives weight, dash and the pulse. */
function seriesBreaching(args: LineBuildArgs, datasetIndex: number): boolean {
  const values = args.series[datasetIndex].values
  return args.threshold !== null && values[values.length - 1] >= args.threshold
}

export function buildLineData(args: LineBuildArgs) {
  const { series, direction, tokens, line, size, labels, hover, endDot } = args
  const anyActive = hover !== null
  const radiusOf = pointRadiusScriptable(
    line,
    size,
    labels.length,
    hover?.index ?? null,
    direction,
  )
  const halo = direction.series.pointShape === 'halo'

  return {
    labels,
    datasets: series.map((entry, datasetIndex) => {
      const lastIndex = entry.values.length - 1
      const breaching = seriesBreaching(args, datasetIndex)
      const isActive = hover?.datasetIndex === datasetIndex
      const facts: GateFacts = {
        hovered: isActive,
        breaching,
        latest: true,
        largest: false,
      }
      const resolved = entry.tone(isActive ? 'hover' : 'default')
      const gated = gateColor(resolved, facts, direction, tokens)
      const stroke = anyActive && !isActive ? tokens.dim(gated, direction.series.idleOpacity) : gated

      const isEndDot = (ctx: ScriptableContext<'line'>) =>
        Boolean(endDot) && datasetIndex === 0 && ctx.dataIndex === lastIndex

      // A gradient stroke runs along the value axis between the two tones of one pair.
      const strokePaint = (ctx: ScriptableContext<'line'>) => {
        const area = ctx.chart.chartArea
        if (!area || direction.series.fill !== 'gradient') return stroke
        const pair = tonePair(datasetIndex, tokens)
        const partner = stroke === pair.dark ? pair.light : stroke === pair.light ? pair.dark : stroke
        return seriesPaint(stroke, partner, direction, tokens, {
          ctx: ctx.chart.ctx,
          from: area.bottom,
          to: area.top,
          axis: 'y',
        })
      }

      return {
        label: entry.label,
        data: entry.values,
        borderColor: strokePaint,
        borderWidth: emphasisWidth(line.lineWidth, facts, direction),
        borderDash: breachDash(direction, breaching) ?? [],
        borderCapStyle: direction.series.lineCap,
        borderJoinStyle: direction.series.lineJoin,
        tension: lineTension(line, args.stepped, direction),
        stepped: args.stepped ? ('before' as const) : (false as const),
        segment: entry.segment ? { borderColor: entry.segment } : undefined,
        pointStyle: POINT_STYLES[direction.series.pointShape] ?? 'circle',
        // The end dot reports current state, so it renders whatever the points control says.
        pointRadius: (ctx: ScriptableContext<'line'>) =>
          isEndDot(ctx) ? Math.max(4, radiusOf(ctx)) : radiusOf(ctx),
        pointBackgroundColor: (ctx: ScriptableContext<'line'>) =>
          isEndDot(ctx) ? (endDot?.color ?? stroke) : stroke,
        pointHoverRadius: (ctx: ScriptableContext<'line'>) =>
          isEndDot(ctx) ? Math.max(4, radiusOf(ctx)) : radiusOf(ctx),
        // A halo marker is a filled dot inside a ring of its own colour.
        pointBorderColor: halo ? tokens.dim(stroke, 0.35) : stroke,
        pointBorderWidth: halo ? Math.max(2, direction.series.pointSize * 0.8) : 0,
        pointHoverBorderWidth: halo ? Math.max(2, direction.series.pointSize) : 0,
        fill: false as const,
      }
    }),
  }
}

export function buildLineOptions(args: LineBuildArgs): ChartOptions<'line'> {
  const {
    direction, tokens, global, line, spec, size, unit, labels, tickLabels, series, threshold,
    axisMax, axisMin, stepSize, compact, area, entered, reduced, cardIndex, zoomWindow,
    reportZoom, endDot,
  } = args

  // Once the reveal has run, later updates tween normally instead of replaying it.
  const entry = entered
    ? { animation: { duration: direction.motion.hoverMs, easing: direction.motion.easing }, animations: {} }
    : lineAnimations({ cardIndex, reduced }, labels.length, direction)

  const labelText = textStyle(direction, size, 'value')
  const directModel = direction.labelling.model === 'direct' || direction.labelling.model === 'end-only'
  const breachingIndex = series.findIndex((_, i) => seriesBreaching(args, i))
  const anyBreaching = breachingIndex >= 0

  const crosshairStyle = direction.tooltip.crosshair
  const glowPerDataset = Object.fromEntries(
    series.map((_, i) => [
      i,
      // A glow direction spends it on the series that matters: breaching, or all when none does.
      direction.series.glow > 0 && (!anyBreaching || seriesBreaching(args, i))
        ? direction.series.glow
        : 0,
    ]),
  )

  return {
    ...entry,
    transitions: restyleTransition(direction),
    interaction: indexInteraction,
    layout: {
      padding: compact
        ? { top: 6, bottom: 2, right: 8 }
        : directModel
          ? {
              top: spec.padding,
              bottom: spec.padding,
              // Sized from the longest label actually being parked there, so a direct label
              // cannot be clipped by the canvas edge.
              right: Math.ceil(
                labelText.size * 0.62 *
                  Math.max(
                    ...series.map((entry) =>
                      direction.labelling.model === 'end-only'
                        ? directionAxisValue(entry.values[entry.values.length - 1], unit, direction)
                            .length
                        : entry.label.length,
                    ),
                  ) +
                  labelText.size * 1.6,
              ),
            }
          : spec.padding,
    },
    scales: {
      y: compact
        ? { display: false, beginAtZero: axisMin === undefined, max: axisMax, min: axisMin }
        : valueAxis('y', {
            global, tokens, size: spec, direction, unit, max: axisMax, min: axisMin, stepSize,
          }),
      x: compact
        ? { display: false }
        : categoryAxis('x', {
            global,
            tokens,
            size: spec,
            direction,
            tickLabels,
            min: zoomWindow?.min,
            max: zoomWindow?.max,
          }),
    },
    plugins: {
      legend: compact
        ? { display: false }
        : legendConfig(global, tokens, spec, series.length, direction),
      furniture: {
        ...furnitureConfig(global, tokens, direction),
        enabled: !compact,
      },
      crosshair: {
        enabled: line.crosshair && crosshairStyle !== 'none',
        color: tokens.dim(tokens.textMuted, DIM_OPACITY),
        width: crosshairStyle === 'heavy' ? 2.5 : 1,
        dash: crosshairStyle === 'dashed' ? [3, 3] : [],
      },
      annotation: thresholdAnnotation(
        'y',
        threshold,
        tokens,
        direction,
        threshold === null ? undefined : directionAxisValue(threshold, unit, direction),
      ),
      zoom: zoomConfig(size, tokens, reportZoom),
      directLabels: {
        enabled: directModel && !compact,
        labels: series.map((entry, i) => ({
          text:
            direction.labelling.model === 'end-only'
              ? directionAxisValue(entry.values[entry.values.length - 1], unit, direction)
              : entry.label,
          color: gateColor(
            entry.tone('default'),
            { hovered: false, breaching: seriesBreaching(args, i), latest: true, largest: false },
            direction,
            tokens,
          ),
          datasetIndex: i,
        })),
        font: labelText.size,
        text: labelText,
        placement: 'end' as const,
      },
      areaFade: {
        enabled: area && direction.series.areaFill !== 'none',
        colorTop: tokens.dim(series[0].tone('default'), direction.series.areaOpacity),
        colorBottom: tokens.dim(series[0].tone('default'), 0),
        startAlpha: reduced ? 1 : 0,
        mode: direction.series.areaFill === 'flat' ? ('flat' as const) : ('gradient' as const),
      },
      reveal: {
        enabled: direction.motion.reveal === 'wipe' && !entered,
        axis: 'x' as const,
        durationMs: direction.motion.entryMs,
        steps: 12,
        reduced,
      },
      datasetEffects: {
        enabled: direction.series.glow > 0 || direction.series.contactShadow,
        glow: glowPerDataset,
        colors: Object.fromEntries(series.map((entry, i) => [i, entry.tone('default')])),
        contactShadow: false,
        contactColor: tokens.dim(tokens.textStrong, 0.3),
      },
      breachPulse: {
        enabled: direction.emphasis.breachPulse && !compact,
        threshold,
        axis: 'y' as const,
        ruleColor: tokens.thresholdLine,
        ruleWidth: direction.emphasis.thresholdWidth,
        dash: [direction.emphasis.thresholdDashOn, direction.emphasis.thresholdDashOff] as [
          number,
          number,
        ],
        // A quiet endpoint when healthy, a pulsing one when breaching — but only where a limit
        // actually exists, so a chart with nothing to breach gets no marker at all.
        marker: direction.emphasis.breachMarker && threshold !== null
          ? {
              datasetIndex: Math.max(0, breachingIndex),
              color: endDot?.color ?? tokens.dim(series[0].tone('default'), 1),
              radius: Math.max(3, direction.series.pointSize),
            }
          : null,
        breaching: anyBreaching,
        pulse: direction.motion.loopPulse,
        reduced,
      },
    },
  }
}
