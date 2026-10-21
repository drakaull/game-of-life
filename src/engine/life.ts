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

// Above this many grid cells per live cell, a dense grid would be mostly empty: count in a Map.
const DENSE_RATIO = 64
const ALIVE = 16 // flag next to the neighbour count (0–8) in the dense grid

export function step(cells: ReadonlySet<number>): Set<number> {
  if (cells.size === 0) return new Set()
  const xs = new Int32Array(cells.size)
  const ys = new Int32Array(cells.size)
  let [minX, minY, maxX, maxY] = [MAX, MAX, MIN, MIN]
  let i = 0
  for (const cell of cells) {
    const [x, y] = unpack(cell)
    xs[i] = x
    ys[i++] = y
    minX = Math.min(minX, x)
    minY = Math.min(minY, y)
    maxX = Math.max(maxX, x)
    maxY = Math.max(maxY, y)
  }
  // One spare column and row on each side, for births around the pattern.
  const [width, height] = [maxX - minX + 3, maxY - minY + 3]
  return width * height <= DENSE_RATIO * cells.size
    ? stepDense(xs, ys, minX - 1, minY - 1, width, height)
    : stepSparse(cells)
}

/** Counts neighbours in a flat grid covering the pattern's bounding box: fast on compact soups. */
function stepDense(
  xs: Int32Array,
  ys: Int32Array,
  left: number,
  top: number,
  width: number,
  height: number,
): Set<number> {
  const grid = new Uint8Array(width * height) // column after column
  const h = height
  const around = [-h - 1, -h, -h + 1, -1, 1, h - 1, h, h + 1]
  for (let i = 0; i < xs.length; i++) {
    const at = (xs[i]! - left) * h + (ys[i]! - top)
    grid[at] = grid[at]! | ALIVE
    for (const offset of around) grid[at + offset] = grid[at + offset]! + 1
  }
  const next = new Set<number>()
  for (let col = 0; col < width; col++) {
    for (let row = 0; row < height; row++) {
      const value = grid[col * h + row]!
      const count = value & 15
      if (count === 3 || (count === 2 && value & ALIVE)) {
        const [x, y] = [left + col, top + row]
        if (inBounds(x, y)) next.add(pack(x, y))
      }
    }
  }
  return next
}

/** Counts neighbours in a Map keyed by cell: fast when patterns are spread far apart. */
function stepSparse(cells: ReadonlySet<number>): Set<number> {
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
