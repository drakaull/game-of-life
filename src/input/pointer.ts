// Pointer gestures on the board, without any mode button:
// - left button or one finger draws;
// - Space held + drag, or middle-button drag, pans;
// - two fingers pan and pinch-zoom (a second finger cancels the stroke in progress);
// - the wheel zooms around the pointer.
export type Cell = [number, number]
type Point = [number, number]

/** Cells from `from` to `to`, ends included, each touching the previous one (Bresenham). */
export function line([x0, y0]: Cell, [x1, y1]: Cell): Cell[] {
  const [dx, dy] = [Math.abs(x1 - x0), -Math.abs(y1 - y0)]
  const [sx, sy] = [Math.sign(x1 - x0), Math.sign(y1 - y0)]
  const cells: Cell[] = [[x0, y0]]
  let error = dx + dy
  while (x0 !== x1 || y0 !== y1) {
    const twice = 2 * error
    if (twice >= dy) {
      error += dy
      x0 += sx
    }
    if (twice <= dx) {
      error += dx
      y0 += sy
    }
    cells.push([x0, y0])
  }
  return cells
}

export interface BoardHandlers {
  /** World cell under a point in canvas CSS pixels. */
  toCell(sx: number, sy: number): Cell
  start(cell: Cell): void
  move(cell: Cell): void
  end(): void
  /** Undo the stroke in progress. */
  cancel(): void
  pan(dx: number, dy: number): void
  /** Multiply the zoom by `factor`, keeping the point (sx, sy) still. */
  zoom(sx: number, sy: number, factor: number): void
}

const midpoint = ([ax, ay]: Point, [bx, by]: Point): Point => [(ax + bx) / 2, (ay + by) / 2]
const distance = ([ax, ay]: Point, [bx, by]: Point) => Math.hypot(bx - ax, by - ay)

export function attachPointer(canvas: HTMLCanvasElement, handlers: BoardHandlers): void {
  const points = new Map<number, Point>()
  let mode: 'draw' | 'pan' | 'pinch' | undefined
  let last: Cell = [0, 0]
  let spaceHeld = false

  addEventListener('keydown', (event) => {
    if (event.code === 'Space') spaceHeld = true
    canvas.classList.toggle('can-pan', spaceHeld)
  })
  addEventListener('keyup', (event) => {
    if (event.code === 'Space') spaceHeld = false
    canvas.classList.toggle('can-pan', spaceHeld)
  })
  // Leaving the window while holding Space never delivers its keyup.
  addEventListener('blur', () => {
    spaceHeld = false
    canvas.classList.remove('can-pan')
  })
  // Middle click would otherwise start the browser's autoscroll.
  canvas.addEventListener('mousedown', (event) => event.button === 1 && event.preventDefault())

  canvas.addEventListener('pointerdown', (event) => {
    points.set(event.pointerId, [event.offsetX, event.offsetY])
    if (points.size === 2 && event.pointerType === 'touch') {
      if (mode === 'draw') handlers.cancel()
      mode = 'pinch'
      return
    }
    if (points.size > 1) return
    canvas.setPointerCapture(event.pointerId)
    if (event.button === 1 || (event.button === 0 && spaceHeld)) {
      mode = 'pan'
      canvas.classList.add('panning')
    } else if (event.button === 0) {
      mode = 'draw'
      last = handlers.toCell(event.offsetX, event.offsetY)
      handlers.start(last)
    }
  })

  canvas.addEventListener('pointermove', (event) => {
    const before = points.get(event.pointerId)
    if (!before) return
    const now: Point = [event.offsetX, event.offsetY]
    if (mode === 'draw') {
      const cell = handlers.toCell(...now)
      // A fast drag skips cells between two events: fill the gap.
      for (const between of line(last, cell).slice(1)) handlers.move(between)
      last = cell
    } else if (mode === 'pan') {
      handlers.pan(now[0] - before[0], now[1] - before[1])
    } else if (mode === 'pinch') {
      const other = [...points].find(([id]) => id !== event.pointerId)?.[1]
      if (other) {
        const [from, to] = [midpoint(before, other), midpoint(now, other)]
        handlers.pan(to[0] - from[0], to[1] - from[1])
        handlers.zoom(...to, distance(now, other) / Math.max(1, distance(before, other)))
      }
    }
    points.set(event.pointerId, now)
  })

  const release = (event: PointerEvent) => {
    if (!points.delete(event.pointerId)) return
    if (mode === 'draw') {
      if (event.type === 'pointercancel') handlers.cancel()
      else handlers.end()
    }
    // After a pinch, the finger left on the screen does nothing until it is lifted too.
    if (mode !== 'pinch' || points.size === 0) mode = undefined
    canvas.classList.remove('panning')
  }
  canvas.addEventListener('pointerup', release)
  canvas.addEventListener('pointercancel', release)

  canvas.addEventListener(
    'wheel',
    (event) => {
      // Also stops the browser's own page zoom on a trackpad pinch (ctrl + wheel).
      event.preventDefault()
      const pixels =
        event.deltaMode === WheelEvent.DOM_DELTA_LINE ? event.deltaY * 16 : event.deltaY
      handlers.zoom(event.offsetX, event.offsetY, Math.exp(-pixels * 0.002))
    },
    { passive: false },
  )
}
