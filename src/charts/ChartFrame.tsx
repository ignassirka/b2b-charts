import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react'
import type { ActiveElement, Chart, ChartEvent } from 'chart.js'
import { formatNumber } from './chartOptions'

export interface HoverItem {
  color: string
  label: string
  value: string
}

export interface HoverState {
  /** Index of the hovered category. */
  index: number
  /** Nearest dataset — the one that thickens while the others dim. */
  datasetIndex: number
  x: number
  y: number
  title: string | null
  items: HoverItem[]
}

export type HoverKind = 'slice' | 'point'

interface HoverConfig {
  /** 'slice' labels each item by category, 'point' titles by category and labels by series. */
  kind: HoverKind
  /** Undimmed colour for the swatch — asked of the chart so dimming never leaks into the tooltip. */
  resolveColor: (datasetIndex: number, index: number) => string
  format?: (value: number) => string
}

export function useChartHover({ kind, resolveColor, format = formatNumber }: HoverConfig) {
  const [hover, setHover] = useState<HoverState | null>(null)
  const chartRef = useRef<Chart | null>(null)

  const clear = useCallback(() => setHover((prev) => (prev ? null : prev)), [])

  /**
   * Chart.js only calls `onHover` while the pointer is inside the chart area, so leaving it
   * for the axis strip, the legend or the page would otherwise strand the tooltip.
   */
  const frameHandlers = useMemo(
    () => ({
      onMouseLeave: clear,
      onMouseMove: (event: ReactMouseEvent<HTMLDivElement>) => {
        const chart = chartRef.current
        if (!chart) return
        const rect = chart.canvas.getBoundingClientRect()
        const x = event.clientX - rect.left
        const y = event.clientY - rect.top
        const area = chart.chartArea
        if (x < area.left || x > area.right || y < area.top || y > area.bottom) clear()
      },
    }),
    [clear],
  )

  const onHover = useCallback(
    (event: ChartEvent, elements: ActiveElement[], chart: Chart) => {
      chartRef.current = chart
      if (!elements.length) {
        setHover((prev) => (prev ? null : prev))
        return
      }

      const labels = (chart.data.labels ?? []) as string[]
      const native = event.native
      const nearest = native
        ? chart.getElementsAtEventForMode(native, 'nearest', { intersect: false }, false)[0]
        : undefined
      const anchor = nearest ?? elements[0]

      const items = elements.map(({ datasetIndex, index }) => {
        const dataset = chart.data.datasets[datasetIndex]
        const raw = dataset.data[index]
        return {
          color: resolveColor(datasetIndex, index),
          label: kind === 'slice' ? (labels[index] ?? '') : (dataset.label ?? ''),
          value: format(Number(raw)),
        }
      })

      const next: HoverState = {
        index: elements[0].index,
        datasetIndex: anchor.datasetIndex,
        x: anchor.element.x,
        y: anchor.element.y,
        title: kind === 'point' ? (labels[elements[0].index] ?? null) : null,
        items,
      }

      setHover((prev) =>
        prev && prev.index === next.index && prev.datasetIndex === next.datasetIndex ? prev : next,
      )
    },
    [kind, resolveColor, format],
  )

  return { hover, onHover, frameHandlers }
}

export type FrameHandlers = ReturnType<typeof useChartHover>['frameHandlers']

function Tooltip({ hover }: { hover: HoverState }) {
  return (
    <div className="pointer-events-none rounded-lg border border-line bg-surface-raised px-2.5 py-2 shadow-lg">
      {hover.title && (
        <div className="mb-1.5 text-meta font-medium text-strong">{hover.title}</div>
      )}
      <div className="flex flex-col gap-1">
        {hover.items.map((item, i) => (
          <div key={`${item.label}-${i}`} className="flex items-center gap-2 whitespace-nowrap">
            <span
              className="h-3 w-3 shrink-0 rounded-swatch"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-meta text-muted">{item.label}</span>
            <span className="ml-auto pl-3 text-meta font-medium tabular-nums text-strong">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

interface ChartFrameProps {
  hover: HoverState | null
  handlers: FrameHandlers
  /** `'fill'` lets the fullscreen inspector hand the chart whatever room is left. */
  height?: number | 'fill'
  children: ReactNode
}

/**
 * Positioned wrapper for a canvas plus its tooltip. The tooltip is clamped to the frame so it
 * can never spill past the card edge.
 */
export function ChartFrame({ hover, handlers, height = 208, children }: ChartFrameProps) {
  const frameRef = useRef<HTMLDivElement>(null)
  const tipRef = useRef<HTMLDivElement>(null)
  const [offset, setOffset] = useState({ left: 0, top: 0 })

  useLayoutEffect(() => {
    if (!hover || !frameRef.current || !tipRef.current) return
    const frame = frameRef.current.getBoundingClientRect()
    const tip = tipRef.current.getBoundingClientRect()
    const clamp = (value: number, limit: number) => Math.max(8, Math.min(value, Math.max(8, limit)))
    setOffset({
      left: clamp(hover.x - tip.width / 2, frame.width - tip.width - 8),
      top: clamp(hover.y - tip.height - 12, frame.height - tip.height - 8),
    })
  }, [hover])

  return (
    <div
      ref={frameRef}
      className="relative w-full"
      style={{ height: height === 'fill' ? '100%' : height }}
      {...handlers}
    >
      {children}
      {hover && (
        <div
          ref={tipRef}
          className="card-enter pointer-events-none absolute z-10 duration-150"
          style={{ left: offset.left, top: offset.top }}
        >
          <Tooltip hover={hover} />
        </div>
      )}
    </div>
  )
}
