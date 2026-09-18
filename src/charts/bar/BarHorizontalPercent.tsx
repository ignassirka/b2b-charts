import { useControls } from '../../components/ControlPanel'
import { gatewayUtilisationByTeam } from '../../data/mockData'
import { useThemeTokens } from '../../theme/useThemeTokens'
import { signalColor, type ChartProps, type SignalLevel } from '../chartOptions'
import { BarBase } from './BarBase'

/** A team's dedicated gateway past 85% has no headroom left. */
function usageLevel(percent: number): SignalLevel {
  if (percent >= 85) return 'bad'
  if (percent >= 65) return 'warning'
  return 'neutral'
}

export function BarHorizontalPercent({ cardIndex, size = 'card' }: ChartProps) {
  const { global } = useControls()
  const tokens = useThemeTokens()
  const { slices, unit } = gatewayUtilisationByTeam(global.density)
  const peak = Math.max(...slices.map((row) => row.value))

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
      gatewayIcons
      edgeLabelColors={slices.map((row) => signalColor(usageLevel(row.value), tokens))}
      spotlightValue={peak}
      spotlightLabel="highest team utilisation"
    />
  )
}
