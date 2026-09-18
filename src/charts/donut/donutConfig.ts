/**
 * Doughnut data and options, assembled from the direction contract.
 *
 * Lives outside the component so `DonutBase` stays a thin shell: every knob a direction can
 * turn for a ring is resolved here, and no variant or component branches on a direction id.
 */

import type { ChartOptions, ScriptableContext } from 'chart.js'
import type { Slice, Unit } from '../../data/mockData'
import type { ChartDirection } from '../../theme/directions'
import type { SeriesState, ThemeTokens } from '../../theme/useThemeTokens'
import {
  donutAnimation,
  furnitureConfig,
  legendConfig,
  restyleTransition,
  textStyle,
  type ChartSize,
  type SizeSpec,
} from '../chartOptions'
import {
  directionHeroValue,
  donutArcRadius,
  donutOffsetIndex,
  gateColor,
  seriesPaint,
  tokenValue,
  tonePair,
  type GateFacts,
} from '../directionStyle'
import type { GlobalControls } from '../../components/ControlPanel'

export interface DonutBuildArgs {
  display: Slice[]
  datasetLabel: string
  unit: Unit
  tokens: ThemeTokens
  direction: ChartDirection
  global: GlobalControls
  spec: SizeSpec
  size: ChartSize
  /** Resting/hover colour for a slice, as the variant defines it. */
  colorFor: (index: number, state: SeriesState) => string
  /** Palette slot, so a gradient can find the other tone of the same pair. */
  slotFor: (index: number) => number
  active: number | null
  /** Cutout the contextual control resolved to. */
  cutout: number
  startAngle: number
  labelMode: 'off' | 'inside' | 'outside'
  reduced: boolean
  centreLabel: string | null
  motionDelayIndex: number
}

function factsFor(index: number, args: DonutBuildArgs, largest: number | null): GateFacts {
  return {
    hovered: args.active === index,
    breaching: false,
    latest: false,
    largest: largest === index,
  }
}

/** Largest slice — D5 spends colour on it, D4 pulls it out of the ring. */
function largestIndex(values: number[]): number | null {
  if (!values.length) return null
  let best = 0
  values.forEach((value, index) => {
    if (value > values[best]) best = index
  })
  return best
}

export function buildDonutData(args: DonutBuildArgs) {
  const { display, direction, tokens, colorFor, slotFor, active } = args
  const values = display.map((slice) => slice.value)
  const largest = largestIndex(values)
  const anyActive = active !== null
  const pulled = donutOffsetIndex(direction, values)

  const paintFor = (index: number, ctx: ScriptableContext<'doughnut'>) => {
    const facts = factsFor(index, args, largest)
    const base = gateColor(
      colorFor(index, index === active ? 'hover' : 'default'),
      facts,
      direction,
      tokens,
    )
    const { chartArea } = ctx.chart
    const pair = tonePair(slotFor(index), tokens)
    const partner = base === pair.dark ? pair.light : base === pair.light ? pair.dark : base
    const paint = chartArea
      ? seriesPaint(base, partner, direction, tokens, {
          ctx: ctx.chart.ctx,
          from: chartArea.top,
          to: chartArea.bottom,
          axis: 'y',
        })
      : base
    // Dimming has to happen after the paint is chosen, and a gradient cannot take an alpha,
    // so idle segments fall back to the flat dimmed colour.
    if (anyActive && index !== active) {
      return tokens.dim(base, direction.series.idleOpacity)
    }
    return paint
  }

  return {
    labels: display.map((slice) => slice.label),
    datasets: [
      {
        label: args.datasetLabel,
        data: values,
        backgroundColor: (ctx: ScriptableContext<'doughnut'>) =>
          paintFor(ctx.dataIndex, ctx),
        // Hovered segment lifts out of the ring; D4 keeps one permanently pulled out.
        offset: display.map((_, index) =>
          index === active || index === pulled ? direction.series.donutLift : 0,
        ),
        borderWidth: 0,
        borderRadius: donutArcRadius(direction, 14),
        spacing: direction.series.donutGap,
      },
    ],
  }
}

export function buildDonutOptions(args: DonutBuildArgs): ChartOptions<'doughnut'> {
  const {
    display,
    direction,
    tokens,
    global,
    spec,
    size,
    unit,
    cutout,
    startAngle,
    labelMode,
    centreLabel,
    reduced,
    motionDelayIndex,
  } = args

  const total = display.reduce((sum, slice) => sum + slice.value, 0) || 1
  const shares = display.map((slice) => `${Math.round((slice.value / total) * 100)}%`)
  const leaders = direction.labelling.model === 'leader-lines'
  const labelText = textStyle(direction, size, 'value')
  const outsideRoom = labelMode === 'outside' || leaders

  return {
    cutout: `${cutout}%`,
    rotation: startAngle,
    layout: {
      padding: outsideRoom ? labelText.size * (leaders ? 4 : 2.6) : direction.frame.plotPadding,
    },
    animation: donutAnimation({ cardIndex: motionDelayIndex, reduced }, direction),
    transitions: restyleTransition(direction),
    plugins: {
      legend: legendConfig(global, tokens, spec, display.length, direction),
      // A ring has no axes, so the furniture plugin has nothing to draw.
      furniture: { ...furnitureConfig(global, tokens, direction), enabled: false },
      centerText: {
        enabled: Boolean(centreLabel),
        value: directionHeroValue(
          display.reduce((sum, slice) => sum + slice.value, 0),
          unit,
          direction,
        ),
        label: centreLabel ?? '',
        valueColor: tokens.textStrong,
        labelColor: tokens.textMuted,
        font: labelText.size,
        heroScale: direction.type.heroScale,
        text: labelText,
      },
      arcValueLabels: {
        enabled: labelMode !== 'off',
        values: shares,
        color: tokens.textMuted,
        insideColor: tokens.cardSurface,
        placement: labelMode === 'inside' ? ('inside' as const) : ('outside' as const),
        font: labelText.size,
        text: labelText,
        leaderLines: leaders,
        leaderColor: tokenValue(direction.frame.axisToken, tokens),
        circumferenceTicks: leaders || direction.frame.tickMarks !== 'none',
        tickLength: Math.max(3, direction.frame.tickLength),
      },
      reveal: {
        enabled: direction.motion.reveal === 'wipe',
        axis: 'x' as const,
        durationMs: direction.motion.entryMs,
        steps: 8,
        reduced,
      },
      datasetEffects: {
        enabled: direction.series.glow > 0 || direction.series.contactShadow,
        glow: { 0: direction.series.glow },
        colors: { 0: tokens.dim(tokens.textStrong, 0.35) },
        contactShadow: direction.series.contactShadow,
        contactColor: tokens.dim(tokens.textStrong, 0.28),
      },
    },
  }
}
