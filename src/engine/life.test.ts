import { describe, expect, it } from 'vitest'
import { MAX, MIN, inBounds, pack, step, unpack } from './life.ts'

const board = (...points: [number, number][]) => new Set(points.map(([x, y]) => pack(x, y)))
const points = (cells: ReadonlySet<number>) =>
  [...cells].map(unpack).sort(([ax, ay], [bx, by]) => ax - bx || ay - by)
const run = (cells: ReadonlySet<number>, generations: number) => {
  let current = cells
  for (let i = 0; i < generations; i++) current = step(current)
  return current
}

describe('pack / unpack', () => {
  it('round-trips coordinates, including the bounds', () => {
    for (const p of [
      [0, 0],
      [-1, 1],
      [MIN, MIN],
      [MAX, MAX],
      [MIN, MAX],
    ] as [number, number][]) {
      expect(unpack(pack(...p))).toEqual(p)
    }
  })

  it('knows which coordinates fit on the board', () => {
    expect(inBounds(MIN, MAX)).toBe(true)
    expect(inBounds(MIN - 1, 0)).toBe(false)
    expect(inBounds(0, MAX + 1)).toBe(false)
  })
})

describe('step', () => {
  it('keeps an empty board empty', () => {
    expect(step(new Set()).size).toBe(0)
  })

  it('kills a lone cell', () => {
    expect(step(board([0, 0])).size).toBe(0)
  })

  it('keeps a block still', () => {
    const block = board([0, 0], [1, 0], [0, 1], [1, 1])
    expect(points(step(block))).toEqual(points(block))
  })

  it('makes a blinker oscillate with period 2', () => {
    const horizontal = board([-1, 0], [0, 0], [1, 0])
    expect(points(step(horizontal))).toEqual(points(board([0, -1], [0, 0], [0, 1])))
    expect(points(run(horizontal, 2))).toEqual(points(horizontal))
  })

  it('moves a glider by (1, 1) every 4 generations', () => {
    const glider: [number, number][] = [
      [1, 0],
      [2, 1],
      [0, 2],
      [1, 2],
      [2, 2],
    ]
    const moved = board(...glider.map(([x, y]): [number, number] => [x + 1, y + 1]))
    expect(points(run(board(...glider), 4))).toEqual(points(moved))
  })

  it('gives birth with exactly 3 neighbours, not 2 or 4', () => {
    expect(step(board([-1, -1], [1, -1], [0, 1])).has(pack(0, 0))).toBe(true)
    expect(step(board([-1, -1], [1, -1])).has(pack(0, 0))).toBe(false)
    expect(step(board([-1, -1], [1, -1], [-1, 1], [1, 1])).has(pack(0, 0))).toBe(false)
  })

  it('keeps a live cell with 2 or 3 neighbours and kills it with 4', () => {
    expect(step(board([0, 0], [-1, 0], [1, 0])).has(pack(0, 0))).toBe(true)
    expect(step(board([0, 0], [-1, 0], [1, 0], [0, 1])).has(pack(0, 0))).toBe(true)
    expect(step(board([0, 0], [-1, 0], [1, 0], [0, 1], [0, -1])).has(pack(0, 0))).toBe(false)
  })

  it('drops cells that would be born beyond the bounds', () => {
    const topEdge = board([-1, MIN], [0, MIN], [1, MIN])
    expect(points(step(topEdge))).toEqual(points(board([0, MIN], [0, MIN + 1])))
    const rightEdge = board([MAX, -1], [MAX, 0], [MAX, 1])
    expect(points(step(rightEdge))).toEqual(points(board([MAX - 1, 0], [MAX, 0])))
  })

  it('does not mutate its input', () => {
    const blinker = board([-1, 0], [0, 0], [1, 0])
    const before = points(blinker)
    step(blinker)
    expect(points(blinker)).toEqual(before)
  })
})

describe('step against a naive reference', () => {
  // Reference: the rules written as plainly as possible, checking every candidate cell.
  function reference(cells: ReadonlySet<number>): Set<number> {
    const alive = new Set([...cells].map((c) => unpack(c).join()))
    const next = new Set<number>()
    for (const cell of cells) {
      const [cx, cy] = unpack(cell)
      for (let x = cx - 1; x <= cx + 1; x++) {
        for (let y = cy - 1; y <= cy + 1; y++) {
          if (!inBounds(x, y)) continue
          let n = 0
          for (let dx = -1; dx <= 1; dx++)
            for (let dy = -1; dy <= 1; dy++) if ((dx || dy) && alive.has(`${x + dx},${y + dy}`)) n++
          if (n === 3 || (n === 2 && alive.has(`${x},${y}`))) next.add(pack(x, y))
        }
      }
    }
    return next
  }

  // Deterministic pseudo-random numbers, so a failure can be replayed.
  function random(seed: number) {
    return () => (seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31
  }

  it('matches on a dense random soup', () => {
    const next = random(1)
    let cells = new Set<number>()
    for (let x = -20; x < 20; x++)
      for (let y = -15; y < 15; y++) if (next() < 0.3) cells.add(pack(x, y))
    for (let i = 0; i < 20; i++) {
      expect(points(step(cells))).toEqual(points(reference(cells)))
      cells = step(cells)
    }
  })

  it('matches on small patterns spread far apart', () => {
    const next = random(2)
    let cells = new Set<number>()
    for (let p = 0; p < 6; p++) {
      const [ox, oy] = [
        Math.floor(next() * 200_000) - 100_000,
        Math.floor(next() * 200_000) - 100_000,
      ]
      for (let x = 0; x < 5; x++)
        for (let y = 0; y < 5; y++) if (next() < 0.5) cells.add(pack(ox + x, oy + y))
    }
    for (let i = 0; i < 10; i++) {
      expect(points(step(cells))).toEqual(points(reference(cells)))
      cells = step(cells)
    }
  })

  it('matches on a soup touching the corner of the board', () => {
    const next = random(3)
    let cells = new Set<number>()
    for (let x = MAX - 9; x <= MAX; x++)
      for (let y = MIN; y < MIN + 10; y++) if (next() < 0.4) cells.add(pack(x, y))
    for (let i = 0; i < 10; i++) {
      expect(points(step(cells))).toEqual(points(reference(cells)))
      cells = step(cells)
    }
  })
})
