/**
 * Synthetic VPN telemetry for the style playground.
 *
 * THESE ARE ILLUSTRATIVE SYNTHETIC VALUES FOR VISUAL EVALUATION, NOT MEASUREMENTS.
 *
 * Shape assumptions baked into the generators:
 *  - Corporate VPN usage is weekday-driven, so every daily series dips on Saturday and Sunday.
 *  - Sessions follow office hours: each region peaks 09:00–17:00 in its own local time, so the
 *    three-region stack shows overlapping humps rather than one spike.
 *  - Gateway load and egress throughput track the connection count; threats blocked tracks
 *    traffic volume; failed authentications spike independently of load.
 *
 * Density is a window, and the 7-day window is sampled finely enough to show the diurnal cycle:
 *    7  → last 7 days  at 3-hour resolution (56 points)
 *   30  → last 30 days at daily resolution
 *   90  → last 90 days at daily resolution
 * Rate series (threats blocked, failed authentications) are reported as a per-day rate at every
 * resolution, so their quoted ranges hold whether a point covers 3 hours or a full day.
 *
 * Everything derives from a seeded PRNG evaluated at module load — never `Math.random()` at
 * render — so visual comparisons stay stable across reloads, theme switches and replays.
 */

export const DENSITIES = [7, 30, 90] as const
export type Density = (typeof DENSITIES)[number]

// ---------------------------------------------------------------------------- units

export type Format = 'percent' | 'count' | 'gbps' | 'ms'

export interface Unit {
  format: Format
  /** Written out in tooltips and the fullscreen inspector table. */
  label: string
}

export const UNITS = {
  tunnels: { format: 'count', label: 'tunnels' },
  threats: { format: 'count', label: 'threats/day' },
  attempts: { format: 'count', label: 'attempts/day' },
  devices: { format: 'count', label: 'devices' },
  licences: { format: 'count', label: 'licences' },
  gateways: { format: 'count', label: 'gateways' },
  percent: { format: 'percent', label: '%' },
  gbps: { format: 'gbps', label: 'Gbps' },
  latency: { format: 'ms', label: 'ms' },
} as const satisfies Record<string, Unit>

// ---------------------------------------------------------------------------- primitives

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Stable jitter for a given series/sample pair — no shared cursor, so adding a series moves nothing. */
function jitter(seed: number, index: number, spread: number): number {
  return (mulberry32(seed + index * 2654435761)() - 0.5) * spread
}

const HOUR = 3_600_000
/** Fixed anchor (Fri 24 May 2024, 21:00 UTC) keeps every tick label identical between runs. */
const ANCHOR = Date.UTC(2024, 4, 24, 21)
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const WINDOW: Record<Density, { days: number; stepHours: number }> = {
  7: { days: 7, stepHours: 3 },
  30: { days: 30, stepHours: 24 },
  90: { days: 90, stepHours: 24 },
}

interface Sample {
  date: Date
  /** True when a point covers less than a day, so diurnal shape is worth rendering. */
  intraday: boolean
}

function samplesFor(density: Density): Sample[] {
  const { days, stepHours } = WINDOW[density]
  const count = (days * 24) / stepHours
  return Array.from({ length: count }, (_, i) => ({
    date: new Date(ANCHOR - (count - 1 - i) * stepHours * HOUR),
    intraday: stepHours < 24,
  }))
}

export interface TimeAxis {
  /** Full labels — used by tooltips and the inspector table. */
  labels: string[]
  /** Sparse labels for the axis: weekday at 7 days, date at 30, month at 90. */
  tickLabels: string[]
}

function axisFor(density: Density, samples: Sample[]): TimeAxis {
  const labels = samples.map((s) =>
    s.intraday
      ? `${WEEKDAYS[s.date.getUTCDay()]} ${String(s.date.getUTCHours()).padStart(2, '0')}:00`
      : `${s.date.getUTCDate()} ${MONTHS[s.date.getUTCMonth()]}`,
  )

  const tickLabels = samples.map((s, i) => {
    if (density === 7) return s.date.getUTCHours() === 12 ? WEEKDAYS[s.date.getUTCDay()] : ''
    if (density === 30) return i % 5 === 0 ? `${s.date.getUTCDate()} ${MONTHS[s.date.getUTCMonth()]}` : ''
    return s.date.getUTCDate() === 1 ? MONTHS[s.date.getUTCMonth()] : ''
  })

  return { labels, tickLabels }
}

// ---------------------------------------------------------------------------- shared shapes

/** Weekends run at roughly a third of weekday volume. */
function weekdayFactor(date: Date): number {
  const day = date.getUTCDay()
  return day === 0 || day === 6 ? 0.35 : 1
}

/** Smooth office-hours hump: zero before 06:00 local, peak early afternoon, zero after 21:00. */
function officeCurve(localHour: number): number {
  const x = (localHour - 6) / 15
  if (x <= 0 || x >= 1) return 0
  return Math.sin(x * Math.PI) ** 1.3
}

const OFFICE_MEAN =
  Array.from({ length: 24 }, (_, h) => officeCurve(h)).reduce((a, b) => a + b, 0) / 24

export const REGIONS = [
  { label: 'EU', utcOffset: 2, share: 0.42 },
  { label: 'US', utcOffset: -5, share: 0.38 },
  { label: 'APAC', utcOffset: 8, share: 0.2 },
] as const

function localHour(date: Date, utcOffset: number): number {
  return (((date.getUTCHours() + utcOffset) % 24) + 24) % 24
}

/** Region weights at this instant. Never zero — some tunnels are always up. */
function regionWeights(date: Date, intraday: boolean): number[] {
  return REGIONS.map(
    (r) => r.share * (intraday ? officeCurve(localHour(date, r.utcOffset)) + 0.12 : OFFICE_MEAN),
  )
}

const WEIGHT_PEAK = Math.max(
  ...Array.from({ length: 24 }, (_, h) =>
    regionWeights(new Date(Date.UTC(2024, 4, 22, h)), true).reduce((a, b) => a + b, 0),
  ),
)
const WEIGHT_MEAN = REGIONS.reduce((sum, r) => sum + r.share * OFFICE_MEAN, 0)

const TUNNEL_FLOOR = 2100
const TUNNEL_SWING = 6900

/** Concurrent tunnels at one instant, 2,100–9,000. */
function tunnelsAt(date: Date, intraday: boolean): number {
  const weights = regionWeights(date, intraday).reduce((a, b) => a + b, 0)
  const shape = intraday ? weights / WEIGHT_PEAK : WEIGHT_MEAN / WEIGHT_PEAK
  return TUNNEL_FLOOR + TUNNEL_SWING * weekdayFactor(date) * shape
}

/** Worst value inside a bucket: the instant itself intraday, the day's peak at daily resolution. */
function bucketPeak(sample: Sample, fn: (date: Date) => number): number {
  if (sample.intraday) return fn(sample.date)
  const midnight = Date.UTC(
    sample.date.getUTCFullYear(),
    sample.date.getUTCMonth(),
    sample.date.getUTCDate(),
  )
  let peak = 0
  for (let h = 0; h < 24; h++) peak = Math.max(peak, fn(new Date(midnight + h * HOUR)))
  return peak
}

// ---------------------------------------------------------------------------- series types

export interface Slice {
  label: string
  value: number
}

export interface Series {
  label: string
  values: number[]
}

export interface CategorySet {
  slices: Slice[]
  unit: Unit
}

export interface TimeSeriesSet extends TimeAxis {
  series: Series[]
  unit: Unit
  axisMax: number
  axisMin?: number
  stepSize?: number
}

/** Round the axis ceiling up to a clean step so gridlines land on readable numbers. */
export function axisCeiling(values: number[], step: number): number {
  const peak = Math.max(...values, 1)
  return Math.ceil((peak * 1.08) / step) * step
}

// ---------------------------------------------------------------------------- time series

/** Concurrent VPN tunnels across the fleet. */
export function activeConnections(density: Density): TimeSeriesSet {
  const samples = samplesFor(density)
  const values = samples.map((s, i) =>
    Math.round(tunnelsAt(s.date, s.intraday) + jitter(0x7c01, i, 420)),
  )
  return {
    ...axisFor(density, samples),
    series: [{ label: 'Active tunnels', values }],
    unit: UNITS.tunnels,
    axisMax: axisCeiling(values, 2000),
    stepSize: 2000,
  }
}

/** The same tunnels split three ways. Intraday the regional humps overlap rather than coincide. */
export function connectionsByRegion(density: Density): TimeSeriesSet {
  const samples = samplesFor(density)
  const perRegion = REGIONS.map(() => [] as number[])

  samples.forEach((s, i) => {
    const total = tunnelsAt(s.date, s.intraday) + jitter(0x7c02, i, 300)
    const weights = regionWeights(s.date, s.intraday)
    const sum = weights.reduce((a, b) => a + b, 0)
    weights.forEach((w, r) => perRegion[r].push(Math.round((total * w) / sum)))
  })

  const totals = samples.map((_, i) => perRegion.reduce((sum, v) => sum + v[i], 0))
  return {
    ...axisFor(density, samples),
    series: REGIONS.map((r, i) => ({ label: r.label, values: perRegion[i] })),
    unit: UNITS.tunnels,
    axisMax: axisCeiling(totals, 2000),
    stepSize: 2000,
  }
}

const THREAT_CATEGORIES = [
  { label: 'Trackers', share: 0.58 },
  { label: 'Ads', share: 0.31 },
  { label: 'Malware', share: 0.062 },
  { label: 'Phishing', share: 0.035 },
  { label: 'Cryptominers', share: 0.013 },
] as const

/** Daily-equivalent rate, 40k–180k, superlinear in traffic so weekends fall away sharply. */
function threatRateAt(date: Date, intraday: boolean, index: number): number {
  const load = (tunnelsAt(date, intraday) - TUNNEL_FLOOR) / TUNNEL_SWING
  const volatility = 1 + jitter(0x74a1, index, 0.5)
  return Math.max(38_000, (40_000 + 150_000 * load ** 1.35) * volatility)
}

export function threatsBlocked(density: Density): TimeSeriesSet {
  const samples = samplesFor(density)
  const values = samples.map((s, i) => Math.round(threatRateAt(s.date, s.intraday, i)))
  return {
    ...axisFor(density, samples),
    series: [{ label: 'Threats blocked', values }],
    unit: UNITS.threats,
    axisMax: axisCeiling(values, 50_000),
    stepSize: 50_000,
  }
}

/** Trackers and ads outweigh the rest by an order of magnitude — that ordering is the realistic part. */
export function threatsByCategory(density: Density): TimeSeriesSet {
  const samples = samplesFor(density)
  const perCategory = THREAT_CATEGORIES.map(() => [] as number[])

  samples.forEach((s, i) => {
    const total = threatRateAt(s.date, s.intraday, i)
    THREAT_CATEGORIES.forEach((c, k) =>
      perCategory[k].push(Math.round(total * c.share * (1 + jitter(0x74b0 + k, i, 0.16)))),
    )
  })

  const totals = samples.map((_, i) => perCategory.reduce((sum, v) => sum + v[i], 0))
  return {
    ...axisFor(density, samples),
    series: THREAT_CATEGORIES.map((c, i) => ({ label: c.label, values: perCategory[i] })),
    unit: UNITS.threats,
    axisMax: axisCeiling(totals, 50_000),
    stepSize: 50_000,
  }
}

/** Share of blocked threats over the whole visible window. */
export function threatShare(density: Density): CategorySet {
  const { series } = threatsByCategory(density)
  return {
    slices: series.map((s) => ({
      label: s.label,
      value: s.values.reduce((sum, v) => sum + v, 0),
    })),
    unit: UNITS.threats,
  }
}

export const GATEWAY_CAPACITY_LOAD_PCT = 85

/** Peak CPU load on the busiest gateway, 0–100. Crosses the 85% capacity line at weekday peaks. */
export function gatewayLoad(density: Density): TimeSeriesSet {
  const samples = samplesFor(density)
  const values = samples.map((s, i) => {
    const peak = bucketPeak(s, (date) => tunnelsAt(date, true))
    // Spread busy days either side of the 85% line — a chart where every bar breaches
    // teaches nothing about the threshold.
    return Math.max(0, Math.min(100, Math.round((peak / 9000) * 90 + jitter(0x10ad, i, 16))))
  })
  return {
    ...axisFor(density, samples),
    series: [{ label: 'Peak CPU load', values }],
    unit: UNITS.percent,
    axisMax: 100,
    stepSize: 25,
  }
}

/** Egress throughput in Gbps, tracking the connection count. */
export function throughput(density: Density): TimeSeriesSet {
  const samples = samplesFor(density)
  const values = samples.map((s, i) =>
    Math.round(((tunnelsAt(s.date, s.intraday) / 9000) * 48 + jitter(0x7871, i, 2.4)) * 10) / 10,
  )
  return {
    ...axisFor(density, samples),
    series: [{ label: 'Egress throughput', values }],
    unit: UNITS.gbps,
    axisMax: axisCeiling(values, 10),
    stepSize: 10,
  }
}

export const REDUNDANCY_FLOOR = 4

/** Healthy gateways. Integer, and the fleet never drops below the redundancy floor. */
export function gatewaysOnline(density: Density): TimeSeriesSet {
  const samples = samplesFor(density)
  const values = samples.map((_sample, i) =>
    Math.max(REDUNDANCY_FLOOR, Math.min(8, Math.round(7.4 + jitter(0x6a70, i, 2.6)))),
  )
  return {
    ...axisFor(density, samples),
    series: [{ label: 'Gateways online', values }],
    unit: UNITS.gateways,
    axisMax: 9,
    stepSize: 2,
  }
}

/** Failed authentications per day, with credential-stuffing spikes on scattered days. */
export function failedAuthAttempts(density: Density): TimeSeriesSet {
  const samples = samplesFor(density)
  const values = samples.map((s, i) => {
    const base = 240 + ((tunnelsAt(s.date, s.intraday) - TUNNEL_FLOOR) / TUNNEL_SWING) * 620
    const spike = i % 11 === 3 ? 4.8 : i % 17 === 9 ? 2.6 : 1
    return Math.round(Math.max(90, base * spike + jitter(0xfa11, i, 160)))
  })
  return {
    ...axisFor(density, samples),
    series: [{ label: 'Failed authentications', values }],
    unit: UNITS.attempts,
    axisMax: axisCeiling(values, 1000),
    stepSize: 1000,
  }
}

// ---------------------------------------------------------------------------- gateway fleet

export const SLA_UPTIME_PCT = 99.9

export interface GatewayStat {
  id: string
  capacityTunnels: number
  utilisationPct: number
  connections: number
  uptimePct: number
  throughputInGbps: number
  throughputOutGbps: number
}

const GATEWAY_SEED = [
  { id: 'fra-gw-01', capacityTunnels: 3200, utilisationPct: 78, uptimePct: 99.98 },
  { id: 'zrh-gw-02', capacityTunnels: 2400, utilisationPct: 71, uptimePct: 99.95 },
  { id: 'iad-gw-03', capacityTunnels: 2800, utilisationPct: 66, uptimePct: 99.87 },
  { id: 'sin-gw-04', capacityTunnels: 1800, utilisationPct: 52, uptimePct: 99.92 },
  { id: 'gru-gw-05', capacityTunnels: 1200, utilisationPct: 34, uptimePct: 99.71 },
] as const

/** The window nudges utilisation — a 90-day view averages out the peaks a 7-day view shows. */
function windowBias(density: Density): number {
  return density === 7 ? 1.06 : density === 30 ? 1 : 0.94
}

export function gatewayFleet(density: Density): GatewayStat[] {
  const bias = windowBias(density)
  return GATEWAY_SEED.map((g, i) => {
    const utilisationPct = Math.round(Math.min(98, g.utilisationPct * bias + jitter(0x6a01, i, 3)))
    const connections = Math.round((g.capacityTunnels * utilisationPct) / 100)
    const outGbps = Math.round((connections / 9000) * 48 * 10) / 10
    return {
      id: g.id,
      capacityTunnels: g.capacityTunnels,
      utilisationPct,
      connections,
      uptimePct: g.uptimePct,
      throughputInGbps: Math.round(outGbps * 0.42 * 10) / 10,
      throughputOutGbps: outGbps,
    }
  })
}

/** % of capacity in use per gateway. */
export function gatewayUtilisation(density: Density): CategorySet {
  return {
    slices: gatewayFleet(density).map((g) => ({ label: g.id, value: g.utilisationPct })),
    unit: UNITS.percent,
  }
}

/** Uptime per gateway against the contractual 99.9% SLA. */
export function uptimeVsSla(density: Density): CategorySet {
  return {
    slices: gatewayFleet(density).map((g) => ({ label: g.id, value: g.uptimePct })),
    unit: UNITS.percent,
  }
}

/** Ingress and egress per gateway, for a grouped comparison. */
export function throughputByGateway(density: Density): { gateways: string[]; inbound: number[]; outbound: number[]; unit: Unit } {
  const fleet = gatewayFleet(density)
  return {
    gateways: fleet.map((g) => g.id),
    inbound: fleet.map((g) => g.throughputInGbps),
    outbound: fleet.map((g) => g.throughputOutGbps),
    unit: UNITS.gbps,
  }
}

/** Tunnels per gateway, ranked. Folding the tail into "Other" is a chart-level decision. */
export function connectionsByGateway(density: Density): CategorySet {
  return {
    slices: gatewayFleet(density)
      .map((g) => ({ label: g.id, value: g.connections }))
      .sort((a, b) => b.value - a.value),
    unit: UNITS.tunnels,
  }
}

// ---------------------------------------------------------------------------- estate

const TEAMS = ['DEV', 'INFRA', 'MRKT', 'FIN', 'OPS'] as const
const TEAM_USAGE = [87, 64, 38, 29, 21]

/** % utilisation of each team's dedicated server. */
export function dedicatedServerUsage(density: Density): CategorySet {
  const bias = windowBias(density)
  return {
    slices: TEAMS.map((team, i) => ({
      label: `${team}-DS`,
      value: Math.round(Math.min(99, TEAM_USAGE[i] * bias + jitter(0xd501, i, 4))),
    })),
    unit: UNITS.percent,
  }
}

const PLATFORMS = [
  { label: 'Windows', count: 5240 },
  { label: 'macOS', count: 3110 },
  { label: 'iOS', count: 2480 },
  { label: 'Android', count: 1290 },
  { label: 'Linux', count: 420 },
] as const

/** Enrolled devices by platform. */
export function devicesByPlatform(density: Density): CategorySet {
  const bias = windowBias(density)
  return {
    slices: PLATFORMS.map((p, i) => ({
      label: p.label,
      value: Math.round(p.count * bias + jitter(0xde01, i, 90)),
    })),
    unit: UNITS.devices,
  }
}

const PROTOCOLS = [
  { label: 'WireGuard', share: 62 },
  { label: 'OpenVPN', share: 27 },
  { label: 'IKEv2', share: 11 },
] as const

/** Share of tunnel traffic carried by each protocol. */
export function trafficByProtocol(density: Density): CategorySet {
  const raw = PROTOCOLS.map((p, i) => Math.max(1, p.share + jitter(0x9401 + density, i, 4)))
  const total = raw.reduce((a, b) => a + b, 0)
  return {
    slices: PROTOCOLS.map((p, i) => ({
      label: p.label,
      value: Math.round((raw[i] / total) * 1000) / 10,
    })),
    unit: UNITS.percent,
  }
}

/** Licence seats: actively used, provisioned but idle, and never assigned. */
export function seatUtilisation(density: Density): CategorySet {
  const bias = windowBias(density)
  const inUse = Math.round(1840 * bias)
  const idle = Math.round(420 / bias)
  return {
    slices: [
      { label: 'In use', value: inUse },
      { label: 'Idle 30d+', value: idle },
      { label: 'Unassigned', value: 2500 - inUse - idle },
    ],
    unit: UNITS.licences,
  }
}
