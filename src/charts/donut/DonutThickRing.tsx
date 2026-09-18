import { useControls } from '../../components/ControlPanel'
import { trafficByProtocol } from '../../data/mockData'
import type { ChartProps } from '../chartOptions'
import { DonutBase } from './DonutBase'

export function DonutThickRing({ cardIndex, size = 'card' }: ChartProps) {
  const { global } = useControls()
  const { slices, unit } = trafficByProtocol(global.density)

  return (
    <DonutBase
      cardIndex={cardIndex}
      size={size}
      slices={slices}
      unit={unit}
      datasetLabel="Tunnel traffic"
      role="categorical"
      allowGrouping={false}
    />
  )
}
