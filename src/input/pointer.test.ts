import { describe, expect, it } from 'vitest'
import { line } from './pointer.ts'

describe('line', () => {
  it('returns the single cell when both ends match', () => {
    expect(line([3, 4], [3, 4])).toEqual([[3, 4]])
  })

  it('walks a horizontal, a vertical and a diagonal line, ends included', () => {
    expect(line([0, 0], [3, 0])).toEqual([
      [0, 0],
      [1, 0],
      [2, 0],
      [3, 0],
    ])
    expect(line([0, 2], [0, 0])).toEqual([
      [0, 2],
      [0, 1],
      [0, 0],
    ])
    expect(line([0, 0], [-2, 2])).toEqual([
      [0, 0],
      [-1, 1],
      [-2, 2],
    ])
  })

  it('leaves no gap on a steep line', () => {
    const cells = line([0, 0], [3, 10])
    expect(cells[0]).toEqual([0, 0])
    expect(cells.at(-1)).toEqual([3, 10])
    for (let i = 1; i < cells.length; i++) {
      const [[ax, ay], [bx, by]] = [cells[i - 1]!, cells[i]!]
      expect(Math.max(Math.abs(bx - ax), Math.abs(by - ay))).toBe(1)
    }
  })
})
