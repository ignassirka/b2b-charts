import { useMemo } from 'react'
import { BarThreshold } from '../charts/bar/BarThreshold'
import { DonutBasic } from '../charts/donut/DonutBasic'
import { LineThresholdSwitch } from '../charts/line/LineThresholdSwitch'
import { cardStyle, cardTitleStyle } from '../theme/chrome'
import {
  CONTRACT_KNOB_COUNT,
  DIRECTIONS,
  DIRECTION_IDS,
  MAX_SHARED_RATIO,
  directionDivergence,
  type ChartDirection,
  type DirectionId,
} from '../theme/directions'
import { DirectionScope, useDirection } from '../theme/useDirection'
import { useThemeTokens } from '../theme/useThemeTokens'

/** The contract, flattened for display. Mirrors the grouping used by the divergence check. */
const GROUPS = ['card', 'frame', 'type', 'labelling', 'series', 'emphasis', 'motion', 'tooltip'] as const

function contractRows(direction: ChartDirection) {
  return GROUPS.flatMap((group) => {
    const values = direction[group] as unknown as Record<string, unknown>
    return Object.entries(values).map(([key, value]) => ({
      group,
      key,
      value: typeof value === 'number' ? String(value) : String(value),
    }))
  })
}

/** One donut, one bar and one line in the direction, with the direction's own card chrome. */
function Miniatures() {
  const direction = useDirection()
  const tokens = useThemeTokens()
  const charts = [
    { label: 'Donut', node: <DonutBasic cardIndex={0} size="card" /> },
    { label: 'Bar', node: <BarThreshold cardIndex={0} size="card" /> },
    { label: 'Line', node: <LineThresholdSwitch cardIndex={0} size="card" /> },
  ]

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
      {charts.map((chart) => (
        <div key={chart.label} className="flex flex-col" style={cardStyle(direction, tokens)}>
          <span className="text-meta text-muted" style={{ marginBottom: 6 }}>
            {chart.label}
          </span>
          {chart.node}
        </div>
      ))}
    </div>
  )
}

function ContractTable({ direction }: { direction: ChartDirection }) {
  const rows = useMemo(() => contractRows(direction), [direction])
  return (
    <details className="text-meta">
      <summary className="cursor-pointer text-muted">
        Contract values ({rows.length} knobs)
      </summary>
      <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 lg:grid-cols-3">
        {rows.map((row) => (
          <div key={`${row.group}.${row.key}`} className="flex justify-between gap-2">
            <span className="truncate text-muted">
              {row.group}.{row.key}
            </span>
            <span className="shrink-0 font-medium tabular-nums text-strong">{row.value}</span>
          </div>
        ))}
      </div>
    </details>
  )
}

/** The 40%-divergence proof, printed as a matrix rather than asserted in prose. */
function DiffMatrix() {
  const tokens = useThemeTokens()
  const pairs = useMemo(() => directionDivergence(), [])
  const lookup = new Map(pairs.map((pair) => [`${pair.a}|${pair.b}`, pair]))
  const ratioFor = (a: DirectionId, b: DirectionId) =>
    lookup.get(`${a}|${b}`)?.ratio ?? lookup.get(`${b}|${a}`)?.ratio ?? null
  const worst = Math.max(...pairs.map((pair) => pair.ratio))

  return (
    <div className="flex flex-col gap-3">
      <p className="text-meta text-muted">
        Share of the {CONTRACT_KNOB_COUNT} contract knobs on which each pair of directions holds
        the same value. The ceiling is {Math.round(MAX_SHARED_RATIO * 100)}%; the worst pair here
        is {Math.round(worst * 100)}%.
      </p>
      <div className="overflow-x-auto">
        <table className="border-collapse text-meta tabular-nums">
          <thead>
            <tr>
              <th className="p-1.5 text-left font-medium text-muted">vs</th>
              {DIRECTION_IDS.map((id) => (
                <th key={id} className="p-1.5 text-right font-medium text-muted">
                  {DIRECTIONS[id].name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DIRECTION_IDS.map((row) => (
              <tr key={row} className="border-t border-line">
                <td className="p-1.5 font-medium text-strong">{DIRECTIONS[row].name}</td>
                {DIRECTION_IDS.map((col) => {
                  const ratio = row === col ? null : ratioFor(row, col)
                  return (
                    <td
                      key={col}
                      className="p-1.5 text-right"
                      style={{
                        color:
                          ratio === null
                            ? tokens.textMuted
                            : ratio > MAX_SHARED_RATIO
                              ? tokens.signal.bad
                              : tokens.textStrong,
                      }}
                    >
                      {ratio === null ? '—' : `${Math.round(ratio * 100)}%`}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/** Foundations' Directions section: intent, miniatures and the full contract, per direction. */
export function DirectionsFoundation() {
  const tokens = useThemeTokens()
  const active = useDirection()

  return (
    <>
      <section className="themed flex flex-col gap-3 rounded-card border border-line bg-surface p-5">
        <h3 className="text-title font-semibold text-strong">Directions</h3>
        <p className="text-meta text-muted">
          Five design languages plus the shipped baseline, switchable from the rail. Each is a
          complete style contract — {CONTRACT_KNOB_COUNT} required knobs covering card chrome,
          chart frame, type, labelling, series rendering, emphasis, motion and tooltip. No
          direction introduces a hue: every colour still comes from the tokens above, and a
          direction may only vary alpha, gradients between the two tones of one pair, patterns
          built from one token, and which token an element draws from.
        </p>
        <p className="text-meta text-muted opacity-70">
          Currently showing: <span className="font-medium text-strong">{active.name}</span>
        </p>
      </section>

      <section className="themed flex flex-col gap-4 rounded-card border border-line bg-surface p-5">
        <div className="flex flex-col gap-1">
          <h3 className="text-title font-semibold text-strong">Divergence matrix</h3>
          <p className="text-meta text-muted">
            Proof that no two directions have collapsed into each other.
          </p>
        </div>
        <DiffMatrix />
      </section>

      {DIRECTION_IDS.map((id) => {
        const direction = DIRECTIONS[id]
        return (
          <section
            key={id}
            className="themed flex flex-col gap-4 rounded-card border border-line bg-surface p-5"
          >
            <div className="flex flex-col gap-1">
              <h3 className="flex items-baseline gap-2">
                <span className="text-title font-semibold text-strong">{direction.name}</span>
                <span className="text-meta text-muted">{id}</span>
              </h3>
              <p className="text-meta text-muted">{direction.intent}</p>
              <p className="text-meta text-muted opacity-80">{direction.suits}</p>
            </div>
            {/* The miniatures render under this direction regardless of the active one. */}
            <DirectionScope id={id}>
              <Miniatures />
            </DirectionScope>
            <ContractTable direction={direction} />
            <span className="text-meta text-muted opacity-60" style={cardTitleStyle(direction, tokens)}>
              {direction.name} — title type specimen
            </span>
          </section>
        )
      })}
    </>
  )
}
