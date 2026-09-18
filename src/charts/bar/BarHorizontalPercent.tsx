import { useControls } from '../../components/ControlPanel'
import { dedicatedServerUsage } from '../../data/mockData'
import { useThemeTokens } from '../../theme/useThemeTokens'
import { signalColor, type ChartProps, type SignalLevel } from '../chartOptions'
import { BarBase } from './BarBase'

/** A dedicated server past 85% has no headroom left for its team. */
function usageLevel(percent: number): SignalLevel {
  if (percent >= 85) return 'bad'
  if (percent >= 65) return 'warning'
  return 'neutral'
}

export function BarHorizontalPercent({ cardIndex, size = 'card' }: ChartProps) {
  const { global } = useControls()
  const tokens = useThemeTokens()
  const { slices, unit } = dedicatedServerUsage(global.density)

  return (
    <BarBase
      cardIndex={cardIndex}
      size={size}
      labels={slices.map((row) => row.label)}
      series={[
        {
          label: 'Utilisation',
          values: slices.map((row) => row.value),
          colorAt: (index) => signalColor(usageLevel(slices[index].value), tokens),
        },
      ]}
      unit={unit}
      axisMax={100}
      stepSize={25}
      horizontal
      thicknessScale={0.8}
      edgeLabelColors={slices.map((row) => signalColor(usageLevel(row.value), tokens))}
    />
  )
}
