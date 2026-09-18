/**
 * Number formatting, split out so both the option builders and the direction translators can
 * use it without importing each other.
 */

import type { Unit } from '../data/mockData'

/** Locale-independent, so two runs never disagree about a separator. */
export function formatNumber(value: number): string {
  const rounded = Math.round(value)
  const sign = rounded < 0 ? '-' : ''
  return sign + String(Math.abs(rounded)).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function trim(value: number, places: number): string {
  const factor = 10 ** places
  return String(Math.round(value * factor) / factor)
}

/** Full precision with the unit spelled out — tooltips and the inspector table. */
export function formatValue(value: number, unit: Unit): string {
  switch (unit.format) {
    case 'percent':
      return `${trim(value, 2)}%`
    case 'gbps':
      return `${trim(value, 1)} Gbps`
    case 'ms':
      return `${Math.round(value)} ms`
    case 'count':
      return `${formatNumber(value)} ${unit.label}`
  }
}

/** Compact form for axis ticks. */
export function formatAxisValue(value: number, unit: Unit): string {
  switch (unit.format) {
    case 'percent':
      return `${trim(value, 1)}%`
    case 'gbps':
      return trim(value, 0)
    case 'ms':
      return String(Math.round(value))
    case 'count':
      return Math.abs(value) >= 1000 ? `${trim(value / 1000, 1)}k` : formatNumber(value)
  }
}

/** Percent carries its symbol inline; every other unit is named once, on the axis. */
export function axisTitleFor(unit: Unit): string | undefined {
  return unit.format === 'percent' ? undefined : unit.label
}
