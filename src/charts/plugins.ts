import type { Chart, ChartType, LineElement, Plugin } from 'chart.js'

export interface CrosshairOptions {
  enabled: boolean
  color: string
}

export interface CenterTextOptions {
  enabled: boolean
  value: string
  label: string
  valueColor: string
  labelColor: string
  /** Base label size; the KPI figure is drawn at 2.4× this. */
  font: number
}

export interface ArcValueLabelOptions {
  enabled: boolean
  values: string[]
  color: string
  /** Outside sits past the ring; inside centres the label on the band itself. */
  placement: 'inside' | 'outside'
  /** Used for inside labels, which sit on top of the fill. */
  insideColor: string
  font: number
}

export interface AreaFadeOptions {
  enabled: boolean
  colorTop: string
  colorBottom: string
  /** Used until the first `setAreaAlpha` call, so the fill can start hidden on a fresh chart. */
  startAlpha: number
}

declare module 'chart.js' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface PluginOptionsByType<TType extends ChartType> {
    crosshair?: CrosshairOptions
    centerText?: CenterTextOptions
    arcValueLabels?: ArcValueLabelOptions
    edgeValueLabels?: EdgeValueLabelOptions
    barValueLabels?: BarValueLabelOptions
    areaFade?: AreaFadeOptions
  }
}

const FONT_STACK = 'Inter, system-ui, sans-serif'

/** Vertical rule at the hovered index. Drawn behind the data so it never hides a point. */
export const crosshairPlugin: Plugin = {
  id: 'crosshair',
  beforeDatasetsDraw(chart, _args, opts) {
    const options = opts as unknown as CrosshairOptions | undefined
    if (!options?.enabled) return
    const active = chart.getActiveElements()
    if (!active.length) return

    const { ctx, chartArea } = chart
    ctx.save()
    ctx.beginPath()
    ctx.lineWidth = 1
    ctx.strokeStyle = options.color
    ctx.moveTo(active[0].element.x, chartArea.top)
    ctx.lineTo(active[0].element.x, chartArea.bottom)
    ctx.stroke()
    ctx.restore()
  },
}

/** Big number + caption in the doughnut hole, centred on the ring rather than the canvas. */
export const centerTextPlugin: Plugin = {
  id: 'centerText',
  afterDatasetsDraw(chart, _args, opts) {
    const options = opts as unknown as CenterTextOptions | undefined
    if (!options?.enabled) return
    const arc = chart.getDatasetMeta(0).data[0] as { x?: number; y?: number } | undefined
    if (!arc || arc.x === undefined || arc.y === undefined) return

    const { ctx } = chart
    const value = Math.round(options.font * 2.4)
    ctx.save()
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = options.valueColor
    ctx.font = `600 ${value}px ${FONT_STACK}`
    ctx.fillText(options.value, arc.x, arc.y - value * 0.3)
    ctx.fillStyle = options.labelColor
    ctx.font = `400 ${options.font}px ${FONT_STACK}`
    ctx.fillText(options.label, arc.x, arc.y + value * 0.5)
    ctx.restore()
  },
}

/** Value labels sitting just outside the ring, anchored to each arc's mid-angle. */
export const arcValueLabelPlugin: Plugin = {
  id: 'arcValueLabels',
  afterDatasetsDraw(chart, _args, opts) {
    const options = opts as unknown as ArcValueLabelOptions | undefined
    if (!options?.enabled) return

    const inside = options.placement === 'inside'
    const { ctx } = chart
    ctx.save()
    ctx.font = `500 ${options.font}px ${FONT_STACK}`
    ctx.fillStyle = inside ? options.insideColor : options.color
    ctx.textBaseline = 'middle'

    chart.getDatasetMeta(0).data.forEach((element, index) => {
      const arc = element as unknown as {
        x: number
        y: number
        innerRadius: number
        outerRadius: number
        startAngle: number
        endAngle: number
      }
      // Too narrow a band cannot hold text without colliding with its neighbours.
      if (inside && arc.endAngle - arc.startAngle < 0.28) return

      const mid = (arc.startAngle + arc.endAngle) / 2
      const radius = inside
        ? (arc.innerRadius + arc.outerRadius) / 2
        : arc.outerRadius + options.font
      const x = arc.x + Math.cos(mid) * radius
      const y = arc.y + Math.sin(mid) * radius
      ctx.textAlign = inside ? 'center' : Math.cos(mid) >= 0 ? 'left' : 'right'
      ctx.fillText(options.values[index] ?? '', x, y)
    })
    ctx.restore()
  },
}

export interface EdgeValueLabelOptions {
  enabled: boolean
  values: string[]
  colors: string[]
  font: number
}

/**
 * Right-aligned value column for horizontal bars, one entry per row.
 * Pair with `layout.padding.right` so the column has somewhere to sit.
 */
export const edgeValueLabelPlugin: Plugin = {
  id: 'edgeValueLabels',
  afterDatasetsDraw(chart, _args, opts) {
    const options = opts as unknown as EdgeValueLabelOptions | undefined
    if (!options?.enabled) return

    const { ctx } = chart
    ctx.save()
    ctx.font = `400 ${options.font}px ${FONT_STACK}`
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'

    chart.getDatasetMeta(0).data.forEach((element, index) => {
      ctx.fillStyle = options.colors[index] ?? options.colors[0]
      ctx.fillText(options.values[index] ?? '', chart.width - 2, element.y)
    })
    ctx.restore()
  },
}

export interface BarValueLabelOptions {
  enabled: boolean
  /** Strings to draw, keyed by dataset index. Stacked charts pass only the top dataset. */
  rows: Record<number, string[]>
  color: string
  font: number
  horizontal: boolean
}

/** Values printed at the outer end of each bar, skipping any that would collide. */
export const barValueLabelPlugin: Plugin = {
  id: 'barValueLabels',
  afterDatasetsDraw(chart, _args, opts) {
    const options = opts as unknown as BarValueLabelOptions | undefined
    if (!options?.enabled) return

    const { ctx } = chart
    ctx.save()
    ctx.font = `500 ${options.font}px ${FONT_STACK}`
    ctx.fillStyle = options.color
    ctx.textAlign = options.horizontal ? 'left' : 'center'
    ctx.textBaseline = options.horizontal ? 'middle' : 'bottom'

    for (const [key, values] of Object.entries(options.rows)) {
      const meta = chart.getDatasetMeta(Number(key))
      if (meta.hidden) continue
      let occupiedUntil = -Infinity

      meta.data.forEach((element, index) => {
        const text = values[index]
        if (!text) return
        const half = ctx.measureText(text).width / 2 + options.font * 0.6
        const along = options.horizontal ? element.y : element.x
        if (along - half < occupiedUntil) return
        occupiedUntil = along + half
        ctx.fillText(
          text,
          options.horizontal ? element.x + 6 : element.x,
          options.horizontal ? element.y : element.y - 4,
        )
      })
    }
    ctx.restore()
  },
}

const areaAlpha = new WeakMap<Chart, number>()

/** Held off the options object so a React re-render mid-fade cannot reset the value. */
export function setAreaAlpha(chart: Chart, alpha: number) {
  areaAlpha.set(chart, alpha)
}

/**
 * Vertical gradient fill under a line, drawn here rather than by the Filler plugin so its
 * opacity can be ramped independently of the line's draw-on animation.
 */
export const areaFadePlugin: Plugin = {
  id: 'areaFade',
  beforeDatasetsDraw(chart, _args, opts) {
    const options = opts as unknown as AreaFadeOptions | undefined
    if (!options?.enabled) return

    const alpha = areaAlpha.get(chart) ?? options.startAlpha
    if (alpha <= 0) return

    const meta = chart.getDatasetMeta(0)
    const line = meta.dataset as LineElement | undefined
    const points = meta.data
    if (!line || points.length < 2) return

    const { ctx, chartArea } = chart
    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
    gradient.addColorStop(0, options.colorTop)
    gradient.addColorStop(1, options.colorBottom)

    ctx.save()
    ctx.globalAlpha = alpha
    ctx.beginPath()
    line.path(ctx)
    ctx.lineTo(points[points.length - 1].x, chartArea.bottom)
    ctx.lineTo(points[0].x, chartArea.bottom)
    ctx.closePath()
    ctx.fillStyle = gradient
    ctx.fill()
    ctx.restore()
  },
}

export const customPlugins = [
  crosshairPlugin,
  centerTextPlugin,
  arcValueLabelPlugin,
  edgeValueLabelPlugin,
  barValueLabelPlugin,
  areaFadePlugin,
]
