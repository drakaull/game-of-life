import { describe, expect, it } from 'vitest'
import { parseRle } from './rle.ts'

const sorted = (cells: [number, number][]) =>
  [...cells].sort(([ax, ay], [bx, by]) => ay - by || ax - bx)

describe('parseRle', () => {
  it('reads a glider', () => {
    expect(sorted(parseRle('bo$2bo$3o!'))).toEqual([
      [1, 0],
      [2, 1],
      [0, 2],
      [1, 2],
      [2, 2],
    ])
  })

  it('expands run counts of live and dead cells', () => {
    expect(parseRle('3o2b2o!')).toEqual([
      [0, 0],
      [1, 0],
      [2, 0],
      [5, 0],
      [6, 0],
    ])
  })

  it('skips blank rows with a counted $', () => {
    expect(parseRle('o2$o!')).toEqual([
      [0, 0],
      [0, 2],
    ])
  })

  it('ignores dead cells at the end of a row', () => {
    expect(parseRle('o3b$o!')).toEqual([
      [0, 0],
      [0, 1],
    ])
  })

  it('ignores comments, the header line and line breaks inside the body', () => {
    const text = '#N Glider\n#C A small spaceship.\nx = 3, y = 3, rule = B3/S23\nbo$2bo$\n3o!'
    expect(parseRle(text)).toHaveLength(5)
  })

  it('stops at the first !', () => {
    expect(parseRle('o!o')).toEqual([[0, 0]])
  })

  it('throws on characters that are not part of the format', () => {
    expect(() => parseRle('bo$2xo!')).toThrow()
    expect(() => parseRle('3!')).toThrow()
  })
})
