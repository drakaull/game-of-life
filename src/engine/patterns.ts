// The pattern library, in RLE as published by the Life references (LifeWiki). Each pattern is
// proven by patterns.test.ts against the engine: periods, speeds and lifespans.
import { inBounds, pack } from './life.ts'
import { parseRle } from './rle.ts'

export type PatternFamily = 'spaceship' | 'oscillator' | 'methuselah' | 'still'

export const PATTERNS = [
  { id: 'glider', family: 'spaceship', rle: 'bo$2bo$3o!' },
  { id: 'lwss', family: 'spaceship', rle: 'bo2bo$o4b$o3bo$4o!' },
  { id: 'mwss', family: 'spaceship', rle: '3bo2b$bo3bo$o5b$o4bo$5o!' },
  { id: 'hwss', family: 'spaceship', rle: '3b2o2b$bo4bo$o6b$o5bo$6o!' },
  { id: 'blinker', family: 'oscillator', rle: '3o!' },
  { id: 'toad', family: 'oscillator', rle: 'b3o$3o!' },
  { id: 'beacon', family: 'oscillator', rle: '2o2b$2o2b$2b2o$2b2o!' },
  {
    id: 'pulsar',
    family: 'oscillator',
    rle: '2b3o3b3o2b2$o4bobo4bo$o4bobo4bo$o4bobo4bo$2b3o3b3o2b2$2b3o3b3o2b$o4bobo4bo$o4bobo4bo$o4bobo4bo2$2b3o3b3o!',
  },
  { id: 'pentadecathlon', family: 'oscillator', rle: '2bo4bo2b$2ob4ob2o$2bo4bo!' },
  {
    id: 'gosperGun',
    family: 'methuselah',
    rle: '24bo11b$22bobo11b$12b2o6b2o12b2o$11bo3bo4b2o12b2o$2o8bo5bo3b2o14b$2o8bo3bob2o4bobo11b$10bo5bo7bo11b$11bo3bo20b$12b2o!',
  },
  { id: 'rPentomino', family: 'methuselah', rle: 'b2o$2ob$bo!' },
  { id: 'acorn', family: 'methuselah', rle: 'bo5b$3bo3b$2o2b3o!' },
  { id: 'diehard', family: 'methuselah', rle: '6bob$2o6b$bo3b3o!' },
  { id: 'block', family: 'still', rle: '2o$2o!' },
  { id: 'beehive', family: 'still', rle: 'b2o$o2bo$b2o!' },
  { id: 'loaf', family: 'still', rle: 'b2o$o2bo$bobo$2bo!' },
  { id: 'boat', family: 'still', rle: '2o$obo$bo!' },
] as const satisfies readonly { id: string; family: PatternFamily; rle: string }[]

export type PatternId = (typeof PATTERNS)[number]['id']

const cache = new Map<PatternId, [number, number][]>()

/** The live cells of a pattern, from its top-left corner. */
export function patternCells(id: PatternId): [number, number][] {
  let cells = cache.get(id)
  if (!cells) {
    cells = parseRle(PATTERNS.find((p) => p.id === id)!.rle)
    cache.set(id, cells)
  }
  return cells
}

/** A copy of `cells` with the pattern added, centred on the cell (x, y). */
export function stamp(
  cells: ReadonlySet<number>,
  pattern: readonly [number, number][],
  x: number,
  y: number,
): Set<number> {
  const width = Math.max(...pattern.map(([px]) => px)) + 1
  const height = Math.max(...pattern.map(([, py]) => py)) + 1
  const [left, top] = [x - Math.floor(width / 2), y - Math.floor(height / 2)]
  const next = new Set(cells)
  for (const [px, py] of pattern) {
    if (inBounds(left + px, top + py)) next.add(pack(left + px, top + py))
  }
  return next
}
