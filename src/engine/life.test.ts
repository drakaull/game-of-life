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
