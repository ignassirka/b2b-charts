import { useMemo } from 'react'
import type { ScriptableLineSegmentContext } from 'chart.js'
import { useControls } from '../../components/ControlPanel'
import { REDUNDANCY_FLOOR, gatewaysOnline } from '../../data/mockData'
import { useThemeTokens } from '../../theme/useThemeTokens'
import { signalColor, type ChartProps, type SignalLevel } from '../chartOptions'
import { LineBase } from './LineBase'

/** One spare gateway is a warning; sitting on the floor means no redundancy at all. */
function fleetLevel(count: number): SignalLevel {
  if (count <= REDUNDANCY_FLOOR) return 'bad'
  if (count <= REDUNDANCY_FLOOR + 1) return 'warning'
  return 'good'
}

export function LineStepped({ cardIndex, size = 'card' }: ChartProps) {
  const { global } = useControls()
  const tokens = useThemeTokens()
  const set = gatewaysOnline(global.density)
  const values = set.series[0].values
  const latest = values[values.length - 1] ?? 0

  const segment = useMemo(
    () => (ctx: ScriptableLineSegmentContext) =>
      // A stepped segment holds the earlier value across its whole width.
      signalColor(fleetLevel(values[ctx.p0DataIndex]), tokens),
    [values, tokens],
  )

  return (
    <LineBase
      cardIndex={cardIndex}
      size={size}
      labels={set.labels}
      tickLabels={set.tickLabels}
      series={[
        {
          label: set.series[0].label,
          values,
          tone: () => signalColor('good', tokens),
          segment,
        },
      ]}
      unit={set.unit}
      axisMax={set.axisMax}
      stepSize={set.stepSize}
      threshold={REDUNDANCY_FLOOR}
      forceStepped
      spotlightValue={latest}
      spotlightLabel="gateways online right now"
    />
  )
}
