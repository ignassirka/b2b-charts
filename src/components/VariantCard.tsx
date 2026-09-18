import { createContext, useCallback, useContext, useEffect, useRef, useState, type ComponentType } from 'react'
import type { Chart } from 'chart.js'
import type { ChartProps, PaletteRole } from '../charts/chartOptions'
import { formatValue } from '../charts/chartOptions'
import type { Unit } from '../data/mockData'
import { ChartModal, useChartExpand } from './ChartModal'
import { TabSettings, type ChartTabId, type Unsupported } from './ControlPanel'
import { WidgetIcon } from './icons'

// ---------------------------------------------------------------------------- variant spec

export interface VariantSpec {
  id: string
  tab: ChartTabId
  title: string
  caption: string
  /** Fixed by the scenario, never by the user. */
  role: PaletteRole
  Chart: ComponentType<ChartProps>
  /** Controls this variant cannot honour, mapped to the reason shown to the user. */
  unsupported?: Unsupported
}

// ---------------------------------------------------------------------------- chart sink

export interface ChartPublication {
  config: { type: string; data: unknown; options: unknown }
  chart: Chart | null
  unit: Unit
  zoomed: boolean
  /** Clears the persisted zoom window. Null for chart types with no axis to zoom. */
  resetZoom: (() => void) | null
}

const SinkContext = createContext<((publication: ChartPublication) => void) | null>(null)

/** Hands the live chart up to whatever is hosting it — a card, or the fullscreen inspector. */
export function usePublishChart(publication: ChartPublication) {
  const publish = useContext(SinkContext)
  useEffect(() => {
    publish?.(publication)
  }, [publish, publication])
}

// ---------------------------------------------------------------------------- inspector

interface TableShape {
  labels: string[]
  datasets: { label?: string; data: unknown[] }[]
}

function SeriesTable({ publication }: { publication: ChartPublication | null }) {
  const shape = publication?.config.data as TableShape | undefined
  if (!shape?.labels?.length) return null
  const { unit } = publication!

  return (
    <table className="w-full border-collapse text-meta tabular-nums">
      <thead className="sticky top-0 bg-page">
        <tr className="text-left text-muted">
          <th className="py-1.5 pr-2 font-medium">Point</th>
          {shape.datasets.map((dataset, i) => (
            <th key={i} className="py-1.5 pl-2 text-right font-medium">
              {dataset.label ?? `Series ${i + 1}`}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {shape.labels.map((label, row) => (
          <tr key={`${label}-${row}`} className="border-t border-line">
            <td className="py-1 pr-2 text-muted">{label}</td>
            {shape.datasets.map((dataset, i) => (
              <td key={i} className="py-1 pl-2 text-right text-strong">
                {formatValue(Number(dataset.data[row]), unit)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/** Cheap signature over everything the inspector displays, so publishing cannot loop. */
function snapshotKey(publication: ChartPublication): string {
  const shape = publication.config.data as TableShape | undefined
  const datasets = shape?.datasets ?? []
  let checksum = 0
  for (const dataset of datasets) {
    for (const value of dataset.data) checksum = (checksum + Number(value) * 31) % 1e12
  }
  return [
    publication.chart?.id ?? 'none',
    publication.zoomed,
    publication.unit.label,
    shape?.labels?.length ?? 0,
    datasets.map((d) => d.label).join('|'),
    checksum,
  ].join('/')
}

// ---------------------------------------------------------------------------- card

interface VariantCardProps {
  variant: VariantSpec
  /** Position in the grid — drives the 60ms entry stagger. */
  index: number
}

export function VariantCard({ variant, index }: VariantCardProps) {
  const { open, expand, close, triggerRef, originRect } = useChartExpand()

  // The inspector renders the data, so it needs a render — gated on a content signature.
  const modalRef = useRef<ChartPublication | null>(null)
  const [modalKey, setModalKey] = useState('')
  const publishToModal = useCallback((publication: ChartPublication) => {
    modalRef.current = publication
    const key = snapshotKey(publication)
    setModalKey((prev) => (prev === key ? prev : key))
  }, [])

  const modalPublication = modalKey ? modalRef.current : null

  const inspector = (
    <>
      <div className="flex items-center justify-between gap-2 border-b border-line p-4">
        <span className="text-label font-semibold text-strong">Inspector</span>
      </div>
      <div className="flex flex-col gap-3.5 border-b border-line p-4">
        <TabSettings tab={variant.tab} unsupported={variant.unsupported} bare />
        {modalPublication?.zoomed && (
          <button
            type="button"
            onClick={() => modalRef.current?.resetZoom?.()}
            className="rounded-md border border-line bg-surface px-3 py-2 text-meta font-medium text-strong transition-colors duration-150 ease-out hover:border-muted"
          >
            Reset zoom
          </button>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-4">
        <SeriesTable publication={modalPublication} />
      </div>
    </>
  )

  return (
    <article
      className="themed card-enter flex flex-col gap-4 rounded-card border border-line bg-surface p-5"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <header className="flex items-start gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex items-center gap-2">
            <WidgetIcon className="shrink-0" width={20} height={20} />
            <h3 className="text-title font-semibold text-strong">{variant.title}</h3>
          </div>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <button
            ref={triggerRef}
            type="button"
            onClick={expand}
            aria-label={`Expand ${variant.title}`}
            className="rounded-md border border-line px-2 py-1.5 text-meta font-medium text-muted hover:border-muted hover:text-strong"
          >
            {/* Corner arrows — the conventional "open fullscreen" glyph. */}
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" fill="none">
              <path
                d="M1 4.5V1h3.5M7.5 1H11v3.5M11 7.5V11H7.5M4.5 11H1V7.5"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </header>

      {/* Centred so a compact variant sits in the middle of a row sized by its neighbour. */}
      <div className="flex flex-1 items-center">
        <variant.Chart cardIndex={index} size="card" />
      </div>

      <ChartModal
        open={open}
        onClose={close}
        title={variant.title}
        originRect={originRect}
        chart={
          <SinkContext.Provider value={publishToModal}>
            <variant.Chart cardIndex={0} size="fullscreen" />
          </SinkContext.Provider>
        }
        inspector={inspector}
      />
    </article>
  )
}
