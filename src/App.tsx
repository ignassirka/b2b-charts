import { useState } from 'react'
import { BarGrouped } from './charts/bar/BarGrouped'
import { BarHorizontalPercent } from './charts/bar/BarHorizontalPercent'
import { BarSingleNeutral } from './charts/bar/BarSingleNeutral'
import { BarStacked } from './charts/bar/BarStacked'
import { BarTargetLine } from './charts/bar/BarTargetLine'
import { BarThreshold } from './charts/bar/BarThreshold'
import { DonutBasic } from './charts/donut/DonutBasic'
import { DonutSortedOther } from './charts/donut/DonutSortedOther'
import { DonutThickRing } from './charts/donut/DonutThickRing'
import { DonutThinRing } from './charts/donut/DonutThinRing'
import { DonutValueLabels } from './charts/donut/DonutValueLabels'
import { LineArea } from './charts/line/LineArea'
import { LineMultiSeries } from './charts/line/LineMultiSeries'
import { LineSingleNeutral } from './charts/line/LineSingleNeutral'
import { LineSparkline } from './charts/line/LineSparkline'
import { LineStepped } from './charts/line/LineStepped'
import { LineThresholdSwitch } from './charts/line/LineThresholdSwitch'
import { registerChartDefaults } from './charts/registerChartDefaults'
import {
  ControlPanel,
  ControlsProvider,
  useControls,
  type ChartTabId,
  type TabId,
} from './components/ControlPanel'
import { Foundations } from './components/Foundations'
import { BarIcon, DonutIcon, FoundationsIcon, LineIcon } from './components/icons'
import { Tabs, type TabDef } from './components/Tabs'
import { VariantCard, type VariantSpec } from './components/VariantCard'
import { ThemeProvider } from './theme/useThemeTokens'

registerChartDefaults()

const SINGLE_SERIES = 'Single series — nothing to stack or group.'

const VARIANTS: Record<ChartTabId, VariantSpec[]> = {
  donut: [
    {
      id: 'donut-basic',
      tab: 'donut',
      title: 'Threats blocked by category',
      caption:
        'Trackers and ads outweigh the rest by an order of magnitude. Categorical, because no threat class is better than another — hue is identity only.',
      role: 'categorical',
      Chart: DonutBasic,
    },
    {
      id: 'donut-thin',
      tab: 'donut',
      title: 'Devices by platform',
      caption:
        'Platforms are peers, so colour marks identity. A thin ring recedes when this sits beside heavier widgets.',
      role: 'categorical',
      Chart: DonutThinRing,
      unsupported: { valueLabels: 'Inside labels need a thicker ring — use outside.' },
    },
    {
      id: 'donut-thick',
      tab: 'donut',
      title: 'Tunnel traffic by protocol',
      caption:
        'Three peer protocols, so categorical. A thick ring keeps the smallest share legible without labels.',
      role: 'categorical',
      Chart: DonutThickRing,
      unsupported: {
        groupTail: 'Only three protocols — there is no tail to fold.',
        topN: 'Only three protocols — there is no tail to fold.',
      },
    },
    {
      id: 'donut-sorted',
      tab: 'donut',
      title: 'Tunnels per gateway',
      caption:
        'Gateways ranked, the tail folded into Other on palette 5. Categorical, because a busy gateway is not a bad one — capacity is judged elsewhere.',
      role: 'categorical',
      Chart: DonutSortedOther,
    },
    {
      id: 'donut-labels',
      tab: 'donut',
      title: 'Licence seat utilisation',
      caption:
        'Signal, because idle and unassigned seats are wasted spend and the colour has to say so. Values sit outside the ring.',
      role: 'signal',
      Chart: DonutValueLabels,
      unsupported: {
        valueLabels: 'This variant is the labelling study — outside labels stay on.',
        groupTail: 'Only three seat states — there is no tail to fold.',
        topN: 'Only three seat states — there is no tail to fold.',
      },
    },
  ],
  bar: [
    {
      id: 'bar-single',
      tab: 'bar',
      title: 'Failed authentications per day',
      caption:
        'Volume only. Neutral rather than signal: a raw count carries no verdict until someone sets a limit, which the next variants do.',
      role: 'categorical',
      Chart: BarSingleNeutral,
      unsupported: {
        layout: SINGLE_SERIES,
        threshold: 'A raw attempt count has no capacity limit to draw.',
      },
    },
    {
      id: 'bar-stacked',
      tab: 'bar',
      title: 'Threats blocked by category, per day',
      caption:
        'Composition and daily total in one column. Categorical, because the stack compares peer categories against each other.',
      role: 'categorical',
      Chart: BarStacked,
      unsupported: {
        layout: 'This variant is the stacking study — always stacked.',
        threshold: 'A stacked total has no single limit to compare against.',
      },
    },
    {
      id: 'bar-grouped',
      tab: 'bar',
      title: 'Throughput in / out per gateway',
      caption:
        'Ingress against egress, gateway by gateway. Categorical, because direction is identity rather than quality.',
      role: 'categorical',
      Chart: BarGrouped,
      unsupported: { threshold: 'Gateways share no single throughput ceiling.' },
    },
    {
      id: 'bar-threshold',
      tab: 'bar',
      title: 'Peak gateway CPU load',
      caption:
        'Signal, because every bar at or above the capacity threshold is a gateway about to start shedding tunnels.',
      role: 'signal',
      Chart: BarThreshold,
      unsupported: { layout: SINGLE_SERIES },
    },
    {
      id: 'bar-horizontal',
      tab: 'bar',
      title: 'Gateway utilisation by team',
      caption:
        'Signal with banded levels — past 85% a team has no headroom left on its gateway. Ranked rows with the number spelled out on the right.',
      role: 'signal',
      Chart: BarHorizontalPercent,
      unsupported: {
        layout: SINGLE_SERIES,
        threshold: 'Utilisation is judged in bands, not against one line.',
      },
    },
    {
      id: 'bar-target',
      tab: 'bar',
      title: 'Gateway uptime vs 99.9% SLA',
      caption:
        'Signal, because missing the SLA is a contractual failure. The axis starts at 99.4% — at full scale every bar looks identical.',
      role: 'signal',
      Chart: BarTargetLine,
      unsupported: {
        layout: SINGLE_SERIES,
        threshold: 'The 99.9% SLA is contractual, not a tunable.',
      },
    },
  ],
  line: [
    {
      id: 'line-single',
      tab: 'line',
      title: 'Active VPN tunnels',
      caption:
        'One trend, no verdict. Neutral colour because nothing here is yet good or bad — it is just how busy the fleet is.',
      role: 'categorical',
      Chart: LineSingleNeutral,
      unsupported: { threshold: 'Tunnel counts have no capacity line in this view.' },
    },
    {
      id: 'line-multi',
      tab: 'line',
      title: 'Tunnels by region',
      caption:
        'EU, US and APAC are peers, so colour is identity. At 7-day density their office-hours humps overlap rather than coincide.',
      role: 'categorical',
      Chart: LineMultiSeries,
      unsupported: { threshold: 'Three regional series share no single limit.' },
    },
    {
      id: 'line-area',
      tab: 'line',
      title: 'Egress throughput',
      caption:
        'A gradient implies accumulated volume. Categorical, because throughput is capacity used rather than a verdict.',
      role: 'categorical',
      Chart: LineArea,
      unsupported: {
        areaFill: 'This variant is the gradient-fill study — the fill stays on.',
        threshold: 'Throughput has no capacity line in this view.',
      },
    },
    {
      id: 'line-threshold',
      tab: 'line',
      title: 'Gateway CPU load vs capacity',
      caption:
        'One dataset recoloured mid-segment where it crosses the capacity line. Signal, because here the colour is the alarm.',
      role: 'signal',
      Chart: LineThresholdSwitch,
    },
    {
      id: 'line-sparkline',
      tab: 'line',
      title: 'Gateway CPU load, inline',
      caption:
        'The same series and threshold compressed to one row, with an end-dot reporting current state. Signal, for the same reason.',
      role: 'signal',
      Chart: LineSparkline,
    },
    {
      id: 'line-stepped',
      tab: 'line',
      title: 'Gateways online vs redundancy floor',
      caption:
        'A count holds until it changes, so steps rather than curves. Signal, because reaching the floor means no redundancy left.',
      role: 'signal',
      Chart: LineStepped,
      unsupported: {
        curve: 'Stepped lines have no curve to bend.',
        stepped: 'This variant is the stepping study — steps stay on.',
        threshold: 'Minimum redundancy is a fixed policy floor of four gateways.',
      },
    },
  ],
}

const CHART_TABS: TabDef<ChartTabId>[] = [
  { id: 'donut', label: 'Donut', icon: DonutIcon },
  { id: 'bar', label: 'Bar', icon: BarIcon },
  { id: 'line', label: 'Line', icon: LineIcon },
]

const FOUNDATIONS_TAB: TabDef<'foundations'>[] = [
  { id: 'foundations', label: 'Foundations', icon: FoundationsIcon },
]

function VariantGrid({ tab }: { tab: ChartTabId }) {
  const { global } = useControls()
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {VARIANTS[tab].map((variant, index) => (
        // Keyed on the replay token so "Replay" remounts the card and the entry animation
        // runs again. Theme changes never touch this key.
        <VariantCard
          key={`${variant.id}-${global.replayToken}`}
          variant={variant}
          index={index}
        />
      ))}
    </div>
  )
}

function Shell() {
  const [tab, setTab] = useState<TabId>('donut')

  return (
    <div className="min-h-full xl:pr-[292px]">
      <header className="themed sticky top-0 z-20 flex flex-wrap items-center gap-4 border-b border-line bg-page px-5 py-3">
        <h1 className="text-title font-semibold text-strong">Chart style exploration</h1>
        <div className="flex w-full items-center justify-between gap-4">
          <Tabs tabs={CHART_TABS} active={tab === 'foundations' ? undefined : tab} onChange={setTab} />
          <Tabs tabs={FOUNDATIONS_TAB} active={tab === 'foundations' ? tab : undefined} onChange={setTab} />
        </div>
      </header>

      <main className="p-5">
        {tab === 'foundations' ? <Foundations /> : <VariantGrid tab={tab} />}
      </main>

      <ControlPanel tab={tab} />
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <ControlsProvider>
        <Shell />
      </ControlsProvider>
    </ThemeProvider>
  )
}
