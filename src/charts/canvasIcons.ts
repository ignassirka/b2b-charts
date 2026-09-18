/**
 * Canvas-drawn pictograms for places Chart.js renders text directly onto the canvas (axis
 * ticks), where a DOM `<svg>` isn't an option. Colours are fixed rather than themed — this is a
 * small literal icon, not a data colour, so it is exempt from the tokens-only rule in
 * `src/theme/tokens.ts`.
 */

const RACK_UNIT = '#CBC7C3'
const PORT_BLOCK = '#FFFFFF'
const RISER = '#999693'

/**
 * A two-unit rack glyph representing a gateway appliance: two stacked slot bars, each with a
 * port block on the left, a status LED on the top unit, and a riser connecting the two.
 * Drawn at `(x, y)` with `y` vertically centred on the icon (matching a Chart.js tick's `y`),
 * scaled from its native 30×20 viewBox to `width` px wide.
 */
export function drawGatewayIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
): void {
  const scale = width / 30
  const height = 20 * scale

  ctx.save()
  ctx.translate(x, y - height / 2)
  ctx.scale(scale, scale)

  ctx.fillStyle = RACK_UNIT
  ctx.beginPath()
  ctx.roundRect(0, 11, 30, 9, 2)
  ctx.fill()
  ctx.beginPath()
  ctx.roundRect(0, 0, 30, 9, 2)
  ctx.fill()

  ctx.fillStyle = PORT_BLOCK
  ctx.beginPath()
  ctx.roundRect(3, 14, 8.5, 3, 1.5)
  ctx.fill()
  ctx.beginPath()
  ctx.roundRect(3, 3, 8.5, 3, 1.5)
  ctx.fill()
  ctx.beginPath()
  ctx.roundRect(24, 3, 3, 3, 1.5)
  ctx.fill()

  ctx.fillStyle = RISER
  ctx.fillRect(3, 9, 24, 2)

  ctx.restore()
}

/** Native aspect ratio of the gateway glyph — height for a given rendered width. */
export const GATEWAY_ICON_ASPECT = 20 / 30
