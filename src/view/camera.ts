// Camera: which world cell sits at the top-left of the screen, and how many CSS pixels a cell
// takes. Pure functions only, so the maths is tested without a canvas.
export interface Camera {
  x: number
  y: number
  zoom: number
}

export const MIN_ZOOM = 2
export const MAX_ZOOM = 64
export const DEFAULT_ZOOM = 16
// Empty cells kept around a pattern when framing it.
const MARGIN = 2

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

export const screenToWorld = (c: Camera, sx: number, sy: number): [number, number] => [
  c.x + sx / c.zoom,
  c.y + sy / c.zoom,
]

export const worldToScreen = (c: Camera, wx: number, wy: number): [number, number] => [
  (wx - c.x) * c.zoom,
  (wy - c.y) * c.zoom,
]

export const pan = (c: Camera, dx: number, dy: number): Camera => ({
  x: c.x - dx / c.zoom,
  y: c.y - dy / c.zoom,
  zoom: c.zoom,
})

export function zoomAt(c: Camera, sx: number, sy: number, zoom: number): Camera {
  const [wx, wy] = screenToWorld(c, sx, sy)
  const next = clamp(zoom, MIN_ZOOM, MAX_ZOOM)
  return { x: wx - sx / next, y: wy - sy / next, zoom: next }
}

/** Frames every cell, never zooming in past the default; the origin when there are none. */
export function fit(cells: Iterable<[number, number]>, width: number, height: number): Camera {
  let [minX, minY, maxX, maxY] = [Infinity, Infinity, -Infinity, -Infinity]
  for (const [x, y] of cells) {
    minX = Math.min(minX, x)
    minY = Math.min(minY, y)
    maxX = Math.max(maxX, x)
    maxY = Math.max(maxY, y)
  }
  if (minX === Infinity) [minX, minY, maxX, maxY] = [0, 0, 0, 0]
  const w = maxX - minX + 1 + 2 * MARGIN
  const h = maxY - minY + 1 + 2 * MARGIN
  const zoom = clamp(Math.min(width / w, height / h), MIN_ZOOM, DEFAULT_ZOOM)
  // Centre the box's middle on the screen's middle.
  return {
    x: (minX + maxX + 1) / 2 - width / 2 / zoom,
    y: (minY + maxY + 1) / 2 - height / 2 / zoom,
    zoom,
  }
}
