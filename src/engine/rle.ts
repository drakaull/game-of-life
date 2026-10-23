// RLE (run-length encoded) is the standard text format of Life patterns: `bo$2bo$3o!` is a glider.
// `b` = dead cell, `o` = live cell, `$` = end of row, `!` = end; a number repeats the next tag.
// Lines starting with `#` are comments; the `x = …, y = …, rule = …` line is a header.

/** Live cells of an RLE pattern, as [x, y] from its top-left corner. */
export function parseRle(text: string): [number, number][] {
  const body = text
    .split('\n')
    .filter((line) => !/^\s*(#|x\s*=)/.test(line))
    .join('')
  const cells: [number, number][] = []
  let [x, y] = [0, 0]
  for (const [token, count, tag] of body.matchAll(/(\d*)([bo$!]|\S)/g)) {
    const run = count ? Number(count) : 1
    if (tag === '!' && !count) break
    if (tag === 'b') x += run
    else if (tag === '$') [x, y] = [0, y + run]
    else if (tag === 'o') for (let i = 0; i < run; i++) cells.push([x++, y])
    else throw new Error(`Invalid RLE: unexpected "${token}"`)
  }
  return cells
}
