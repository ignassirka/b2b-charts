/**
 * Contract → DOM chrome.
 *
 * A direction that only restyled the canvas would be a failed direction, so the card, tab bar,
 * control panel, tooltip and modal all read their surface, border, radius, shadow, padding and
 * type from the same `ChartDirection` the charts use.
 *
 * Colour rule: every value here resolves to a token through `tokens` or `tokenValue`. There are
 * no colour literals — shadows and translucency are alphas over token colours.
 */

import type { CSSProperties } from 'react'
import { FONT_STACKS, tokenValue } from '../charts/directionStyle'
import type { CardChromeSpec, ChartDirection } from './directions'
import type { ThemeTokens } from './useThemeTokens'

function shadowFor(shadow: CardChromeSpec['shadow'], tokens: ThemeTokens): string {
  const ink = (alpha: number) => tokens.dim(tokens.textStrong, alpha)
  switch (shadow) {
    case 'none':
      return 'none'
    case 'hairline':
      return `0 1px 2px ${ink(0.06)}`
    case 'soft':
      return `0 18px 44px -12px ${ink(0.16)}, 0 4px 12px -6px ${ink(0.08)}`
    case 'layered':
      return [
        `0 1px 1px ${ink(0.05)}`,
        `0 4px 8px -2px ${ink(0.08)}`,
        `0 16px 24px -8px ${ink(0.12)}`,
        `0 32px 56px -16px ${ink(0.16)}`,
      ].join(', ')
  }
}

function surfaceFor(card: CardChromeSpec, tokens: ThemeTokens): CSSProperties {
  switch (card.surface) {
    case 'solid':
      return { backgroundColor: tokens.cardSurface }
    case 'raised':
      return { backgroundColor: tokens.cardSurfaceRaised }
    case 'page':
      return { backgroundColor: tokens.pageBg }
    case 'translucent':
      // The page shows through the card, which is the whole point of the glass direction.
      return {
        backgroundColor: tokens.dim(tokens.cardSurface, card.surfaceAlpha),
        backdropFilter: 'blur(10px)',
      }
  }
}

/** The variant card itself. */
export function cardStyle(direction: ChartDirection, tokens: ThemeTokens): CSSProperties {
  const { card } = direction
  return {
    ...surfaceFor(card, tokens),
    borderRadius: card.radius,
    borderWidth: card.borderStyle === 'none' ? 0 : card.borderWidth,
    borderStyle: card.borderStyle === 'none' ? 'none' : 'solid',
    borderColor: tokenValue(card.borderToken, tokens),
    boxShadow: shadowFor(card.shadow, tokens),
    padding: card.padding,
    gap: card.gap,
  }
}

/** Header row layout: inline, stacked above the plot, or sharing a baseline with the button. */
export function cardHeaderStyle(direction: ChartDirection): CSSProperties {
  const layout = direction.card.headerLayout
  return {
    display: 'flex',
    flexDirection: layout === 'stacked' ? 'column' : 'row',
    alignItems: layout === 'inline' ? 'center' : layout === 'baseline' ? 'flex-end' : 'stretch',
    gap: layout === 'stacked' ? 8 : 12,
  }
}

export function cardTitleStyle(direction: ChartDirection, tokens: ThemeTokens): CSSProperties {
  const { card } = direction
  return {
    fontFamily: FONT_STACKS[card.titleFont],
    fontSize: card.titleSize,
    fontWeight: card.titleWeight,
    letterSpacing: `${card.titleTracking}em`,
    textTransform: card.titleCase === 'upper' ? 'uppercase' : 'none',
    color: tokenValue(card.titleToken, tokens),
    lineHeight: 1.25,
  }
}

export function expandButtonStyle(direction: ChartDirection, tokens: ThemeTokens): CSSProperties {
  const style = direction.card.expandButton
  const base: CSSProperties = {
    color: tokens.textMuted,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6px 8px',
    borderStyle: 'solid',
    borderColor: tokens.cardBorder,
  }
  switch (style) {
    case 'bordered':
      return { ...base, borderWidth: 1, borderRadius: 6 }
    case 'ghost':
      return { ...base, borderWidth: 0, borderRadius: direction.card.radius / 2 }
    case 'square':
      return {
        ...base,
        borderWidth: 2,
        borderRadius: 0,
        borderColor: tokenValue('seriesNeutral', tokens),
      }
    case 'heavy':
      return { ...base, borderWidth: 2, borderRadius: 4 }
  }
}

/** Rule under the card header, when the direction draws one. */
export function dividerStyle(
  direction: ChartDirection,
  tokens: ThemeTokens,
): CSSProperties | null {
  const divider = direction.card.divider
  if (divider === 'none') return null
  return {
    height: divider === 'heavy' ? 2 : 1,
    backgroundColor:
      divider === 'heavy' ? tokenValue('seriesNeutral', tokens) : tokens.cardBorder,
  }
}

/** Control panel rail, modal inspector column and mobile drawer. */
export function panelStyle(direction: ChartDirection, tokens: ThemeTokens): CSSProperties {
  const { card } = direction
  return {
    ...surfaceFor(card.surface === 'page' ? { ...card, surface: 'solid' } : card, tokens),
    borderColor: tokenValue(card.borderToken, tokens),
    borderRightWidth: 0,
    borderLeftWidth: Math.max(1, card.borderWidth),
    borderStyle: 'solid',
    borderTopWidth: 0,
    borderBottomWidth: 0,
  }
}

export function panelLabelStyle(direction: ChartDirection, tokens: ThemeTokens): CSSProperties {
  return {
    fontFamily: FONT_STACKS[direction.type.fontStack],
    letterSpacing: `${Math.max(direction.type.tracking, 0.04)}em`,
    textTransform: direction.type.upperCase ? 'uppercase' : 'none',
    color: tokens.textMuted,
  }
}

/** Segmented controls and buttons inside the rail pick up the direction's geometry. */
export function controlStyle(direction: ChartDirection, tokens: ThemeTokens): CSSProperties {
  return {
    borderRadius: Math.min(8, direction.card.radius / 2),
    borderWidth: Math.max(1, direction.card.borderWidth - 0.5),
    borderStyle: 'solid',
    borderColor: tokens.cardBorder,
    fontFamily: FONT_STACKS[direction.type.fontStack],
  }
}

export function tabBarStyle(direction: ChartDirection, tokens: ThemeTokens): CSSProperties {
  const { card } = direction
  return {
    borderRadius: Math.min(12, card.radius),
    borderWidth: card.borderStyle === 'none' ? 1 : card.borderWidth,
    borderStyle: 'solid',
    borderColor: tokenValue(card.borderToken, tokens),
    backgroundColor: tokens.pageBg,
    padding: 4,
    gap: 4,
  }
}

export function tabStyle(
  direction: ChartDirection,
  tokens: ThemeTokens,
  selected: boolean,
): CSSProperties {
  const { card, type } = direction
  return {
    borderRadius: Math.max(0, Math.min(8, card.radius - 4)),
    fontFamily: FONT_STACKS[type.fontStack],
    letterSpacing: `${type.tracking}em`,
    textTransform: type.upperCase ? 'uppercase' : 'none',
    fontWeight: selected ? Math.max(500, type.weight) : type.weight,
    backgroundColor: selected ? tokens.cardSurface : 'transparent',
    color: selected ? tokens.textStrong : tokens.textMuted,
    boxShadow: selected ? shadowFor(card.shadow === 'none' ? 'hairline' : card.shadow, tokens) : 'none',
  }
}

/** The HTML tooltip: shape, border, shadow, blur backdrop and density all come from the contract. */
export function tooltipStyle(direction: ChartDirection, tokens: ThemeTokens): CSSProperties {
  const { tooltip, type } = direction
  const radius = tooltip.shape === 'square' ? 0 : tooltip.shape === 'pill' ? 999 : 8
  const border =
    tooltip.border === 'none'
      ? { borderWidth: 0 }
      : {
          borderWidth: tooltip.border === 'heavy' ? 2 : 1,
          borderColor:
            tooltip.border === 'heavy' ? tokenValue('seriesNeutral', tokens) : tokens.cardBorder,
        }
  return {
    backgroundColor:
      tooltip.backdrop === 'blur'
        ? tokens.dim(tokens.cardSurfaceRaised, 0.82)
        : tokens.cardSurfaceRaised,
    backdropFilter: tooltip.backdrop === 'blur' ? 'blur(8px)' : undefined,
    borderRadius: radius,
    borderStyle: 'solid',
    ...border,
    boxShadow: shadowFor(tooltip.shadow, tokens),
    padding: tooltip.density === 'compact' ? '5px 8px' : '8px 10px',
    fontFamily: FONT_STACKS[type.fontStack],
    fontVariantNumeric: tooltip.numerals === 'tabular' ? 'tabular-nums' : 'normal',
  }
}

/** Little triangle under a tooltip, for the one direction that asks for it. */
export function tooltipArrowStyle(
  direction: ChartDirection,
  tokens: ThemeTokens,
): CSSProperties | null {
  if (!direction.tooltip.arrow) return null
  return {
    position: 'absolute',
    left: '50%',
    bottom: -4,
    width: 8,
    height: 8,
    marginLeft: -4,
    transform: 'rotate(45deg)',
    backgroundColor: tokens.cardSurfaceRaised,
    borderRight: `1px solid ${tokens.cardBorder}`,
    borderBottom: `1px solid ${tokens.cardBorder}`,
  }
}

export function modalPanelStyle(direction: ChartDirection, tokens: ThemeTokens): CSSProperties {
  const { card } = direction
  return {
    ...surfaceFor(card.surface === 'page' ? { ...card, surface: 'solid' } : card, tokens),
    borderRadius: card.radius,
    borderWidth: card.borderStyle === 'none' ? 1 : card.borderWidth,
    borderStyle: 'solid',
    borderColor: tokenValue(card.borderToken, tokens),
    boxShadow: shadowFor(card.shadow === 'none' ? 'soft' : card.shadow, tokens),
  }
}

/** Swatch shape in a legend or a compare-mode caption. */
export function swatchStyle(direction: ChartDirection, color: string): CSSProperties {
  const shape = direction.labelling.legendShape
  return {
    backgroundColor: color,
    borderRadius: shape === 'dot' ? 999 : shape === 'square-block' ? 0 : 2,
    width: shape === 'square-block' ? 10 : 8,
    height: shape === 'square-block' ? 10 : 8,
  }
}
