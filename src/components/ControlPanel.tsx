import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ComponentType,
  type ReactNode,
  type SVGProps,
} from 'react'
import { DENSITIES, type Density } from '../data/mockData'
import { useTheme } from '../theme/useThemeTokens'
import { BarIcon, DonutIcon, LineIcon } from './icons'

export type ChartTabId = 'donut' | 'bar' | 'line'
export type TabId = ChartTabId | 'foundations'

export const TAB_TITLES: Record<TabId, string> = {
  donut: 'Donut',
  bar: 'Bar',
  line: 'Line',
  foundations: 'Foundations',
}

export type Gridlines = 'off' | 'horizontal' | 'both'
export type LegendSlot = 'off' | 'top' | 'right' | 'bottom'
export type SegmentOrder = 'value-desc' | 'fixed'
export type DonutLabels = 'off' | 'inside' | 'outside'
export type BarLayout = 'stacked' | 'grouped'
export type LineCurve = 'straight' | 'smooth'
export type PointVisibility = 'off' | 'hover' | 'always'

/** Applies on every tab. */
export interface GlobalControls {
  gridlines: Gridlines
  axisLabels: boolean
  legend: LegendSlot
  density: Density
  replayToken: number
  /** Shows a large headline number above the plot on every variant that supplies one. */
  spotlight: boolean
}

export interface DonutSettings {
  cutout: number
  startAngle: number
  order: SegmentOrder
  groupTail: boolean
  topN: number
  valueLabels: DonutLabels
}

export interface BarSettings {
  cornerRadius: number
  thickness: number
  layout: BarLayout
  valueLabels: boolean
  threshold: number
}

export interface LineSettings {
  curve: LineCurve
  points: PointVisibility
  pointRadius: number
  lineWidth: number
  areaFill: boolean
  stepped: boolean
  threshold: number
  crosshair: boolean
}

/** Every individually addressable control, so a variant can say which ones it cannot honour. */
export type ControlKey =
  | keyof DonutSettings
  | keyof BarSettings
  | keyof LineSettings

/** Control key → the reason it is unavailable for a given variant. */
export type Unsupported = Partial<Record<ControlKey, string>>

const INITIAL_GLOBAL: GlobalControls = {
  gridlines: 'horizontal',
  axisLabels: true,
  legend: 'right',
  density: 30,
  replayToken: 0,
  spotlight: false,
}

const INITIAL_DONUT: DonutSettings = {
  cutout: 72,
  startAngle: 0,
  order: 'fixed',
  groupTail: true,
  topN: 4,
  valueLabels: 'off',
}

const INITIAL_BAR: BarSettings = {
  cornerRadius: 2,
  thickness: 10,
  layout: 'grouped',
  valueLabels: false,
  threshold: 85,
}

const INITIAL_LINE: LineSettings = {
  curve: 'smooth',
  points: 'hover',
  pointRadius: 3,
  lineWidth: 2,
  areaFill: false,
  stepped: false,
  threshold: 85,
  crosshair: true,
}

interface ControlsContextValue {
  global: GlobalControls
  donut: DonutSettings
  bar: BarSettings
  line: LineSettings
  setGlobal: <K extends keyof GlobalControls>(key: K, value: GlobalControls[K]) => void
  setDonut: <K extends keyof DonutSettings>(key: K, value: DonutSettings[K]) => void
  setBar: <K extends keyof BarSettings>(key: K, value: BarSettings[K]) => void
  setLine: <K extends keyof LineSettings>(key: K, value: LineSettings[K]) => void
  replay: () => void
}

const ControlsContext = createContext<ControlsContextValue | null>(null)

/** Per-tab state is held separately, so switching away and back keeps each tab's settings. */
export function ControlsProvider({ children }: { children: ReactNode }) {
  const [global, setGlobalState] = useState(INITIAL_GLOBAL)
  const [donut, setDonutState] = useState(INITIAL_DONUT)
  const [bar, setBarState] = useState(INITIAL_BAR)
  const [line, setLineState] = useState(INITIAL_LINE)

  const setGlobal = useCallback<ControlsContextValue['setGlobal']>((key, value) => {
    setGlobalState((prev) => (prev[key] === value ? prev : { ...prev, [key]: value }))
  }, [])
  const setDonut = useCallback<ControlsContextValue['setDonut']>((key, value) => {
    setDonutState((prev) => (prev[key] === value ? prev : { ...prev, [key]: value }))
  }, [])
  const setBar = useCallback<ControlsContextValue['setBar']>((key, value) => {
    setBarState((prev) => (prev[key] === value ? prev : { ...prev, [key]: value }))
  }, [])
  const setLine = useCallback<ControlsContextValue['setLine']>((key, value) => {
    setLineState((prev) => (prev[key] === value ? prev : { ...prev, [key]: value }))
  }, [])

  const replay = useCallback(() => {
    setGlobalState((prev) => ({ ...prev, replayToken: prev.replayToken + 1 }))
  }, [])

  const value = useMemo(
    () => ({ global, donut, bar, line, setGlobal, setDonut, setBar, setLine, replay }),
    [global, donut, bar, line, setGlobal, setDonut, setBar, setLine, replay],
  )
  return <ControlsContext.Provider value={value}>{children}</ControlsContext.Provider>
}

export function useControls(): ControlsContextValue {
  const ctx = useContext(ControlsContext)
  if (!ctx) throw new Error('ControlsProvider is missing')
  return ctx
}

// ---------------------------------------------------------------------------- primitives

function Row({
  label,
  reason,
  children,
}: {
  label: string
  /** Present when no visible variant can honour this control. */
  reason?: string
  children: ReactNode
}) {
  const id = `control-${label.replace(/\W+/g, '-').toLowerCase()}`
  return (
    <div className={`flex flex-col gap-1.5 ${reason ? 'opacity-45' : ''}`} title={reason}>
      <span id={id} className="text-meta font-medium text-muted">
        {label}
      </span>
      <div role="group" aria-labelledby={id} aria-disabled={reason ? true : undefined}>
        {children}
      </div>
      {reason && <span className="text-meta text-muted">{reason}</span>}
    </div>
  )
}

interface SegmentedProps<T extends string | number | boolean> {
  value: T
  options: { label: string; value: T }[]
  onChange: (value: T) => void
  disabled?: boolean
}

function Segmented<T extends string | number | boolean>({
  value,
  options,
  onChange,
  disabled,
}: SegmentedProps<T>) {
  return (
    <div className="flex rounded-md border border-line bg-page p-0.5">
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={String(option.value)}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className={`flex-1 rounded-[5px] px-1.5 py-1 text-meta transition-colors duration-150 ease-out disabled:cursor-not-allowed ${
              active
                ? 'bg-surface font-medium text-strong shadow-sm'
                : 'text-muted hover:text-strong'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

function Slider({
  value,
  min,
  max,
  step = 1,
  suffix,
  onChange,
  disabled,
}: {
  value: number
  min: number
  max: number
  step?: number
  suffix: string
  onChange: (value: number) => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-center gap-2.5">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-line disabled:cursor-not-allowed"
      />
      <span className="w-12 shrink-0 text-right text-meta tabular-nums text-muted">
        {value}
        {suffix}
      </span>
    </div>
  )
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string
  /** Same glyph used for this chart family's tab, so the settings rail echoes the tab bar. */
  icon?: ComponentType<SVGProps<SVGSVGElement>>
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-3.5">
      <h3 className="flex items-center gap-1.5 text-meta font-semibold uppercase tracking-wider text-muted opacity-70">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {title}
      </h3>
      {children}
    </section>
  )
}

/** Keyed the same way as the tab bar, so a chart family's icon is identical in both places. */
const CHART_TAB_ICONS: Record<ChartTabId, ComponentType<SVGProps<SVGSVGElement>>> = {
  donut: DonutIcon,
  bar: BarIcon,
  line: LineIcon,
}

const ON_OFF = [
  { label: 'On', value: true },
  { label: 'Off', value: false },
]

// ---------------------------------------------------------------------------- sections

function GlobalSection() {
  const { global, setGlobal, replay } = useControls()
  const { theme, setTheme } = useTheme()

  return (
    <Section title="Global">
      <Row label="Theme">
        <Segmented
          value={theme}
          onChange={setTheme}
          options={[
            { label: 'Light', value: 'light' as const },
            { label: 'Dark', value: 'dark' as const },
          ]}
        />
      </Row>
      <Row label="Gridlines">
        <Segmented
          value={global.gridlines}
          onChange={(v) => setGlobal('gridlines', v)}
          options={[
            { label: 'Off', value: 'off' as const },
            { label: 'Horizontal', value: 'horizontal' as const },
            { label: 'Both', value: 'both' as const },
          ]}
        />
      </Row>
      <Row label="Axis labels">
        <Segmented value={global.axisLabels} onChange={(v) => setGlobal('axisLabels', v)} options={ON_OFF} />
      </Row>
      <Row label="Legend">
        <Segmented
          value={global.legend}
          onChange={(v) => setGlobal('legend', v)}
          options={[
            { label: 'Off', value: 'off' as const },
            { label: 'Top', value: 'top' as const },
            { label: 'Right', value: 'right' as const },
            { label: 'Bottom', value: 'bottom' as const },
          ]}
        />
      </Row>
      <Row label="Data density">
        <Segmented
          value={global.density}
          onChange={(v) => setGlobal('density', v)}
          options={DENSITIES.map((d) => ({ label: `${d}d`, value: d }))}
        />
      </Row>
      <Row label="Spotlight number">
        <Segmented value={global.spotlight} onChange={(v) => setGlobal('spotlight', v)} options={ON_OFF} />
      </Row>
      <button
        type="button"
        onClick={replay}
        className="rounded-md border border-line bg-page px-3 py-2 text-label font-medium text-strong transition-colors duration-150 ease-out hover:bg-surface"
      >
        Replay animation
      </button>
    </Section>
  )
}

function DonutSection({ unsupported = {} }: { unsupported?: Unsupported }) {
  const { donut, setDonut } = useControls()
  return (
    <>
      <Row label="Cutout" reason={unsupported.cutout}>
        <Slider
          value={donut.cutout}
          min={50}
          max={85}
          suffix="%"
          disabled={Boolean(unsupported.cutout)}
          onChange={(v) => setDonut('cutout', v)}
        />
      </Row>
      <Row label="Start angle" reason={unsupported.startAngle}>
        <Slider
          value={donut.startAngle}
          min={0}
          max={360}
          step={15}
          suffix="°"
          disabled={Boolean(unsupported.startAngle)}
          onChange={(v) => setDonut('startAngle', v)}
        />
      </Row>
      <Row label="Segment order" reason={unsupported.order}>
        <Segmented
          value={donut.order}
          disabled={Boolean(unsupported.order)}
          onChange={(v) => setDonut('order', v)}
          options={[
            { label: 'Value desc', value: 'value-desc' as const },
            { label: 'Fixed', value: 'fixed' as const },
          ]}
        />
      </Row>
      <Row label="Group tail into Other" reason={unsupported.groupTail}>
        <Segmented
          value={donut.groupTail}
          disabled={Boolean(unsupported.groupTail)}
          onChange={(v) => setDonut('groupTail', v)}
          options={ON_OFF}
        />
      </Row>
      <Row label="Keep top N" reason={unsupported.topN ?? unsupported.groupTail}>
        <Slider
          value={donut.topN}
          min={3}
          max={6}
          suffix=""
          disabled={Boolean(unsupported.topN ?? unsupported.groupTail) || !donut.groupTail}
          onChange={(v) => setDonut('topN', v)}
        />
      </Row>
      <Row label="Value labels" reason={unsupported.valueLabels}>
        <Segmented
          value={donut.valueLabels}
          disabled={Boolean(unsupported.valueLabels)}
          onChange={(v) => setDonut('valueLabels', v)}
          options={[
            { label: 'Off', value: 'off' as const },
            { label: 'Inside', value: 'inside' as const },
            { label: 'Outside', value: 'outside' as const },
          ]}
        />
      </Row>
    </>
  )
}

function BarSection({ unsupported = {} }: { unsupported?: Unsupported }) {
  const { bar, setBar } = useControls()
  return (
    <>
      <Row label="Corner radius" reason={unsupported.cornerRadius}>
        <Slider
          value={bar.cornerRadius}
          min={0}
          max={12}
          suffix="px"
          disabled={Boolean(unsupported.cornerRadius)}
          onChange={(v) => setBar('cornerRadius', v)}
        />
      </Row>
      <Row label="Bar thickness" reason={unsupported.thickness}>
        <Slider
          value={bar.thickness}
          min={4}
          max={32}
          suffix="px"
          disabled={Boolean(unsupported.thickness)}
          onChange={(v) => setBar('thickness', v)}
        />
      </Row>
      <Row label="Series layout" reason={unsupported.layout}>
        <Segmented
          value={bar.layout}
          disabled={Boolean(unsupported.layout)}
          onChange={(v) => setBar('layout', v)}
          options={[
            { label: 'Stacked', value: 'stacked' as const },
            { label: 'Grouped', value: 'grouped' as const },
          ]}
        />
      </Row>
      <Row label="Value labels" reason={unsupported.valueLabels}>
        <Segmented
          value={bar.valueLabels}
          disabled={Boolean(unsupported.valueLabels)}
          onChange={(v) => setBar('valueLabels', v)}
          options={ON_OFF}
        />
      </Row>
      <Row label="Capacity threshold" reason={unsupported.threshold}>
        <Slider
          value={bar.threshold}
          min={0}
          max={100}
          suffix="%"
          disabled={Boolean(unsupported.threshold)}
          onChange={(v) => setBar('threshold', v)}
        />
      </Row>
    </>
  )
}

function LineSection({ unsupported = {} }: { unsupported?: Unsupported }) {
  const { line, setLine } = useControls()
  return (
    <>
      <Row label="Curve" reason={unsupported.curve}>
        <Segmented
          value={line.curve}
          disabled={Boolean(unsupported.curve)}
          onChange={(v) => setLine('curve', v)}
          options={[
            { label: 'Straight', value: 'straight' as const },
            { label: 'Smooth', value: 'smooth' as const },
          ]}
        />
      </Row>
      <Row label="Data points" reason={unsupported.points}>
        <Segmented
          value={line.points}
          disabled={Boolean(unsupported.points)}
          onChange={(v) => setLine('points', v)}
          options={[
            { label: 'Off', value: 'off' as const },
            { label: 'On hover', value: 'hover' as const },
            { label: 'Always', value: 'always' as const },
          ]}
        />
      </Row>
      <Row label="Point radius" reason={unsupported.pointRadius ?? unsupported.points}>
        <Slider
          value={line.pointRadius}
          min={2}
          max={6}
          suffix="px"
          disabled={Boolean(unsupported.pointRadius ?? unsupported.points) || line.points === 'off'}
          onChange={(v) => setLine('pointRadius', v)}
        />
      </Row>
      <Row label="Line width" reason={unsupported.lineWidth}>
        <Slider
          value={line.lineWidth}
          min={1}
          max={4}
          suffix="px"
          disabled={Boolean(unsupported.lineWidth)}
          onChange={(v) => setLine('lineWidth', v)}
        />
      </Row>
      <Row label="Area fill" reason={unsupported.areaFill}>
        <Segmented
          value={line.areaFill}
          disabled={Boolean(unsupported.areaFill)}
          onChange={(v) => setLine('areaFill', v)}
          options={ON_OFF}
        />
      </Row>
      <Row label="Stepped" reason={unsupported.stepped}>
        <Segmented
          value={line.stepped}
          disabled={Boolean(unsupported.stepped)}
          onChange={(v) => setLine('stepped', v)}
          options={ON_OFF}
        />
      </Row>
      <Row label="Capacity threshold" reason={unsupported.threshold}>
        <Slider
          value={line.threshold}
          min={0}
          max={100}
          suffix="%"
          disabled={Boolean(unsupported.threshold)}
          onChange={(v) => setLine('threshold', v)}
        />
      </Row>
      <Row label="Crosshair" reason={unsupported.crosshair}>
        <Segmented
          value={line.crosshair}
          disabled={Boolean(unsupported.crosshair)}
          onChange={(v) => setLine('crosshair', v)}
          options={ON_OFF}
        />
      </Row>
    </>
  )
}

/**
 * The settings that belong to one chart family. Rendered in the rail for the active tab and,
 * scoped to a single variant, inside the fullscreen inspector.
 */
export function TabSettings({
  tab,
  unsupported,
  bare = false,
}: {
  tab: ChartTabId
  unsupported?: Unsupported
  bare?: boolean
}) {
  const body =
    tab === 'donut' ? (
      <DonutSection unsupported={unsupported} />
    ) : tab === 'bar' ? (
      <BarSection unsupported={unsupported} />
    ) : (
      <LineSection unsupported={unsupported} />
    )

  if (bare) return <div className="flex flex-col gap-3.5">{body}</div>
  return (
    <Section title={`${TAB_TITLES[tab]} settings`} icon={CHART_TAB_ICONS[tab]}>
      {body}
    </Section>
  )
}

function PanelBody({ tab }: { tab: TabId }) {
  return (
    <div className="flex flex-col gap-6 p-5">
      <GlobalSection />
      {/* Foundations has no chart settings, so nothing is rendered rather than an empty box. */}
      {tab !== 'foundations' && (
        <div key={tab} className="section-fade border-t border-line pt-5">
          <TabSettings tab={tab} />
        </div>
      )}
    </div>
  )
}

export function ControlPanel({ tab }: { tab: TabId }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <aside
        aria-label="Chart controls"
        className="themed fixed right-0 top-0 z-30 hidden h-full w-[292px] overflow-y-auto border-l border-line bg-surface xl:block"
      >
        <PanelBody tab={tab} />
      </aside>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="themed fixed bottom-5 right-5 z-30 rounded-full border border-line bg-surface px-4 py-3 text-label font-medium text-strong shadow-lg xl:hidden"
      >
        Controls
      </button>

      {open && (
        <div className="fixed inset-0 z-40 xl:hidden">
          <button
            type="button"
            aria-label="Close controls"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-scrim"
          />
          <div className="themed absolute right-0 top-0 h-full w-[292px] max-w-[85vw] overflow-y-auto border-l border-line bg-surface">
            <div className="flex items-center justify-between px-5 pt-5">
              <span className="text-label font-semibold text-strong">Controls</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-1 text-meta text-muted hover:text-strong"
              >
                Close
              </button>
            </div>
            <PanelBody tab={tab} />
          </div>
        </div>
      )}
    </>
  )
}
