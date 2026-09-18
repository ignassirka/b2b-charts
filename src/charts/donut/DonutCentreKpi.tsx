import { useControls } from '../../components/ControlPanel'
import { threatShare } from '../../data/mockData'
import type { ChartProps } from '../chartOptions'
import { DonutBase } from './DonutBase'

export function DonutCentreKpi({ cardIndex, size = 'card' }: ChartProps) {
  const { global } = useControls()
  const { slices, unit } = threatShare(global.density)

  return (
    <DonutBase
      cardIndex={cardIndex}
      size={size}
      slices={slices}
      unit={unit}
      datasetLabel="Threats blocked"
      role="categorical"
      centreLabel="Threats blocked"
    />
  )
}
