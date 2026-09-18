import { useControls } from '../../components/ControlPanel'
import { threatShare } from '../../data/mockData'
import type { ChartProps } from '../chartOptions'
import { DonutBase } from './DonutBase'

export function DonutBasic({ cardIndex, size = 'card' }: ChartProps) {
  const { global } = useControls()
  const { slices, unit } = threatShare(global.density)
  const total = slices.reduce((sum, slice) => sum + slice.value, 0)

  return (
    <DonutBase
      cardIndex={cardIndex}
      size={size}
      slices={slices}
      unit={unit}
      datasetLabel="Threats blocked"
      role="categorical"
      spotlightValue={total}
      spotlightLabel="threats blocked this window"
    />
  )
}
