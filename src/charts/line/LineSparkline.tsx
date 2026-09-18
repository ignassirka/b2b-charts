import type { ChartProps } from '../chartOptions'
import { LineBase } from './LineBase'
import { useGatewayLoadSeries } from './thresholdSeries'

/** Same series and same threshold as the full chart — the two move together. */
export function LineSparkline({ cardIndex, size = 'card' }: ChartProps) {
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
      threshold={load.threshold}
      compact={size === 'card'}
      endDot={{ color: load.endDotColor }}
    />
  )
}
