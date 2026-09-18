import { useControls } from '../../components/ControlPanel'
import { throughput } from '../../data/mockData'
import { useThemeTokens } from '../../theme/useThemeTokens'
import { categoricalColor, type ChartProps } from '../chartOptions'
import { LineBase } from './LineBase'

export function LineArea({ cardIndex, size = 'card' }: ChartProps) {
  const { global } = useControls()
  const tokens = useThemeTokens()
  const set = throughput(global.density)
  const values = set.series[0].values
  const latest = values[values.length - 1] ?? 0

  return (
    <LineBase
      cardIndex={cardIndex}
      size={size}
      labels={set.labels}
      tickLabels={set.tickLabels}
      series={[
        {
          label: set.series[0].label,
          values: set.series[0].values,
          tone: (state) => categoricalColor(0, tokens, state),
        },
      ]}
      unit={set.unit}
      axisMax={set.axisMax}
      stepSize={set.stepSize}
      forceArea
      spotlightValue={latest}
      spotlightLabel="Gbps egress right now"
    />
  )
}
