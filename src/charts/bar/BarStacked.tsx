import { useControls } from '../../components/ControlPanel'
import { threatsByCategory } from '../../data/mockData'
import { useThemeTokens } from '../../theme/useThemeTokens'
import { categoricalColor, type ChartProps } from '../chartOptions'
import { BarBase } from './BarBase'

export function BarStacked({ cardIndex, size = 'card' }: ChartProps) {
  const { global } = useControls()
  const tokens = useThemeTokens()
  const set = threatsByCategory(global.density)

  return (
    <BarBase
      cardIndex={cardIndex}
      size={size}
      labels={set.labels}
      tickLabels={set.tickLabels}
      series={set.series.map((entry, i) => ({
        label: entry.label,
        values: entry.values,
        colorAt: (_index, state) => categoricalColor(i, tokens, state),
      }))}
      unit={set.unit}
      axisMax={set.axisMax}
      stepSize={set.stepSize}
      forceStacked
      thicknessScale={0.8}
    />
  )
}
