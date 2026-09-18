import { useCallback, useEffect, useMemo } from 'react'
import { Doughnut } from 'react-chartjs-2'
import type { Chart as ChartJS, ChartOptions } from 'chart.js'
import { useControls, type DonutLabels } from '../../components/ControlPanel'
import { usePublishChart } from '../../components/VariantCard'
import type { Slice, Unit } from '../../data/mockData'
import type { SeriesState } from '../../theme/useThemeTokens'
import { ChartFrame, useChartHover } from '../ChartFrame'
import { SpotlightStat } from '../SpotlightStat'
import {
  UPDATE_MODE,
  restyleTransition,
  categoricalColor,
  dimIfIdle,
  donutAnimation,
  formatValue,
  legendConfig,
  signalColor,
  sizeSpec,
  spotlightNumber,
  useChartBase,
  useChartInstance,
  warnOnMixedPalette,
  type ChartSize,
  type PaletteRole,
  type SignalLevel,
} from '../chartOptions'

/** The grouped tail always lands on palette 5, whatever position it ends up in. */
const OTHER_SLOT = 4
const OTHER_LABEL = 'Other'

export interface DonutBaseProps {
  cardIndex: number
  size: ChartSize
  slices: Slice[]
  unit: Unit
  datasetLabel: string
  role: PaletteRole
  /** Required for the signal role: maps each slice to its health reading. */
  levelAt?: (slice: Slice, index: number) => SignalLevel
  /** Overrides the shared value-label control for variants that exist to demonstrate it. */
  forceLabels?: DonutLabels
  /** Variants with too few categories cannot fold a tail. */
  allowGrouping?: boolean
  /** The headline figure shown above the ring when the "Spotlight number" control is on. */
  spotlightValue?: number
  /** Short caption beside the spotlight figure — states what it is and its unit. */
  spotlightLabel?: string
}

/** Shared doughnut shell. Every donut variant is this plus a couple of props. */
export function DonutBase({
  cardIndex,
  size,
  slices,
  unit,
  datasetLabel,
  role,
  levelAt,
  forceLabels,
  allowGrouping = true,
  spotlightValue,
  spotlightLabel,
}: DonutBaseProps) {
  const { global, tokens, motion } = useChartBase(cardIndex)
  const { donut } = useControls()
  const spec = sizeSpec(size)
  const [chart, attachChart] = useChartInstance<ChartJS<'doughnut', number[], string>>()

  /** Order, then fold the smallest into "Other" — the two donut controls, applied in that order. */
  const display = useMemo(() => {
    const ordered =
      donut.order === 'value-desc' ? [...slices].sort((a, b) => b.value - a.value) : [...slices]
    if (!allowGrouping || !donut.groupTail || ordered.length <= donut.topN) return ordered

    const ranked = [...ordered].sort((a, b) => b.value - a.value)
    const keep = new Set(ranked.slice(0, donut.topN).map((s) => s.label))
    const tail = ordered.filter((s) => !keep.has(s.label))
    return [
      ...ordered.filter((s) => keep.has(s.label)),
      { label: OTHER_LABEL, value: tail.reduce((sum, s) => sum + s.value, 0) },
    ]
  }, [slices, donut.order, donut.groupTail, donut.topN, allowGrouping])

  const colorFor = useCallback(
    (index: number, state: SeriesState) => {
      if (role === 'signal') return signalColor(levelAt?.(display[index], index) ?? 'neutral', tokens)
      const slot = display[index].label === OTHER_LABEL ? OTHER_SLOT : index
      return categoricalColor(slot, tokens, state)
    },
    [role, levelAt, display, tokens],
  )

  const resolveColor = useCallback((_d: number, index: number) => colorFor(index, 'hover'), [colorFor])
  const format = useCallback((value: number) => formatValue(value, unit), [unit])
  const { hover, onHover, frameHandlers } = useChartHover({ kind: 'slice', resolveColor, format })

  const active = hover?.index ?? null
  const anyActive = active !== null

  const restingColors = useMemo(
    () => display.map((_, i) => colorFor(i, 'default')),
    [display, colorFor],
  )
  useEffect(
    () => warnOnMixedPalette(datasetLabel, restingColors, tokens),
    [datasetLabel, restingColors, tokens],
  )

  const data = useMemo(
    () => ({
      labels: display.map((slice) => slice.label),
      datasets: [
        {
          label: datasetLabel,
          data: display.map((slice) => slice.value),
          backgroundColor: display.map((_, i) =>
            dimIfIdle(colorFor(i, i === active ? 'hover' : 'default'), i === active, anyActive, tokens),
          ),
          // Hovered segment lifts out of the ring; the rest stay seated.
          offset: display.map((_, i) => (i === active ? 6 : 0)),
          borderWidth: 0,
          spacing: 2,
        },
      ],
    }),
    [display, datasetLabel, active, anyActive, colorFor, tokens],
  )

  const labelMode = forceLabels ?? donut.valueLabels
  const shares = useMemo(() => {
    const total = display.reduce((sum, slice) => sum + slice.value, 0) || 1
    return display.map((slice) => `${Math.round((slice.value / total) * 100)}%`)
  }, [display])

  const options = useMemo<ChartOptions<'doughnut'>>(
    () => ({
      cutout: `${donut.cutout}%`,
      rotation: donut.startAngle,
      layout: { padding: labelMode === 'outside' ? spec.font * 2.6 : spec.padding },
      animation: donutAnimation(motion),
      transitions: restyleTransition,
      onHover,
      plugins: {
        legend: legendConfig(global, tokens, spec, display.length),
        arcValueLabels: {
          enabled: labelMode !== 'off',
          values: shares,
          color: tokens.textMuted,
          insideColor: tokens.cardSurface,
          placement: labelMode === 'inside' ? ('inside' as const) : ('outside' as const),
          font: spec.font,
        },
      },
    }),
    [donut.cutout, donut.startAngle, labelMode, spec, motion, onHover, global, tokens, display, unit, shares],
  )

  usePublishChart(
    useMemo(
      () => ({ config: { type: 'doughnut', data, options }, chart, unit, zoomed: false, resetZoom: null }),
      [data, options, chart, unit],
    ),
  )

  return (
    <div className="flex w-full flex-1 flex-col">
      {global.spotlight && spotlightValue !== undefined && spotlightLabel && (
        <SpotlightStat value={spotlightNumber(spotlightValue, unit)} label={spotlightLabel} size={size} />
      )}
      <ChartFrame hover={hover} handlers={frameHandlers} height={size === 'fullscreen' ? 'fill' : 220}>
        <Doughnut ref={attachChart} data={data} options={options} updateMode={UPDATE_MODE} />
      </ChartFrame>
    </div>
  )
}
