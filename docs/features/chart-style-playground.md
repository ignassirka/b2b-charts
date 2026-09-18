# Chart Style Playground

## Purpose

Define the visual language for charts in the B2B VPN admin product. A styling exploration, not a
product surface: no backend, no auth, no data fetching. Seventeen variants render side by side under
one set of global controls, each carrying realistic VPN telemetry so the styling is judged against
the shapes it will actually have to describe.

## Key User Flows

1. Pick a chart family from the tab bar (Donut, Bar, Line — each with a matching icon) or inspect
   the raw tokens via Foundations, set apart on the right edge of the same row. The same icon
   reappears next to that family's "[Tab] settings" heading in the rail, so the tab and its
   controls are visually paired.
2. Restyle everything visible from the right-hand rail. The rail has two sections: **Global**
   (theme, gridlines, axis labels, legend, density, replay) and **[Tab] settings**, which swaps as
   you change tabs and keeps each tab's values.
3. Drag the capacity threshold and watch the bar and line variants change where they switch colour.
4. Hover any chart for a token-styled HTML tooltip, with non-hovered elements dimmed to 40%. Every
   widget title — on the card and in the fullscreen inspector — carries the same fixed gradient
   `WidgetIcon` on its left, independent of theme or palette role. There is no subtext under any
   title; the explanatory caption from the registry is data only, not rendered.
5. Press the expand button — always visible in the card header, not just on hover — to open the
   chart fullscreen: larger type, denser ticks, markers on, x-axis zoom, a table of the underlying
   values, and the contextual controls scoped to that variant.
6. Turn on **Spotlight number** (Global section) to show one large headline figure above the plot
   on every variant — the total, latest reading, peak, or worst case, whichever best answers "what
   is this chart about" for that scenario — with a short caption underneath stating its unit. Off
   by default; applies on the card and in the fullscreen inspector alike. Hidden on the compact
   sparkline card (no room), but shown once that same variant is expanded.

## Data Model

`src/data/mockData.ts`. Deterministic: one seeded PRNG (mulberry32) with a per-series stream, never
`Math.random()` at render. Dates are anchored to Fri 24 May 2024 21:00 UTC so labels never drift.
The file header states, in the code, that the values are illustrative synthetic telemetry rather
than measurements.

### Shape assumptions

- Corporate VPN usage is weekday-driven, so every daily series dips on Saturday and Sunday.
- Sessions follow office hours: each region peaks 09:00–17:00 in its own local time, so the
  three-region stack shows overlapping humps rather than one spike.
- Gateway load and egress throughput track the connection count; threats blocked tracks traffic
  volume superlinearly; failed authentications spike independently of load.

### Density

Density is a window, and the 7-day window is sampled finely enough for the diurnal cycle to appear:
7 → last 7 days at 3-hour resolution (56 points); 30 and 90 → last 30 / 90 days, daily. Rate series
(threats blocked, failed authentications) are reported as a per-day rate at every resolution, so
their quoted ranges hold whether a point covers three hours or a day.

Every dataset carries a `Unit` (`format` + written label). Tick labels reformat per window:
weekday name at 7 days, date at 30, month at 90 — supplied as a separate sparse `tickLabels` array
so tooltips keep the full label.

| Export | Returns | Unit | Used by |
| --- | --- | --- | --- |
| `activeConnections` | `TimeSeriesSet` | tunnels | Line: single series |
| `connectionsByRegion` | EU / US / APAC | tunnels | Line: three series |
| `threatsBlocked` | total rate over time | threats/day | Axis ceilings |
| `threatsByCategory` | trackers, ads, malware, phishing, cryptominers | threats/day | Bar: stacked |
| `threatShare` | window totals per category | threats/day | Donut: basic |
| `gatewayLoad` | peak CPU load | % | Bar: threshold; Line: threshold + sparkline |
| `throughput` | egress over time | Gbps | Line: area |
| `gatewaysOnline` | integer count, floor 4 | gateways | Line: stepped |
| `failedAuthAttempts` | count with spikes | attempts/day | Bar: single series |
| `gatewayFleet` | per-gateway capacity, utilisation, uptime, throughput | mixed | Source for the four below |
| `gatewayUtilisation` | % of capacity per gateway | % | Derives `connectionsByGateway` |
| `uptimeVsSla` | uptime per gateway vs `SLA_UPTIME_PCT` | % | Bar: target line |
| `throughputByGateway` | ingress / egress per gateway | Gbps | Bar: grouped |
| `connectionsByGateway` | tunnels per gateway, ranked | tunnels | Donut: sorted with Other |
| `gatewayUtilisationByTeam` | % per team's dedicated gateway (DEV-VPN / INFRA-VPN / MRKT-VPN / FIN-VPN / OPS-VPN) | % | Bar: horizontal |
| `devicesByPlatform` | Windows / macOS / iOS / Android / Linux | devices | Donut: devices by platform |
| `trafficByProtocol` | WireGuard / OpenVPN / IKEv2 | % | Donut: tunnel traffic by protocol |
| `seatUtilisation` | in use / idle / unassigned | licences | Donut: outside labels |

Constants: `GATEWAY_CAPACITY_LOAD_PCT` (85), `SLA_UPTIME_PCT` (99.9), `REDUNDANCY_FLOOR` (4).

## Components

| Component | Path | Notes |
| --- | --- | --- |
| `App` | `src/App.tsx` | Providers, top bar, tab state, the 17-entry variant registry |
| `Tabs` | `src/components/Tabs.tsx` | Generic tablist, optional per-tab icon |
| `DonutIcon`, `BarIcon`, `LineIcon`, `FoundationsIcon`, `WidgetIcon` | `src/components/icons.tsx` | Inline SVG glyphs, no icon-library dependency; one per chart family plus Foundations; `WidgetIcon` is the fixed gradient brand mark on every widget title |
| `SpotlightStat` | `src/charts/SpotlightStat.tsx` | The large headline figure + caption rendered above the plot by all three shells when Spotlight is on |
| `drawGatewayIcon` | `src/charts/canvasIcons.ts` | Canvas-drawn (not DOM) gateway rack-unit glyph, for axis ticks where an `<svg>` isn't an option |
| `VariantCard` | `src/components/VariantCard.tsx` | Card chrome, always-visible expand button, chart sink, series table |
| `ChartModal`, `useChartExpand` | `src/components/ChartModal.tsx` | Portalled dialog, focus trap, Esc, scroll lock, grow-from-card transition |
| `ControlPanel` | `src/components/ControlPanel.tsx` | Rail ≥1280px / drawer below; owns `ControlsProvider`, `useControls` and `TabSettings` |
| `Foundations` | `src/components/Foundations.tsx` | Palette selection rule plus live swatches |
| `ChartFrame`, `useChartHover` | `src/charts/ChartFrame.tsx` | Positioned canvas wrapper, clamped HTML tooltip, hover state |
| `DonutBase` / `BarBase` / `LineBase` | `src/charts/{donut,bar,line}/` | The three shared shells; every variant is one of these plus props |
| `useGatewayLoadSeries` | `src/charts/line/thresholdSeries.ts` | One series feeding both threshold variants |

Each of the 17 variant components is 15–50 lines. All shared option building lives in
`src/charts/chartOptions.ts` and the three shells.

### Variants and palette roles

| Tab | Variant | Dataset | Role |
| --- | --- | --- | --- |
| Donut | Threats blocked by category | `threatShare` | categorical |
| Donut | Devices by platform | `devicesByPlatform` | categorical |
| Donut | Tunnel traffic by protocol | `trafficByProtocol` | categorical |
| Donut | Tunnels per gateway (sorted, Other) | `connectionsByGateway` | categorical |
| Donut | Licence seat utilisation (outside labels) | `seatUtilisation` | signal |
| Bar | Failed authentications per day | `failedAuthAttempts` | categorical |
| Bar | Threats blocked by category, per day | `threatsByCategory` | categorical |
| Bar | Throughput in / out per gateway | `throughputByGateway` | categorical |
| Bar | Peak gateway CPU load | `gatewayLoad` | signal |
| Bar | Gateway utilisation by team | `gatewayUtilisationByTeam` | signal |
| Bar | Gateway uptime vs 99.9% SLA | `uptimeVsSla` | signal |
| Line | Active VPN tunnels | `activeConnections` | categorical |
| Line | Tunnels by region | `connectionsByRegion` | categorical |
| Line | Egress throughput (area) | `throughput` | categorical |
| Line | Gateway CPU load vs capacity | `gatewayLoad` | signal |
| Line | Gateway CPU load, inline (sparkline) | `gatewayLoad` | signal |
| Line | Gateways online vs redundancy floor | `gatewaysOnline` | signal |

Both roles appear in every chart tab, so the same chart type can be compared carrying both meanings.
`role` still drives each variant's colour choice (`categoricalColor` vs `signalColor`); there is no
longer a visible "categorical"/"signal" badge, and the role is legible only from the colour
behaviour itself — `VariantSpec.caption` still holds the explanatory text in the registry, but it is
no longer rendered anywhere in the UI.

**Removed:** "Threats blocked, with total" (`DonutCentreKpi`, the donut with a KPI drawn in the
ring's centre) was dropped once Spotlight number shipped — it duplicated the same total that
Spotlight now shows above every donut, so the centre-KPI treatment had nothing left to demonstrate.
Its `centerText` Chart.js plugin and the `centreLabel` prop on `DonutBase` were removed with it.

### Spotlight values

Each variant supplies its own `spotlightValue` (a raw number) and `spotlightLabel` (a short
caption) to its shell — there is no single formula, because "the meaningful number" means something
different per scenario (a total, a latest reading, a peak, a worst case). The shell formats the
number with `spotlightNumber()` (strips a `count` unit's written label; percent/Gbps/ms keep their
inline symbol) and renders nothing until the raw value is defined.

| Tab | Variant | Spotlight figure | Caption |
| --- | --- | --- | --- |
| Donut | Threats blocked by category | Sum of all slices | threats blocked this window |
| Donut | Devices by platform | Sum of all slices | devices enrolled |
| Donut | Tunnel traffic by protocol | Leading protocol's share (shares always sum to 100%, so the total isn't the story) | share carried by `<protocol>` |
| Donut | Tunnels per gateway | Sum of all slices | tunnels across the fleet |
| Donut | Licence seat utilisation | The "In use" slice only | seats in use right now |
| Bar | Failed authentications per day | Sum across the window | failed attempts this window |
| Bar | Threats blocked by category, per day | Grand total across every category and day | threats blocked this window |
| Bar | Throughput in / out per gateway | Ingress + egress summed across every gateway | Gbps ingress + egress combined |
| Bar | Peak gateway CPU load | Highest bar (worst gateway) | peak gateway load |
| Bar | Gateway utilisation by team | Highest bar (worst team) | highest team utilisation |
| Bar | Gateway uptime vs 99.9% SLA | Lowest bar (closest to breach) | lowest gateway uptime |
| Line | Active VPN tunnels | Latest point | tunnels active right now |
| Line | Tunnels by region | Sum of each series' latest point | tunnels active across all regions |
| Line | Egress throughput | Latest point | Gbps egress right now |
| Line | Gateway CPU load vs capacity | Latest point (`useGatewayLoadSeries().latest`) | current gateway load |
| Line | Gateway CPU load, inline | Same latest point as the full chart | current gateway load (card: hidden, no room; fullscreen: shown) |
| Line | Gateways online vs redundancy floor | Latest point | gateways online right now |

### Custom Chart.js plugins

`src/charts/plugins.ts`: `crosshair`, `arcValueLabels` (inside or outside the ring),
`edgeValueLabels` (right-aligned % column), `barValueLabels` (values at bar ends, with collision
skipping), `areaFade` (gradient fill drawn outside the Filler so its opacity can ramp after the line
finishes drawing), `gatewayCategoryLabels` (draws `drawGatewayIcon()` + the row's label in place of
the category axis's default tick text — used only by "Gateway utilisation by team").

That axis pairs the plugin with `ticks.display: false` and a scale-level `afterFit` callback that
reserves the axis's width via `ctx.measureText`. Chart.js has no chart-wide plugin hook for scale
fitting — only the scale's own `CoreScaleOptions.afterFit` option runs at that point — so the width
reservation lives on the axis config in `BarBase` (gated by a `gatewayIcons` prop) rather than in
the plugin itself.

## Routes

Single page, no router. Tab selection is `useState<TabId>` in `App`; nothing is in the URL.

## State Management

Two React contexts, no state library.

- `ThemeProvider` (`src/theme/useThemeTokens.ts`) — `theme`, `setTheme`, resolved `tokens`.
- `ControlsProvider` (`src/components/ControlPanel.tsx`) — four independent slices so per-tab
  settings survive tab switches:
  - `global`: `gridlines`, `axisLabels`, `legend`, `density`, `replayToken`, `spotlight`
  - `donut`: `cutout`, `startAngle`, `order`, `groupTail`, `topN`, `valueLabels` — `cutout` applies
    identically to every donut variant; no variant offsets it, so the ring thickness is always the
    same across the tab
  - `bar`: `cornerRadius`, `thickness`, `layout`, `valueLabels`, `threshold`
  - `line`: `curve`, `points`, `pointRadius`, `lineWidth`, `areaFill`, `stepped`, `threshold`,
    `crosshair`

There is no palette control. `PaletteRole` is declared per variant in the registry and is never
user-switchable.

Each variant may declare an `unsupported` map of control key → reason. In the rail a control is
disabled only when the reason applies; inside the fullscreen inspector the map is scoped to that one
variant, so the reason is always specific.

Hover state is local to each chart (`useChartHover`) and drives both the HTML tooltip and the
scriptable colours passed back into Chart.js. Zoom state is held by `useZoomWindow` as an index
range in React state and fed back through the axis config, because react-chartjs-2 replaces
`chart.options` on every render and would otherwise discard it.

## Event Log

| Event | Trigger | Effect |
| --- | --- | --- |
| Theme change | Rail (Global section) | `data-theme` flips; every chart recolours in 150ms with no entry replay |
| Global control change | Rail, Global section | Applies to every visible chart on every tab; the legend position/off control has no effect on a chart with one series or slice — its legend never renders regardless of setting |
| Spotlight toggle | Rail, Global section | Every variant with a `spotlightValue` shows/hides its headline figure, on the card and in the fullscreen inspector; the compact sparkline card is the one exception |
| Tab change | Tab bar | Contextual section cross-fades (150ms) to that tab's settings; values are retained per tab |
| Tab control change | Rail, `[Tab] settings` | Applies only to that family's variants |
| Threshold drag | Capacity threshold slider | Bar fills re-evaluate; the line's `segment.borderColor` moves the switch point, including mid-segment |
| Replay | Replay button | `replayToken` increments, remounting each card so entry animations re-run |
| Hover enter | Pointer over a plot | Tooltip appears; hovered element takes its light tone, others drop to 40% |
| Hover leave | Pointer leaves the chart area | `frameHandlers` clears hover — Chart.js does not fire `onHover` outside the chart area |
| Expand | Card expand button (always visible) | Modal opens, chart remounts at `size="fullscreen"`, entry animation replays as a reveal |
| Zoom | Wheel, drag or pinch in the modal | `useZoomWindow` stores the index range; **Reset zoom** appears |
| Esc / Close / backdrop | Modal | Closes, body scroll restored, focus returns to the expand button |
| Open modal / mobile controls drawer | Expand button, or Controls button below `xl` | A fixed dark scrim (`bg-scrim`, token `--scrim`) covers the page behind the panel; the modal's scrim also gets a 2px backdrop blur |

## Dependencies on Shared Code

Everything under "Shared Architecture" in [`_overview.md`](./_overview.md) — tokens, theming,
Chart.js defaults, the option-builder layer, the chart sink and the fullscreen pattern. The
fullscreen pattern is generic: a new variant gets expand, zoom, the inspector table and scoped
controls purely by being added to the registry with a `tab` and a `role`.
