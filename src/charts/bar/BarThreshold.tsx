import { useControls } from '../../components/ControlPanel'
import { gatewayLoad } from '../../data/mockData'
import { useThemeTokens } from '../../theme/useThemeTokens'
import { signalColor, type ChartProps } from '../chartOptions'
import { BarBase } from './BarBase'

/** Anything at or above the capacity threshold is a gateway about to shed tunnels. */
export function BarThreshold({ cardIndex, size = 'card' }: ChartProps) {
  const { global, bar } = useControls()
  const tokens = useThemeTokens()
  const set = gatewayLoad(global.density)
  const values = set.series[0].values
  const peak = Math.max(...values)

  return (
    <BarBase
      cardIndex={cardIndex}
      size={size}
      labels={set.labels}
      tickLabels={set.tickLabels}
      series={[
        {
          label: set.series[0].label,
          values,
          colorAt: (index) =>
            signalColor(values[index] >= bar.threshold ? 'bad' : 'neutral', tokens),
        },
      ]}
      unit={set.unit}
      axisMax={set.axisMax}
      stepSize={set.stepSize}
      threshold={bar.threshold}
      spotlightValue={peak}
      spotlightLabel="peak gateway load"
    />
  )
}
