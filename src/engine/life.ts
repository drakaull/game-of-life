// Conway's Game of Life (B3/S23) on a bounded "infinite" board.
// A cell (x, y) is packed into one safe integer so live cells fit in a Set<number>.
export const MIN = -(2 ** 20)
export const MAX = 2 ** 20 - 1
const SPAN = 2 ** 21

export const inBounds = (x: number, y: number): boolean =>
  x >= MIN && x <= MAX && y >= MIN && y <= MAX

// The caller must check inBounds first: out-of-range coordinates would alias another cell.
export const pack = (x: number, y: number): number => (x - MIN) * SPAN + (y - MIN)

export const unpack = (cell: number): [number, number] => [
  Math.floor(cell / SPAN) + MIN,
  (cell % SPAN) + MIN,
]

export function step(cells: ReadonlySet<number>): Set<number> {
  const counts = new Map<number, number>()
  for (const cell of cells) {
    const [x, y] = unpack(cell)
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if ((dx || dy) && inBounds(x + dx, y + dy)) {
          const neighbour = cell + dx * SPAN + dy
          counts.set(neighbour, (counts.get(neighbour) ?? 0) + 1)
        }
      }
    }
  }
  const next = new Set<number>()
  for (const [cell, count] of counts) {
    if (count === 3 || (count === 2 && cells.has(cell))) next.add(cell)
  }
  return next
}
