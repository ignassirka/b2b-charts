import { useControls } from '../../components/ControlPanel'
import { activeConnections } from '../../data/mockData'
import { useThemeTokens } from '../../theme/useThemeTokens'
import { neutralTone, type ChartProps } from '../chartOptions'
import { LineBase } from './LineBase'

export function LineSingleNeutral({ cardIndex, size = 'card' }: ChartProps) {
  const { global } = useControls()
  const tokens = useThemeTokens()
  const set = activeConnections(global.density)

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
          tone: (state) => neutralTone(tokens, state),
        },
      ]}
      unit={set.unit}
      axisMax={set.axisMax}
      stepSize={set.stepSize}
    />
  )
}
