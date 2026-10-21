import { unpack } from '../engine/life.ts'
import type { Camera } from './camera.ts'

// Below this many CSS pixels per cell the grid lines would turn the board into noise.
const GRID_MIN_ZOOM = 8

/** Draws the board in CSS pixels; the context is already scaled by devicePixelRatio. */
export function render(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  cells: ReadonlySet<number>,
  width: number,
  height: number,
): void {
  const style = getComputedStyle(document.documentElement)
  const dpr = devicePixelRatio
  // Snap to device pixels so lines and cell edges stay sharp.
  const snap = (v: number) => Math.round(v * dpr) / dpr
  const line = 1 / dpr
  const { x, y, zoom } = camera

  ctx.fillStyle = style.getPropertyValue('--color-bg')
  ctx.fillRect(0, 0, width, height)

  const grid = zoom >= GRID_MIN_ZOOM
  if (grid) {
    ctx.fillStyle = style.getPropertyValue('--color-grid')
    for (let gx = Math.ceil(x); gx < x + width / zoom; gx++) {
      ctx.fillRect(snap((gx - x) * zoom), 0, line, height)
    }
    for (let gy = Math.ceil(y); gy < y + height / zoom; gy++) {
      ctx.fillRect(0, snap((gy - y) * zoom), width, line)
    }
  }

  ctx.fillStyle = style.getPropertyValue('--color-accent')
  const gap = grid ? line : 0
  for (const cell of cells) {
    const [cx, cy] = unpack(cell)
    const left = snap((cx - x) * zoom)
    const top = snap((cy - y) * zoom)
    if (left + zoom < 0 || top + zoom < 0 || left > width || top > height) continue
    ctx.fillRect(
      left + gap,
      top + gap,
      snap((cx + 1 - x) * zoom) - left - gap,
      snap((cy + 1 - y) * zoom) - top - gap,
    )
  }
}
