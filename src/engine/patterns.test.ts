import { describe, expect, it } from 'vitest'
import { pack, step, unpack } from './life.ts'
import { PATTERNS, patternCells, stamp, type PatternId } from './patterns.ts'

const board = (id: PatternId) => new Set(patternCells(id).map(([x, y]) => pack(x, y)))
const run = (cells: Set<number>, generations: number) => {
  for (let i = 0; i < generations; i++) cells = step(cells)
  return cells
}
// The shape alone, moved to the origin, so two positions of a spaceship compare equal.
const shape = (cells: Set<number>) => {
  const points = [...cells].map(unpack)
  const [minX, minY] = [Math.min(...points.map(([x]) => x)), Math.min(...points.map(([, y]) => y))]
  return points.map(([x, y]) => `${x - minX},${y - minY}`).sort()
}
const corner = (cells: Set<number>) => {
  const points = [...cells].map(unpack)
  return [Math.min(...points.map(([x]) => x)), Math.min(...points.map(([, y]) => y))]
}

describe('the pattern list', () => {
  it('has 17 patterns in 4 families, each with cells', () => {
    expect(PATTERNS).toHaveLength(17)
    expect(new Set(PATTERNS.map((p) => p.family)).size).toBe(4)
    for (const { id } of PATTERNS) expect(patternCells(id).length).toBeGreaterThan(0)
  })
})

describe('still lifes', () => {
  it.each(['block', 'beehive', 'loaf', 'boat'] as const)('%s never changes', (id) => {
    expect(shape(step(board(id)))).toEqual(shape(board(id)))
  })
})

describe('oscillators', () => {
  it.each([
    ['blinker', 2],
    ['toad', 2],
    ['beacon', 2],
    ['pulsar', 3],
    ['pentadecathlon', 15],
  ] as const)('%s comes back after exactly %i generations', (id, period) => {
    const start = board(id)
    for (let g = 1; g < period; g++) expect(shape(run(start, g))).not.toEqual(shape(start))
    const back = run(start, period)
    expect(shape(back)).toEqual(shape(start))
    expect(corner(back)).toEqual(corner(start))
  })
})

describe('spaceships', () => {
  it('the glider moves one cell diagonally every 4 generations', () => {
    const [start, end] = [board('glider'), run(board('glider'), 4)]
    expect(shape(end)).toEqual(shape(start))
    const [[x0, y0], [x1, y1]] = [corner(start), corner(end)]
    expect([Math.abs(x1! - x0!), Math.abs(y1! - y0!)]).toEqual([1, 1])
  })

  it.each(['lwss', 'mwss', 'hwss'] as const)(
    '%s moves two cells straight every 4 generations',
    (id) => {
      const [start, end] = [board(id), run(board(id), 4)]
      expect(shape(end)).toEqual(shape(start))
      const [[x0, y0], [x1, y1]] = [corner(start), corner(end)]
      expect(Math.abs(x1! - x0!) + Math.abs(y1! - y0!)).toBe(2)
      expect(x1 === x0 || y1 === y0).toBe(true)
    },
  )
})

describe('guns and methuselahs', () => {
  it('the Gosper gun has 36 cells and adds one glider every 30 generations', () => {
    expect(patternCells('gosperGun')).toHaveLength(36)
    const [a, b, c] = [60, 90, 120].map((g) => run(board('gosperGun'), g).size)
    expect([b! - a!, c! - b!]).toEqual([5, 5])
  })

  it('the diehard vanishes at generation 130', () => {
    const before = run(board('diehard'), 129)
    expect(before.size).toBeGreaterThan(0)
    expect(step(before).size).toBe(0)
  })

  it('the R-pentomino settles at generation 1103 with 116 cells', () => {
    const settled = run(board('rPentomino'), 1103)
    expect(settled.size).toBe(116)
    expect(run(settled, 2).size).toBe(116)
  })

  it('the acorn settles at generation 5206 with 633 cells', () => {
    const settled = run(board('acorn'), 5206)
    expect(settled.size).toBe(633)
    expect(run(settled, 2).size).toBe(633)
  }, 30_000)
})

describe('stamp', () => {
  it('adds the pattern centred on the target cell and keeps existing cells', () => {
    const existing = pack(100, 100)
    const next = stamp(new Set([existing]), patternCells('blinker'), 10, 20)
    expect(next.has(existing)).toBe(true)
    expect([9, 10, 11].every((x) => next.has(pack(x, 20)))).toBe(true)
    expect(next.size).toBe(4)
  })

  it('does not change the board it is given', () => {
    const cells = new Set([pack(0, 0)])
    stamp(cells, patternCells('block'), 5, 5)
    expect(cells.size).toBe(1)
  })
})
