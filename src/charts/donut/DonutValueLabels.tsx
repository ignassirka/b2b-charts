import { useControls } from '../../components/ControlPanel'
import { seatUtilisation, type Slice } from '../../data/mockData'
import type { ChartProps, SignalLevel } from '../chartOptions'
import { DonutBase } from './DonutBase'

/** Idle and unassigned seats are money on the floor, so the colour has to judge them. */
function seatLevel(slice: Slice): SignalLevel {
  if (slice.label === 'In use') return 'good'
  if (slice.label === 'Idle 30d+') return 'warning'
  return 'neutral'
}

export function DonutValueLabels({ cardIndex, size = 'card' }: ChartProps) {
  const { global } = useControls()
  const { slices, unit } = seatUtilisation(global.density)
  // The number that matters here is what's actually working for its money, not the total pool.
  const inUse = slices.find((slice) => slice.label === 'In use')?.value ?? 0

  return (
    <DonutBase
      cardIndex={cardIndex}
      size={size}
      slices={slices}
      unit={unit}
      datasetLabel="Licence seats"
      role="signal"
      levelAt={seatLevel}
      forceLabels="outside"
      allowGrouping={false}
      spotlightValue={inUse}
      spotlightLabel="seats in use right now"
    />
  )
}
