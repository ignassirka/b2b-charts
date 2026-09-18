import { useControls } from '../../components/ControlPanel'
import { devicesByPlatform } from '../../data/mockData'
import type { ChartProps } from '../chartOptions'
import { DonutBase } from './DonutBase'

export function DonutThinRing({ cardIndex, size = 'card' }: ChartProps) {
  const { global } = useControls()
  const { slices, unit } = devicesByPlatform(global.density)
  const total = slices.reduce((sum, slice) => sum + slice.value, 0)

  return (
    <DonutBase
      cardIndex={cardIndex}
      size={size}
      slices={slices}
      unit={unit}
      datasetLabel="Enrolled devices"
      role="categorical"
      spotlightValue={total}
      spotlightLabel="devices enrolled"
    />
  )
}
