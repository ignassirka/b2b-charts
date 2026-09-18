import { useControls } from '../../components/ControlPanel'
import { connectionsByRegion } from '../../data/mockData'
import { useThemeTokens } from '../../theme/useThemeTokens'
import { categoricalColor, type ChartProps } from '../chartOptions'
import { LineBase } from './LineBase'

export function LineMultiSeries({ cardIndex, size = 'card' }: ChartProps) {
  const { global } = useControls()
  const tokens = useThemeTokens()
  const set = connectionsByRegion(global.density)
  const latestTotal = set.series.reduce((sum, entry) => sum + entry.values[entry.values.length - 1], 0)

  return (
    <LineBase
      cardIndex={cardIndex}
      size={size}
      labels={set.labels}
      tickLabels={set.tickLabels}
      series={set.series.map((entry, i) => ({
        label: entry.label,
        values: entry.values,
        tone: (state) => categoricalColor(i, tokens, state),
      }))}
      unit={set.unit}
      axisMax={set.axisMax}
      stepSize={set.stepSize}
      spotlightValue={latestTotal}
      spotlightLabel="tunnels active across all regions"
    />
  )
}
