import { useControls } from '../../components/ControlPanel'
import { connectionsByGateway } from '../../data/mockData'
import type { ChartProps } from '../chartOptions'
import { DonutBase } from './DonutBase'

/** Gateways ranked by load; the tail folds into a single slice pinned to palette 5. */
export function DonutSortedOther({ cardIndex, size = 'card' }: ChartProps) {
  const { global } = useControls()
  const { slices, unit } = connectionsByGateway(global.density)

  return (
    <DonutBase
      cardIndex={cardIndex}
      size={size}
      slices={slices}
      unit={unit}
      datasetLabel="Tunnels per gateway"
      role="categorical"
    />
  )
}
