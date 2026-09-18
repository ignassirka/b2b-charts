/**
 * Visual directions — five design languages for the same charts, plus the v2 baseline.
 *
 * THE UNBREAKABLE RULE: a direction may not introduce, alter or substitute a hue. Every knob
 * below is either non-colour (geometry, type, motion, labelling) or names a TOKEN and an alpha.
 * There are no colour values in this file, only token names from `tokens.ts`.
 *
 * Adding a sixth direction means adding one entry to `DIRECTIONS`. Nothing else in the app
 * needs editing: the switcher, Foundations, compare mode and the diff matrix all enumerate
 * this map, and every contextual-control default is derived from the contract below.
 */

import type { EasingFunction } from 'chart.js'

/** Which token a piece of chrome or chart furniture draws from. Never a colour, only a name. */
export type TokenRef =
  | 'pageBg'
  | 'cardSurface'
  | 'cardSurfaceRaised'
  | 'cardBorder'
  | 'textMuted'
  | 'textStrong'
  | 'seriesNeutral'
  | 'gridLine'

export type FontStackId = 'sans' | 'mono' | 'display'

// ---------------------------------------------------------------------------- contract

export interface CardChromeSpec {
  /** `page` dissolves the card into the page; `translucent` lets the page show through. */
  surface: 'solid' | 'translucent' | 'page' | 'raised'
  surfaceAlpha: number
  borderWidth: number
  borderStyle: 'solid' | 'none'
  borderToken: TokenRef
  radius: number
  shadow: 'none' | 'hairline' | 'soft' | 'layered'
  padding: number
  gap: number
  headerLayout: 'inline' | 'stacked' | 'baseline'
  titleFont: FontStackId
  titleSize: number
  titleWeight: number
  titleCase: 'none' | 'upper'
  titleTracking: number
  titleToken: TokenRef
  markVisible: boolean
  expandButton: 'bordered' | 'ghost' | 'square' | 'heavy'
  divider: 'none' | 'hairline' | 'heavy'
}

export interface FrameSpec {
  plotPadding: number
  axisLineWidth: number
  axisLineStyle: 'none' | 'solid'
  axisToken: TokenRef
  tickMarks: 'none' | 'minor' | 'major-minor'
  tickLength: number
  tickSide: 'inside' | 'outside'
  gridStyle: 'none' | 'dotted' | 'dashed' | 'solid'
  gridWeight: number
  gridOpacity: number
  gridAxes: 'none' | 'y' | 'both'
  /** `open` draws an L, `closed` boxes the plot, `none` leaves it floating. */
  frameShape: 'open' | 'closed' | 'none'
  baseline: 'none' | 'hairline' | 'heavy'
}

export interface TypeSpec {
  fontStack: FontStackId
  tabularNumerals: boolean
  tickSize: number
  labelSize: number
  valueLabelSize: number
  weight: number
  tracking: number
  upperCase: boolean
  numberStyle: 'full' | 'abbreviated'
  /** Multiplier for the hero figure (donut KPI) against `labelSize`. */
  heroScale: number
}

export interface LabellingSpec {
  model: 'legend' | 'direct' | 'leader-lines' | 'end-only' | 'none'
  legendShape: 'dot' | 'rounded' | 'square-block'
  legendLayout: 'row' | 'stack'
  /** D5: swatch stays neutral until the legend item is hovered. */
  legendRevealOnHover: boolean
  valueLabelPlacement: 'off' | 'outside' | 'inside' | 'end'
}

export interface SeriesSpec {
  fill: 'solid' | 'gradient' | 'pattern' | 'outline'
  strokeWidth: number
  lineCap: CanvasLineCap
  lineJoin: CanvasLineJoin
  /** Curve amount used when the contextual curve control says "smooth". */
  tension: number
  idleOpacity: number
  donutCutout: number
  donutGap: number
  donutArcCap: 'butt' | 'round'
  /** D4 pulls the largest segment out as a compositional break. */
  donutOffset: 'none' | 'largest'
  donutLift: number
  barThickness: number
  /** 1 = flush, lower = wider gaps. */
  barFlush: number
  barRadius: number
  barBaseline: 'none' | 'hairline' | 'heavy'
  areaFill: 'none' | 'flat' | 'gradient'
  areaOpacity: number
  pointShape: 'circle' | 'cross' | 'rect' | 'halo' | 'none'
  pointSize: number
  /** Canvas shadow blur on the focused/breaching series. 0 disables. */
  glow: number
  contactShadow: boolean
}

export interface EmphasisSpec {
  /** `earned` = neutral token unless hovered, breaching, latest or largest (D5). */
  colorGate: 'all' | 'earned'
  focusWeight: number
  breachWeight: number
  breachDash: boolean
  breachMarker: boolean
  breachPulse: boolean
  thresholdWidth: number
  thresholdDashOn: number
  thresholdDashOff: number
  thresholdLabel: boolean
  suppressChrome: boolean
}

export interface MotionSpec {
  entryMs: number
  easing: EasingFunction
  staggerMs: number
  reveal: 'grow' | 'sweep' | 'draw' | 'wipe' | 'rise'
  hoverMs: number
  /** False = decorative, true = the motion itself carries the reading. */
  meaningful: boolean
  loopPulse: boolean
}

export interface TooltipSpec {
  shape: 'rounded' | 'square' | 'pill'
  border: 'none' | 'hairline' | 'heavy'
  shadow: 'none' | 'soft' | 'layered'
  arrow: boolean
  backdrop: 'none' | 'blur'
  density: 'compact' | 'comfortable'
  dimOthers: number
  crosshair: 'none' | 'hairline' | 'dashed' | 'heavy'
  numerals: 'tabular' | 'proportional'
}

export interface ChartDirection {
  id: DirectionId
  name: string
  /** Two lines: the intent, then when it suits a B2B VPN admin panel. */
  intent: string
  suits: string
  card: CardChromeSpec
  frame: FrameSpec
  type: TypeSpec
  labelling: LabellingSpec
  series: SeriesSpec
  emphasis: EmphasisSpec
  motion: MotionSpec
  tooltip: TooltipSpec
}

export type DirectionId =
  | 'current'
  | 'precision'
  | 'editorial'
  | 'material'
  | 'structural'
  | 'signal-first'

// ---------------------------------------------------------------------------- directions

/** v2 exactly as shipped, kept as the comparison anchor rather than deleted. */
const current: ChartDirection = {
  id: 'current',
  name: 'Current',
  intent: 'The shipped v2 baseline: a neutral, conventional dashboard chart style.',
  suits: 'The reference point every other direction is judged against, not a candidate itself.',
  card: {
    surface: 'solid',
    surfaceAlpha: 1,
    borderWidth: 1,
    borderStyle: 'solid',
    borderToken: 'cardBorder',
    radius: 12,
    shadow: 'none',
    padding: 20,
    gap: 16,
    headerLayout: 'inline',
    titleFont: 'sans',
    titleSize: 15,
    titleWeight: 600,
    titleCase: 'none',
    titleTracking: 0,
    titleToken: 'textStrong',
    markVisible: true,
    expandButton: 'bordered',
    divider: 'none',
  },
  frame: {
    plotPadding: 2,
    axisLineWidth: 0,
    axisLineStyle: 'none',
    axisToken: 'textMuted',
    tickMarks: 'none',
    tickLength: 0,
    tickSide: 'outside',
    gridStyle: 'solid',
    gridWeight: 1,
    gridOpacity: 1,
    gridAxes: 'y',
    frameShape: 'none',
    baseline: 'none',
  },
  type: {
    fontStack: 'sans',
    tabularNumerals: false,
    tickSize: 10,
    labelSize: 10,
    valueLabelSize: 10,
    weight: 500,
    tracking: 0,
    upperCase: false,
    numberStyle: 'abbreviated',
    heroScale: 2.4,
  },
  labelling: {
    model: 'legend',
    legendShape: 'rounded',
    legendLayout: 'row',
    legendRevealOnHover: false,
    valueLabelPlacement: 'off',
  },
  series: {
    fill: 'solid',
    strokeWidth: 2,
    lineCap: 'round',
    lineJoin: 'round',
    tension: 0.4,
    idleOpacity: 0.4,
    donutCutout: 72,
    donutGap: 2,
    donutArcCap: 'butt',
    donutOffset: 'none',
    donutLift: 6,
    barThickness: 10,
    barFlush: 0.9,
    barRadius: 2,
    barBaseline: 'none',
    areaFill: 'gradient',
    areaOpacity: 0.38,
    pointShape: 'circle',
    pointSize: 3,
    glow: 0,
    contactShadow: false,
  },
  emphasis: {
    colorGate: 'all',
    focusWeight: 1.5,
    breachWeight: 1,
    breachDash: false,
    breachMarker: false,
    breachPulse: false,
    thresholdWidth: 1,
    thresholdDashOn: 4,
    thresholdDashOff: 4,
    thresholdLabel: false,
    suppressChrome: false,
  },
  motion: {
    entryMs: 700,
    easing: 'easeOutCubic',
    staggerMs: 60,
    reveal: 'draw',
    hoverMs: 150,
    meaningful: false,
    loopPulse: false,
  },
  tooltip: {
    shape: 'rounded',
    border: 'hairline',
    shadow: 'soft',
    arrow: false,
    backdrop: 'none',
    density: 'comfortable',
    dimOthers: 0.4,
    crosshair: 'hairline',
    numerals: 'tabular',
  },
}

/** D1 — oscilloscope, trading terminal, aircraft panel. Maximum data-ink, zero decoration. */
const precision: ChartDirection = {
  id: 'precision',
  name: 'Precision Instrument',
  intent:
    'Maximum data-ink and zero decoration: hairline grids on both axes, real major and minor tick marks, a closed plot frame and full-precision monospace numerals.',
  suits:
    'The NOC view for an engineer who reads these charts all day and needs to take an exact value off the screen without opening anything.',
  card: {
    surface: 'solid',
    surfaceAlpha: 1,
    borderWidth: 1,
    borderStyle: 'solid',
    borderToken: 'textMuted',
    radius: 2,
    shadow: 'none',
    padding: 10,
    gap: 8,
    headerLayout: 'baseline',
    titleFont: 'mono',
    titleSize: 11,
    titleWeight: 500,
    titleCase: 'none',
    titleTracking: 0.02,
    titleToken: 'textStrong',
    markVisible: false,
    expandButton: 'ghost',
    divider: 'hairline',
  },
  frame: {
    plotPadding: 1,
    axisLineWidth: 1,
    axisLineStyle: 'solid',
    axisToken: 'textMuted',
    tickMarks: 'major-minor',
    tickLength: 4,
    tickSide: 'outside',
    gridStyle: 'solid',
    gridWeight: 0.5,
    gridOpacity: 0.55,
    gridAxes: 'both',
    frameShape: 'closed',
    baseline: 'hairline',
  },
  type: {
    fontStack: 'mono',
    tabularNumerals: true,
    tickSize: 9,
    labelSize: 9,
    valueLabelSize: 9,
    weight: 400,
    tracking: 0,
    upperCase: false,
    numberStyle: 'full',
    heroScale: 1.9,
  },
  labelling: {
    model: 'leader-lines',
    legendShape: 'square-block',
    legendLayout: 'row',
    legendRevealOnHover: false,
    valueLabelPlacement: 'outside',
  },
  series: {
    fill: 'solid',
    strokeWidth: 1,
    lineCap: 'butt',
    lineJoin: 'miter',
    tension: 0,
    idleOpacity: 0.25,
    donutCutout: 84,
    donutGap: 0.5,
    donutArcCap: 'butt',
    donutOffset: 'none',
    donutLift: 2,
    barThickness: 6,
    barFlush: 0.96,
    barRadius: 0,
    barBaseline: 'hairline',
    areaFill: 'none',
    areaOpacity: 0.1,
    pointShape: 'cross',
    pointSize: 2,
    glow: 0,
    contactShadow: false,
  },
  emphasis: {
    colorGate: 'all',
    focusWeight: 2,
    breachWeight: 1,
    breachDash: false,
    breachMarker: true,
    breachPulse: false,
    thresholdWidth: 1,
    thresholdDashOn: 2,
    thresholdDashOff: 2,
    thresholdLabel: true,
    suppressChrome: false,
  },
  motion: {
    entryMs: 180,
    easing: 'linear',
    staggerMs: 8,
    reveal: 'grow',
    hoverMs: 40,
    meaningful: false,
    loopPulse: false,
  },
  tooltip: {
    shape: 'square',
    border: 'hairline',
    shadow: 'none',
    arrow: false,
    backdrop: 'none',
    density: 'compact',
    dimOthers: 0.25,
    crosshair: 'dashed',
    numerals: 'tabular',
  },
}

/** D2 — printed annual report, broadsheet data page. Generous, quiet, authored. */
const editorial: ChartDirection = {
  id: 'editorial',
  name: 'Soft Editorial',
  intent:
    'Generous whitespace, serif display titles and direct labelling instead of legends; the chart occupies less than half the card and every stroke is thick, soft and rounded.',
  suits:
    'An executive or monthly-report surface where one figure per card is the point and nobody is hunting for an exact reading.',
  card: {
    surface: 'solid',
    surfaceAlpha: 1,
    borderWidth: 0,
    borderStyle: 'none',
    borderToken: 'cardBorder',
    radius: 24,
    shadow: 'soft',
    padding: 34,
    gap: 26,
    headerLayout: 'stacked',
    titleFont: 'display',
    titleSize: 21,
    titleWeight: 400,
    titleCase: 'none',
    titleTracking: -0.01,
    titleToken: 'textStrong',
    markVisible: false,
    expandButton: 'ghost',
    divider: 'none',
  },
  frame: {
    plotPadding: 20,
    axisLineWidth: 0,
    axisLineStyle: 'none',
    axisToken: 'cardBorder',
    tickMarks: 'none',
    tickLength: 0,
    tickSide: 'inside',
    gridStyle: 'none',
    gridWeight: 0,
    gridOpacity: 0,
    gridAxes: 'none',
    frameShape: 'none',
    baseline: 'hairline',
  },
  type: {
    fontStack: 'sans',
    tabularNumerals: false,
    tickSize: 11,
    labelSize: 12,
    valueLabelSize: 13,
    weight: 400,
    tracking: 0,
    upperCase: false,
    numberStyle: 'abbreviated',
    heroScale: 3.4,
  },
  labelling: {
    model: 'direct',
    legendShape: 'dot',
    legendLayout: 'stack',
    legendRevealOnHover: false,
    valueLabelPlacement: 'outside',
  },
  series: {
    fill: 'solid',
    strokeWidth: 4,
    lineCap: 'round',
    lineJoin: 'round',
    tension: 0.45,
    idleOpacity: 0.18,
    donutCutout: 86,
    donutGap: 8,
    donutArcCap: 'round',
    donutOffset: 'none',
    donutLift: 10,
    barThickness: 22,
    barFlush: 0.5,
    barRadius: 11,
    barBaseline: 'none',
    areaFill: 'none',
    areaOpacity: 0.22,
    pointShape: 'none',
    pointSize: 5,
    glow: 0,
    contactShadow: false,
  },
  emphasis: {
    colorGate: 'all',
    focusWeight: 1.25,
    breachWeight: 1.4,
    breachDash: false,
    breachMarker: true,
    breachPulse: false,
    thresholdWidth: 2,
    thresholdDashOn: 1,
    thresholdDashOff: 6,
    thresholdLabel: true,
    suppressChrome: true,
  },
  motion: {
    entryMs: 1150,
    easing: 'easeOutQuart',
    staggerMs: 150,
    reveal: 'rise',
    hoverMs: 260,
    meaningful: false,
    loopPulse: false,
  },
  tooltip: {
    shape: 'pill',
    border: 'none',
    shadow: 'soft',
    arrow: false,
    backdrop: 'none',
    density: 'comfortable',
    dimOthers: 0.18,
    crosshair: 'none',
    numerals: 'proportional',
  },
}

/** D3 — layered glass and light. Dimensional, tactile, premium. */
const material: ChartDirection = {
  id: 'material',
  name: 'Depth & Material',
  intent:
    'Every series carries a vertical gradient between the two tones of its own pair, sitting on a translucent elevated card with layered shadow; the focused series glows in its own colour.',
  suits:
    'A customer-facing or sales-demo console where the product has to feel premium and the charts are as much brand surface as instrument.',
  card: {
    // PROVISIONAL — pending design review: glass alpha is a judgement call in dark theme,
    // where the page token is already near-black and the layering reads more subtly.
    surface: 'translucent',
    surfaceAlpha: 0.72,
    // A glass edge reads as a highlight rather than a rule, so it sits between hairline and heavy.
    borderWidth: 1.5,
    borderStyle: 'solid',
    borderToken: 'cardSurfaceRaised',
    radius: 20,
    shadow: 'layered',
    padding: 24,
    gap: 20,
    headerLayout: 'stacked',
    titleFont: 'sans',
    titleSize: 17,
    titleWeight: 500,
    titleCase: 'none',
    titleTracking: -0.005,
    titleToken: 'textStrong',
    markVisible: true,
    expandButton: 'ghost',
    divider: 'hairline',
  },
  frame: {
    plotPadding: 10,
    axisLineWidth: 0,
    axisLineStyle: 'none',
    axisToken: 'cardSurfaceRaised',
    tickMarks: 'none',
    tickLength: 0,
    tickSide: 'inside',
    gridStyle: 'dotted',
    gridWeight: 1.5,
    gridOpacity: 0.35,
    gridAxes: 'both',
    frameShape: 'none',
    baseline: 'hairline',
  },
  type: {
    fontStack: 'sans',
    tabularNumerals: true,
    tickSize: 11,
    labelSize: 11,
    valueLabelSize: 11,
    weight: 600,
    tracking: 0.01,
    upperCase: false,
    numberStyle: 'abbreviated',
    heroScale: 2.8,
  },
  labelling: {
    model: 'legend',
    legendShape: 'dot',
    legendLayout: 'row',
    legendRevealOnHover: false,
    valueLabelPlacement: 'inside',
  },
  series: {
    fill: 'gradient',
    strokeWidth: 3,
    lineCap: 'round',
    lineJoin: 'round',
    tension: 0.35,
    idleOpacity: 0.3,
    donutCutout: 58,
    donutGap: 3,
    donutArcCap: 'round',
    donutOffset: 'none',
    donutLift: 14,
    barThickness: 18,
    barFlush: 0.72,
    barRadius: 6,
    barBaseline: 'none',
    areaFill: 'gradient',
    areaOpacity: 0.45,
    pointShape: 'halo',
    pointSize: 4,
    // PROVISIONAL — pending design review: glow radius in dark theme.
    glow: 14,
    contactShadow: true,
  },
  emphasis: {
    colorGate: 'all',
    focusWeight: 1.6,
    breachWeight: 1.2,
    breachDash: false,
    breachMarker: true,
    breachPulse: false,
    thresholdWidth: 2,
    thresholdDashOn: 6,
    thresholdDashOff: 5,
    thresholdLabel: false,
    suppressChrome: false,
  },
  motion: {
    entryMs: 900,
    easing: 'easeOutBack',
    staggerMs: 90,
    reveal: 'rise',
    hoverMs: 200,
    meaningful: false,
    loopPulse: false,
  },
  tooltip: {
    shape: 'rounded',
    border: 'hairline',
    shadow: 'layered',
    arrow: true,
    backdrop: 'blur',
    density: 'comfortable',
    dimOthers: 0.3,
    crosshair: 'dashed',
    numerals: 'tabular',
  },
}

/** D4 — Bauhaus poster, Swiss grid, architectural drawing. Hard geometry, unapologetic blocks. */
const structural: ChartDirection = {
  id: 'structural',
  name: 'Structural',
  intent:
    'Zero radius anywhere, heavy neutral axis rules, a visible grid in both directions and bars flush against each other so the chart reads as one segmented block.',
  suits:
    'An internal capacity-planning or inventory view where charts sit beside dense tables and should read as typographic structure, not decoration.',
  card: {
    surface: 'solid',
    surfaceAlpha: 1,
    borderWidth: 2,
    borderStyle: 'solid',
    borderToken: 'seriesNeutral',
    radius: 0,
    shadow: 'none',
    padding: 16,
    gap: 12,
    headerLayout: 'baseline',
    titleFont: 'sans',
    titleSize: 12,
    titleWeight: 700,
    titleCase: 'upper',
    titleTracking: 0.09,
    titleToken: 'textStrong',
    markVisible: true,
    expandButton: 'square',
    divider: 'heavy',
  },
  frame: {
    plotPadding: 6,
    axisLineWidth: 3,
    axisLineStyle: 'solid',
    axisToken: 'seriesNeutral',
    tickMarks: 'minor',
    tickLength: 6,
    tickSide: 'inside',
    gridStyle: 'solid',
    gridWeight: 1,
    gridOpacity: 0.8,
    gridAxes: 'both',
    frameShape: 'open',
    baseline: 'heavy',
  },
  type: {
    fontStack: 'sans',
    tabularNumerals: true,
    tickSize: 9,
    labelSize: 10,
    valueLabelSize: 10,
    weight: 700,
    tracking: 0.12,
    upperCase: true,
    numberStyle: 'abbreviated',
    heroScale: 2.2,
  },
  labelling: {
    model: 'legend',
    legendShape: 'square-block',
    legendLayout: 'stack',
    legendRevealOnHover: false,
    valueLabelPlacement: 'inside',
  },
  series: {
    fill: 'pattern',
    strokeWidth: 5,
    lineCap: 'butt',
    lineJoin: 'miter',
    tension: 0,
    idleOpacity: 0.35,
    donutCutout: 48,
    donutGap: 0,
    donutArcCap: 'butt',
    donutOffset: 'largest',
    donutLift: 18,
    barThickness: 44,
    barFlush: 1,
    barRadius: 0,
    barBaseline: 'heavy',
    areaFill: 'flat',
    areaOpacity: 0.3,
    pointShape: 'rect',
    pointSize: 4,
    glow: 0,
    contactShadow: false,
  },
  emphasis: {
    colorGate: 'all',
    focusWeight: 1.4,
    breachWeight: 1.6,
    breachDash: true,
    breachMarker: false,
    breachPulse: false,
    thresholdWidth: 3,
    thresholdDashOn: 12,
    thresholdDashOff: 0,
    thresholdLabel: true,
    suppressChrome: false,
  },
  motion: {
    entryMs: 520,
    easing: 'easeInOutQuad',
    staggerMs: 26,
    reveal: 'wipe',
    hoverMs: 0,
    meaningful: false,
    loopPulse: false,
  },
  tooltip: {
    shape: 'square',
    border: 'heavy',
    shadow: 'none',
    arrow: false,
    backdrop: 'none',
    density: 'compact',
    dimOthers: 0.35,
    crosshair: 'heavy',
    numerals: 'tabular',
  },
}

/** D5 — a monitoring wall seen from across the room. Colour is spent only on meaning. */
const signalFirst: ChartDirection = {
  id: 'signal-first',
  name: 'Signal First',
  intent:
    'Everything renders neutral until it earns colour by breaching, being the latest value, being the largest share, or being hovered; chrome is stripped to nothing and state is carried by weight and motion as well as hue.',
  suits:
    'A wall-mounted or always-on monitoring view where the only question is "is anything wrong right now" from three metres away.',
  card: {
    surface: 'page',
    surfaceAlpha: 1,
    borderWidth: 0,
    borderStyle: 'none',
    borderToken: 'pageBg',
    radius: 6,
    shadow: 'none',
    padding: 14,
    gap: 10,
    headerLayout: 'stacked',
    titleFont: 'sans',
    titleSize: 13,
    titleWeight: 500,
    titleCase: 'none',
    titleTracking: 0.01,
    titleToken: 'textMuted',
    markVisible: false,
    expandButton: 'ghost',
    divider: 'none',
  },
  frame: {
    plotPadding: 4,
    axisLineWidth: 0,
    axisLineStyle: 'none',
    axisToken: 'seriesNeutral',
    tickMarks: 'none',
    tickLength: 0,
    tickSide: 'outside',
    gridStyle: 'none',
    gridWeight: 0,
    gridOpacity: 0,
    gridAxes: 'none',
    frameShape: 'none',
    baseline: 'none',
  },
  type: {
    fontStack: 'sans',
    tabularNumerals: true,
    tickSize: 10,
    labelSize: 10,
    valueLabelSize: 12,
    weight: 600,
    tracking: 0.04,
    upperCase: false,
    numberStyle: 'abbreviated',
    heroScale: 3,
  },
  labelling: {
    model: 'end-only',
    legendShape: 'dot',
    legendLayout: 'row',
    legendRevealOnHover: true,
    valueLabelPlacement: 'end',
  },
  series: {
    fill: 'solid',
    strokeWidth: 2,
    lineCap: 'round',
    lineJoin: 'round',
    tension: 0.2,
    idleOpacity: 0.55,
    donutCutout: 76,
    donutGap: 1,
    donutArcCap: 'butt',
    donutOffset: 'none',
    donutLift: 4,
    barThickness: 14,
    barFlush: 0.85,
    barRadius: 1,
    barBaseline: 'none',
    areaFill: 'none',
    areaOpacity: 0.15,
    pointShape: 'circle',
    pointSize: 3.5,
    glow: 0,
    contactShadow: false,
  },
  emphasis: {
    colorGate: 'earned',
    focusWeight: 2.2,
    breachWeight: 2,
    breachDash: true,
    breachMarker: true,
    // PROVISIONAL — pending design review: pulse amplitude in dark theme, where the
    // page is already low-luminance and a bright pulse reads louder than in light.
    breachPulse: true,
    thresholdWidth: 1,
    thresholdDashOn: 8,
    thresholdDashOff: 6,
    thresholdLabel: false,
    suppressChrome: true,
  },
  motion: {
    entryMs: 1400,
    easing: 'easeOutSine',
    staggerMs: 0,
    reveal: 'draw',
    hoverMs: 120,
    meaningful: true,
    loopPulse: true,
  },
  tooltip: {
    shape: 'square',
    border: 'none',
    shadow: 'soft',
    arrow: false,
    backdrop: 'none',
    density: 'compact',
    dimOthers: 0.55,
    crosshair: 'dashed',
    numerals: 'tabular',
  },
}

export const DIRECTIONS: Record<DirectionId, ChartDirection> = {
  current,
  precision,
  editorial,
  material,
  'structural': structural,
  'signal-first': signalFirst,
}

/** Switcher, compare mode and Foundations all enumerate this, so a D6 appears in all three. */
export const DIRECTION_IDS = Object.keys(DIRECTIONS) as DirectionId[]

export const DEFAULT_DIRECTION: DirectionId = 'current'

export function isDirectionId(value: unknown): value is DirectionId {
  return typeof value === 'string' && value in DIRECTIONS
}

// ---------------------------------------------------------------------------- control defaults

/**
 * A direction sets the DEFAULT of every contextual control. These are derived from the contract
 * above rather than duplicated, so a sixth direction cannot forget to supply them.
 *
 * Data-shaping controls (segment order, tail folding, top N, stacked vs grouped, the capacity
 * threshold) are NOT visual language, so they keep their v2 values in every direction.
 */
export interface DerivedControlDefaults {
  /** The one global control the contract genuinely owns: the grid is part of the language. */
  global: {
    gridlines: 'off' | 'horizontal' | 'both'
  }
  donut: {
    cutout: number
    startAngle: number
    order: 'value-desc' | 'fixed'
    groupTail: boolean
    topN: number
    valueLabels: 'off' | 'inside' | 'outside'
  }
  bar: {
    cornerRadius: number
    thickness: number
    layout: 'stacked' | 'grouped'
    valueLabels: boolean
    threshold: number
  }
  line: {
    curve: 'straight' | 'smooth'
    points: 'off' | 'hover' | 'always'
    pointRadius: number
    lineWidth: number
    areaFill: boolean
    stepped: boolean
    threshold: number
    crosshair: boolean
  }
}

export function controlDefaultsFor(direction: ChartDirection): DerivedControlDefaults {
  const { series, labelling, tooltip, frame } = direction
  const gridlines =
    frame.gridStyle === 'none' || frame.gridAxes === 'none'
      ? ('off' as const)
      : frame.gridAxes === 'both'
        ? ('both' as const)
        : ('horizontal' as const)
  const arcLabels =
    labelling.valueLabelPlacement === 'inside'
      ? 'inside'
      : labelling.valueLabelPlacement === 'off'
        ? 'off'
        : 'outside'

  return {
    global: { gridlines },
    donut: {
      cutout: series.donutCutout,
      startAngle: 0,
      order: 'fixed',
      groupTail: true,
      topN: 4,
      valueLabels: arcLabels,
    },
    bar: {
      cornerRadius: series.barRadius,
      thickness: series.barThickness,
      layout: 'grouped',
      valueLabels: labelling.valueLabelPlacement !== 'off',
      threshold: 85,
    },
    line: {
      curve: series.tension > 0 ? 'smooth' : 'straight',
      points: series.pointShape === 'none' ? 'off' : series.pointSize >= 3.5 ? 'always' : 'hover',
      pointRadius: Math.round(series.pointSize),
      lineWidth: Math.round(series.strokeWidth),
      areaFill: series.areaFill !== 'none',
      stepped: false,
      threshold: 85,
      crosshair: tooltip.crosshair !== 'none',
    },
  }
}

// ---------------------------------------------------------------------------- divergence check

/** Every leaf path in the contract, excluding the identity/prose fields. */
const STYLE_GROUPS = [
  'card',
  'frame',
  'type',
  'labelling',
  'series',
  'emphasis',
  'motion',
  'tooltip',
] as const

function leaves(direction: ChartDirection): Record<string, unknown> {
  const flat: Record<string, unknown> = {}
  for (const group of STYLE_GROUPS) {
    const values = direction[group] as unknown as Record<string, unknown>
    for (const [key, value] of Object.entries(values)) flat[`${group}.${key}`] = value
  }
  return flat
}

export const CONTRACT_KNOB_COUNT = Object.keys(leaves(current)).length

export interface DivergencePair {
  a: DirectionId
  b: DirectionId
  shared: number
  total: number
  /** Fraction of knobs holding the same value. Must stay at or below 0.4. */
  ratio: number
}

/** Pairwise "how much do these two actually agree" — the 40% divergence proof. */
export function directionDivergence(): DivergencePair[] {
  const flat = Object.fromEntries(
    DIRECTION_IDS.map((id) => [id, leaves(DIRECTIONS[id])]),
  ) as Record<DirectionId, Record<string, unknown>>

  const pairs: DivergencePair[] = []
  for (let i = 0; i < DIRECTION_IDS.length; i += 1) {
    for (let j = i + 1; j < DIRECTION_IDS.length; j += 1) {
      const a = DIRECTION_IDS[i]
      const b = DIRECTION_IDS[j]
      const keys = Object.keys(flat[a])
      const shared = keys.filter((key) => flat[a][key] === flat[b][key]).length
      pairs.push({ a, b, shared, total: keys.length, ratio: shared / keys.length })
    }
  }
  return pairs
}

export const MAX_SHARED_RATIO = 0.4

/** Dev-only: fails loudly in the console if two directions have drifted together. */
export function assertDivergence() {
  if (!import.meta.env.DEV) return
  const breaches = directionDivergence().filter((pair) => pair.ratio > MAX_SHARED_RATIO)
  if (!breaches.length) return
  console.warn(
    '[directions] these pairs share more than 40% of their contract values:\n' +
      breaches
        .map((p) => `  ${p.a} ↔ ${p.b}: ${p.shared}/${p.total} (${Math.round(p.ratio * 100)}%)`)
        .join('\n'),
  )
}
