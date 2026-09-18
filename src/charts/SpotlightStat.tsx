import type { ChartSize } from './chartOptions'

interface SpotlightStatProps {
  /** Pre-formatted, unit-suffix stripped — see `spotlightNumber` in chartOptions.ts. */
  value: string
  /** Short phrase supplying the context the bare number can't: what it is, and its unit. */
  label: string
  size: ChartSize
}

/**
 * One large number above the plot, so the card reads at a glance before anyone studies the axes.
 * Shared by all three chart families — each variant supplies only the raw value and a caption via
 * its `spotlightValue` / `spotlightLabel` props; the surrounding shell formats and gates it on the
 * "Spotlight number" global control.
 */
export function SpotlightStat({ value, label, size }: SpotlightStatProps) {
  return (
    <div className="flex flex-col gap-0.5 pb-1">
      <span
        className={`font-bold leading-none tabular-nums text-strong ${
          size === 'fullscreen' ? 'text-[34px]' : 'text-[26px]'
        }`}
      >
        {value}
      </span>
      <span className="text-meta text-muted">{label}</span>
    </div>
  )
}
