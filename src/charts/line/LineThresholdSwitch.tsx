import type { ChartProps } from '../chartOptions'
import { LineBase } from './LineBase'
import { useGatewayLoadSeries } from './thresholdSeries'

export function LineThresholdSwitch({ cardIndex, size = 'card' }: ChartProps) {
  const load = useGatewayLoadSeries()

  return (
    <LineBase
      cardIndex={cardIndex}
      size={size}
      labels={load.labels}
      tickLabels={load.tickLabels}
      series={load.series}
      unit={load.unit}
      axisMax={load.axisMax}
      stepSize={load.stepSize}
      threshold={load.threshold}
    />
  )
}
