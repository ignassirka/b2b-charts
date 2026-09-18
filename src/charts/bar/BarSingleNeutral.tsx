import { useControls } from '../../components/ControlPanel'
import { failedAuthAttempts } from '../../data/mockData'
import { useThemeTokens } from '../../theme/useThemeTokens'
import { neutralTone, type ChartProps } from '../chartOptions'
import { BarBase } from './BarBase'

export function BarSingleNeutral({ cardIndex, size = 'card' }: ChartProps) {
  const { global } = useControls()
  const tokens = useThemeTokens()
  const set = failedAuthAttempts(global.density)

  return (
    <BarBase
      cardIndex={cardIndex}
      size={size}
      labels={set.labels}
      tickLabels={set.tickLabels}
      series={[
        {
          label: set.series[0].label,
          values: set.series[0].values,
          colorAt: (_i, state) => neutralTone(tokens, state),
        },
      ]}
      unit={set.unit}
      axisMax={set.axisMax}
      stepSize={set.stepSize}
    />
  )
}
