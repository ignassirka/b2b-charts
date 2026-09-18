import { useControls } from '../../components/ControlPanel'
import { SLA_UPTIME_PCT, uptimeVsSla } from '../../data/mockData'
import { useThemeTokens } from '../../theme/useThemeTokens'
import { signalColor, type ChartProps } from '../chartOptions'
import { BarBase } from './BarBase'

/** The axis starts just under the SLA — at full scale every bar would look identical. */
const AXIS_FLOOR = 99.4

export function BarTargetLine({ cardIndex, size = 'card' }: ChartProps) {
  const { global } = useControls()
  const tokens = useThemeTokens()
  const { slices, unit } = uptimeVsSla(global.density)

  return (
    <BarBase
      cardIndex={cardIndex}
      size={size}
      labels={slices.map((row) => row.label)}
      series={[
        {
          label: 'Uptime',
          values: slices.map((row) => row.value),
          colorAt: (index) =>
            signalColor(slices[index].value >= SLA_UPTIME_PCT ? 'good' : 'bad', tokens),
        },
      ]}
      unit={unit}
      axisMin={AXIS_FLOOR}
      axisMax={100}
      stepSize={0.2}
      threshold={SLA_UPTIME_PCT}
      thicknessScale={1.6}
    />
  )
}
