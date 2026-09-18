import { useMemo } from 'react'
import {
  DARK_TONE_IS_DEFAULT,
  foundationGroups,
  multiPaletteLabels,
  THRESHOLD_OPACITY,
} from '../theme/tokens'
import { useThemeTokens } from '../theme/useThemeTokens'

function Swatch({ value, label, note }: { value: string; label: string; note?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div
        className="h-16 w-full rounded-lg border border-line"
        style={{ backgroundColor: value }}
      />
      <div className="flex flex-col gap-0.5">
        <span className="text-meta font-medium text-strong">{label}</span>
        <span className="text-meta uppercase tabular-nums text-muted">{value}</span>
        {note && <span className="text-meta text-muted opacity-70">{note}</span>}
      </div>
    </div>
  )
}

function Group({ name, caption, children }: { name: string; caption: string; children: React.ReactNode }) {
  return (
    <section className="themed flex flex-col gap-4 rounded-card border border-line bg-surface p-5">
      <div className="flex flex-col gap-1">
        <h3 className="text-title font-semibold text-strong">{name}</h3>
        <p className="text-meta text-muted">{caption}</p>
      </div>
      {children}
    </section>
  )
}

/** The whole token set, rendered live in whichever theme is active. */
export function Foundations() {
  const tokens = useThemeTokens()

  // Re-read on every theme change; `tokens` is the signal that the custom properties moved.
  const resolved = useMemo(() => {
    const style = getComputedStyle(document.documentElement)
    const read = (name: string) => style.getPropertyValue(name).trim()
    return foundationGroups.map((group) => ({
      ...group,
      swatches: group.swatches.map((swatch) => ({ ...swatch, value: read(swatch.varName) })),
    }))
  }, [tokens])

  const restingTone = DARK_TONE_IS_DEFAULT ? 'dark' : 'light'
  const hoverTone = DARK_TONE_IS_DEFAULT ? 'light' : 'dark'

  return (
    <div className="flex flex-col gap-4">
      <section className="themed flex flex-col gap-3 rounded-card border border-line bg-surface p-5">
        <h3 className="text-title font-semibold text-strong">Choosing a palette</h3>
        <p className="text-meta text-muted">
          Palette is a property of the scenario, never a user preference. Pick once, per chart, and
          state the reason in the caption.
        </p>
        <dl className="flex flex-col gap-2.5 text-meta">
          <div className="flex gap-3">
            <dt className="w-24 shrink-0 font-semibold uppercase tracking-wide text-strong">
              Categorical
            </dt>
            <dd className="text-muted">
              The chart compares peer entities and no value is better or worse than another —
              threat categories, device platforms, tunnel protocols, regions, gateways as peers.
              Colour marks identity. Reading a judgement into it would be a lie.
            </dd>
          </div>
          <div className="flex gap-3">
            <dt className="w-24 shrink-0 font-semibold uppercase tracking-wide text-strong">
              Signal
            </dt>
            <dd className="text-muted">
              The value itself carries a health judgement — gateway load against capacity, server
              and seat utilisation, uptime against the SLA, gateways against the redundancy floor.
              Colour is the alarm, so it is driven by the value, not by the series index.
            </dd>
          </div>
        </dl>
        <p className="text-meta text-muted opacity-70">
          Never mix the two inside one dataset. A dev-only console warning fires if a chart draws
          chromatic colours from both.
        </p>
      </section>

      <Group
        name="Multi-colour palette"
        caption={`Five categorical pairs. The ${restingTone} tone is the resting fill, the ${hoverTone} tone is hover — flip DARK_TONE_IS_DEFAULT in tokens.ts to swap them.`}
      >
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {tokens.multi.map((pair, index) => (
            <div key={multiPaletteLabels[index]} className="flex flex-col gap-3">
              <Swatch
                value={pair.dark}
                label={`${multiPaletteLabels[index]} · dark`}
                note={restingTone === 'dark' ? 'resting fill' : 'hover fill'}
              />
              <Swatch
                value={pair.light}
                label={`${multiPaletteLabels[index]} · light`}
                note={restingTone === 'dark' ? 'hover fill' : 'resting fill'}
              />
            </div>
          ))}
        </div>
      </Group>

      {resolved.map((group) => (
        <Group key={group.name} name={group.name} caption={group.caption}>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {group.swatches.map((swatch) => (
              <Swatch
                key={swatch.varName}
                value={swatch.value}
                label={swatch.label}
                note={
                  swatch.varName.includes('threshold')
                    ? `alert at ${Math.round(THRESHOLD_OPACITY * 100)}% — estimated`
                    : swatch.varName
                }
              />
            ))}
          </div>
        </Group>
      ))}

      <p className="text-meta text-muted">
        {tokens.name === 'dark'
          ? 'Dark values are derived, not designed — every one is marked PROVISIONAL in tokens.ts.'
          : 'Light values are sampled from the source design and are authoritative.'}
      </p>
    </div>
  )
}
