import { useControls } from '../../components/ControlPanel'
import { devicesByPlatform } from '../../data/mockData'
import type { ChartProps } from '../chartOptions'
import { DonutBase } from './DonutBase'

export function DonutThinRing({ cardIndex, size = 'card' }: ChartProps) {
  const { global } = useControls()
  const { slices, unit } = devicesByPlatform(global.density)

  return (
    <DonutBase
      cardIndex={cardIndex}
      size={size}
      slices={slices}
      unit={unit}
      datasetLabel="Enrolled devices"
      role="categorical"
    />
  )
}
