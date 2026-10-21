// Pointer gestures on the board: one mouse button or one finger draws. A second finger landing
// cancels the stroke (it becomes a pan / pinch in Task 6).
export type Cell = [number, number]

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

export interface StrokeHandlers {
  /** World cell under a point in canvas CSS pixels. */
  toCell(sx: number, sy: number): Cell
  start(cell: Cell): void
  move(cell: Cell): void
  end(): void
  /** Undo the stroke in progress. */
  cancel(): void
}

export function attachPointer(canvas: HTMLCanvasElement, handlers: StrokeHandlers): void {
  const down = new Set<number>()
  let drawing: number | undefined
  let last: Cell = [0, 0]

  canvas.addEventListener('pointerdown', (event) => {
    down.add(event.pointerId)
    if (down.size > 1) {
      if (drawing !== undefined) handlers.cancel()
      drawing = undefined
      return
    }
    if (event.button !== 0) return
    canvas.setPointerCapture(event.pointerId)
    drawing = event.pointerId
    last = handlers.toCell(event.offsetX, event.offsetY)
    handlers.start(last)
  })

  canvas.addEventListener('pointermove', (event) => {
    if (event.pointerId !== drawing) return
    const cell = handlers.toCell(event.offsetX, event.offsetY)
    // A fast drag skips cells between two events: fill the gap.
    for (const between of line(last, cell).slice(1)) handlers.move(between)
    last = cell
  })

  const release = (event: PointerEvent) => {
    down.delete(event.pointerId)
    if (event.pointerId !== drawing) return
    drawing = undefined
    if (event.type === 'pointercancel') handlers.cancel()
    else handlers.end()
  }
  canvas.addEventListener('pointerup', release)
  canvas.addEventListener('pointercancel', release)
}
