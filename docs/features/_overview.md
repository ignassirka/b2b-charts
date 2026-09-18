# Feature Overview

Living source of truth for this repository. Every code change updates the matching feature file.

## Feature Index

| Feature | File | Status |
| --- | --- | --- |
| Chart style playground | [chart-style-playground.md](./chart-style-playground.md) | Complete |

## Standard Feature Template

Every `/docs/features/[feature-name].md` uses exactly these sections, in this order:

```markdown
# [Feature Name]

## Purpose
## Key User Flows
## Data Model
## Components
## Routes
## State Management
## Event Log
## Dependencies on Shared Code
```

## Shared Architecture

### Stack

React 18.3 · TypeScript 5.6 · Vite 5.4 · Tailwind CSS 3.4 · chart.js 4.4 · react-chartjs-2 5.2 ·
chartjs-plugin-annotation 3.1 · chartjs-plugin-zoom 2.2. No component library, no router, no state
library.

### Design tokens

`src/theme/tokens.ts` is the single source of truth for colour. It is the **only** file in `src/`
permitted to contain a hex literal; `grep -rE "#[0-9A-Fa-f]{6}" src --exclude=tokens.ts` must return
nothing. Light values are sampled from Figma node `631-121546` and are authoritative. Dark values are
derived (hue held, lightness raised to clear 4.5:1 for text and 3:1 for graphics) and are each marked
`PROVISIONAL — pending design review`.

`DARK_TONE_IS_DEFAULT` inverts the resting/hover tone mapping of the categorical palette in one edit.
`THRESHOLD_OPACITY` is marked `ESTIMATED` — read off anti-aliased pixels, not a published value.

Alpha-derived colours (gridline, threshold rule, modal scrim) are precomputed in JS via `withAlpha()`
into a plain `rgba()` string per theme, rather than relying on a Tailwind opacity modifier like
`bg-strong/40` on a custom CSS-variable colour — Tailwind cannot apply an opacity suffix to a colour
defined as a raw `var(--x)` value (it silently emits no rule at all), so any new alpha-derived colour
must follow the `withAlpha` pattern in `tokens.ts` and get its own CSS variable + Tailwind colour
entry, never a `/NN` suffix on `strong`, `muted`, etc.

### Theming

`tokens.ts` generates a `:root` + `[data-theme="dark"]` stylesheet, injected once at module load.
`ThemeProvider` (in `src/theme/useThemeTokens.ts`) writes `data-theme` on `documentElement`;
`useThemeTokens()` resolves the custom properties into concrete strings for Chart.js, which cannot
read CSS variables from a canvas. Tailwind colour utilities map to the same variables via
`tailwind.config.js`, so no stylesheet carries a literal colour either.

### Palette roles

`PaletteRole` is `'categorical' | 'signal'` and is a property of the scenario, never a user setting.
Categorical means the chart compares peer entities and colour marks identity only; signal means the
value itself carries a health judgement, so colour is derived from the value rather than the series
index. Every variant declares one; it drives colour choice and the caption says why, but is no
longer shown as a UI badge on the card or in the inspector.
`warnOnMixedPalette` logs a dev-only warning if one dataset draws chromatic colours from both.

### Chart conventions

- `src/charts/registerChartDefaults.ts` registers controllers, elements, scales, the annotation and
  zoom plugins and the custom plugins exactly once. The built-in Tooltip is deliberately **not**
  registered.
- Every chart renders with `updateMode={UPDATE_MODE}`, a private transition named `restyle`.
  It must **not** be Chart.js' built-in `active` mode: that name means "resolve hover options", which
  silently applies `hoverRadius` and friends to every element. Chart.js runs the entry animation only
  in `default` mode, so post-mount updates recolour without replaying it, at the shared 150ms ease-out.
- Charts take `size: 'card' | 'fullscreen'`, which scales font, legend, padding, tick density and
  point radius. A variant is never forked into a second fullscreen copy.
- Zoom state lives in React (`useZoomWindow`) and is fed back through the axis config, because
  react-chartjs-2 replaces `chart.options` on every render and would otherwise discard it.
- Shared option builders live in `src/charts/chartOptions.ts`; per-family shells are `DonutBase`,
  `BarBase` and `LineBase`. Individual variants stay thin (15–50 lines each).
- Custom Chart.js plugins live in `src/charts/plugins.ts` with matching `PluginOptionsByType`
  module augmentation.

### Fullscreen inspection

`useChartExpand()` plus `<ChartModal>` give every variant expansion for free. `VariantCard` passes
the same variant config it already renders into the modal, provides a second chart sink so the
inspector can read the live data, and scopes the contextual controls with that variant's
`unsupported` map. Adding a variant to the registry is all that is required.

### Motion

Entry animations are 600–800ms ease-out with a 60ms stagger per card. `prefers-reduced-motion: reduce`
skips to the final frame everywhere. Replay is implemented by remounting a card via a React `key`
derived from `controls.replayToken`; theme changes never touch that key.
