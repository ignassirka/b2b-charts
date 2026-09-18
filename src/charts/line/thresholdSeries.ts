import { useMemo } from 'react'
import type { Chart, ScriptableLineSegmentContext } from 'chart.js'
import { useControls } from '../../components/ControlPanel'
import { gatewayLoad } from '../../data/mockData'
import { useThemeTokens } from '../../theme/useThemeTokens'
import { signalColor } from '../chartOptions'
import type { LineSeriesSpec } from './LineBase'

/**
 * One gateway-load series, shared by the full threshold chart and the sparkline so the two
 * always agree about where the breach starts.
 */
export function useGatewayLoadSeries() {
  const { global, line } = useControls()
  const tokens = useThemeTokens()

  const set = gatewayLoad(global.density)
  const values = set.series[0].values
  const threshold = line.threshold
  const breaching = values[values.length - 1] >= threshold

  const series = useMemo<LineSeriesSpec[]>(() => {
    const hot = signalColor('bad', tokens)
    const cold = signalColor('neutral', tokens)

    /**
     * Single dataset, two colours. Where a segment straddles the threshold the colour swaps
     * at the crossing point via a two-stop gradient sharing one offset — a hard mid-segment edge.
     */
    const segment = (raw: ScriptableLineSegmentContext) => {
      // The segment context inherits from the chart context at runtime; the type omits it.
      const ctx = raw as ScriptableLineSegmentContext & { chart: Chart }
      const from = values[ctx.p0DataIndex]
      const to = values[ctx.p1DataIndex]
      const fromAbove = from >= threshold
      if (fromAbove === to >= threshold) return fromAbove ? hot : cold

      // Mid-draw the incoming point has no pixel position yet; fall back to a flat colour.
      const positioned = [ctx.p0.x, ctx.p0.y, ctx.p1.x, ctx.p1.y].every(Number.isFinite)
      if (!positioned) return fromAbove ? hot : cold

      const crossing = Math.max(0, Math.min(1, (threshold - from) / (to - from)))
      const gradient = ctx.chart.ctx.createLinearGradient(ctx.p0.x, ctx.p0.y, ctx.p1.x, ctx.p1.y)
      gradient.addColorStop(crossing, fromAbove ? hot : cold)
      gradient.addColorStop(crossing, fromAbove ? cold : hot)
      return gradient
    }

    return [{ label: set.series[0].label, values, tone: () => cold, segment }]
  }, [values, threshold, tokens, set.series])

  return {
    labels: set.labels,
    tickLabels: set.tickLabels,
    series,
    unit: set.unit,
    axisMax: set.axisMax,
    stepSize: set.stepSize,
    threshold,
    endDotColor: signalColor(breaching ? 'bad' : 'good', tokens),
  }
}
