import { useControls } from '../../components/ControlPanel'
import { axisCeiling, throughputByGateway } from '../../data/mockData'
import { useThemeTokens } from '../../theme/useThemeTokens'
import { categoricalColor, type ChartProps } from '../chartOptions'
import { BarBase } from './BarBase'

export function BarGrouped({ cardIndex, size = 'card' }: ChartProps) {
  const { global } = useControls()
  const tokens = useThemeTokens()
  const { gateways, inbound, outbound, unit } = throughputByGateway(global.density)

  return (
    <BarBase
      cardIndex={cardIndex}
      size={size}
      labels={gateways}
      series={[
        {
          label: 'Ingress',
          values: inbound,
          colorAt: (_index, state) => categoricalColor(0, tokens, state),
        },
        {
          label: 'Egress',
          values: outbound,
          colorAt: (_index, state) => categoricalColor(1, tokens, state),
        },
      ]}
      unit={unit}
      axisMax={axisCeiling([...inbound, ...outbound], 5)}
      stepSize={5}
      thicknessScale={0.9}
    />
  )
}
