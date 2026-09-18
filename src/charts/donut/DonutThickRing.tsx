import { useControls } from '../../components/ControlPanel'
import { trafficByProtocol } from '../../data/mockData'
import type { ChartProps } from '../chartOptions'
import { DonutBase } from './DonutBase'

export function DonutThickRing({ cardIndex, size = 'card' }: ChartProps) {
  const { global } = useControls()
  const { slices, unit } = trafficByProtocol(global.density)
  // Shares always sum to 100%, so the headline is the leading protocol rather than the total.
  const leader = [...slices].sort((a, b) => b.value - a.value)[0]

  return (
    <DonutBase
      cardIndex={cardIndex}
      size={size}
      slices={slices}
      unit={unit}
      datasetLabel="Tunnel traffic"
      role="categorical"
      allowGrouping={false}
      spotlightValue={leader.value}
      spotlightLabel={`share carried by ${leader.label}`}
    />
  )
}
