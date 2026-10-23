import '@fontsource-variable/bricolage-grotesque'
import '@fontsource-variable/google-sans'
import '@fontsource-variable/jetbrains-mono'
import './styles/tokens.css'
import './styles/app.css'
import { History } from './engine/history.ts'
import { inBounds, pack, step, unpack } from './engine/life.ts'
import { attachKeyboard } from './input/keyboard.ts'
import { centred, patternCells, stamp } from './engine/patterns.ts'
import { attachPointer, type Cell, type Point } from './input/pointer.ts'
import { detectLang } from './i18n/lang.ts'
import { attachControls } from './ui/controls.ts'
import { applyLanguage, attachLanguageSwitch } from './ui/language.ts'
import { attachLibrary } from './ui/library.ts'
import { attachThemeToggle } from './ui/theme.ts'
import { fit, pan, screenToWorld, zoomAt } from './view/camera.ts'
import { render } from './view/render.ts'

// A past state, stored compactly (8 bytes per cell) so 100 of them stay small.
interface Snapshot {
  cells: Float64Array
  generation: number
}

const canvas = document.querySelector<HTMLCanvasElement>('#board')!
const ctx = canvas.getContext('2d')!

// Visitors start on a paused glider: pressing play shows the game at once.
const GLIDER: Cell[] = [
  [1, 0],
  [2, 1],
  [0, 2],
  [1, 2],
  [2, 2],
]
let cells = new Set(GLIDER.map(([x, y]) => pack(x, y)))
let generation = 0
let camera = fit(GLIDER, canvas.clientWidth, canvas.clientHeight)
let playing = false
let speed = 4 // generations per second
let dirty = true
let limitReached = false
// A pattern chosen in the library, waiting to be placed; `at` is where its ghost is shown.
let placing: { pattern: [number, number][]; at?: Point } | undefined
const history = new History<Snapshot>()
// Bounds history memory (~40 MB worst case) and keeps every frame responsive.
const CELL_LIMIT = 50_000
const RANDOM_DENSITY = 0.25

const snapshot = (): Snapshot => ({ cells: Float64Array.from(cells), generation })
function restore(state: Snapshot) {
  cells = new Set(state.cells)
  generation = state.generation
  dirty = true
}

/** Computes one generation; refuses (and pauses) if it would go past the cell limit. */
function advance(): boolean {
  const next = step(cells)
  if (next.size > CELL_LIMIT) {
    playing = false
    limitReached = true
    dirty = true
    return false
  }
  history.push(snapshot())
  cells = next
  generation++
  dirty = true
  return true
}

const cellAt = (sx: number, sy: number) => screenToWorld(camera, sx, sy).map(Math.floor) as Cell

/** Drops the chosen pattern centred on the cell under (sx, sy), as one undoable change. */
function placeAt(sx: number, sy: number) {
  if (!placing) return
  const next = stamp(cells, placing.pattern, ...cellAt(sx, sy))
  placing = undefined
  dirty = true
  if (next.size > CELL_LIMIT) {
    limitReached = true
    return
  }
  history.push(snapshot())
  cells = next
}

/** Swaps in a whole new board as one undoable change. */
function replaceBoard(next: Set<number>) {
  history.push(snapshot())
  cells = next
  generation = 0
  dirty = true
}

const actions = {
  togglePlay() {
    playing = !playing
    limitReached = false
    dirty = true
  },
  setSpeed(generationsPerSecond: number) {
    speed = generationsPerSecond
    dirty = true
  },
  randomFill() {
    limitReached = false
    const [left, top] = screenToWorld(camera, 0, 0).map(Math.floor) as Cell
    const [right, bottom] = screenToWorld(camera, canvas.clientWidth, canvas.clientHeight).map(
      Math.ceil,
    ) as Cell
    // At low zoom the screen holds more cells than the limit allows: thin the soup out.
    const density = Math.min(RANDOM_DENSITY, CELL_LIMIT / ((right - left) * (bottom - top)))
    const next = new Set<number>()
    for (let x = left; x < right; x++) {
      for (let y = top; y < bottom; y++) {
        if (inBounds(x, y) && Math.random() < density) next.add(pack(x, y))
      }
    }
    replaceBoard(next)
  },
  clear() {
    playing = false
    limitReached = false
    replaceBoard(new Set())
  },
  previous() {
    playing = false
    const state = history.back(snapshot())
    if (state) restore(state)
    dirty = true
  },
  next() {
    playing = false
    const state = history.forward(snapshot())
    if (state) restore(state)
    else advance()
  },
  pan(dx: number, dy: number) {
    camera = pan(camera, dx, dy)
    dirty = true
  },
  zoom(factor: number, sx = canvas.clientWidth / 2, sy = canvas.clientHeight / 2) {
    camera = zoomAt(camera, sx, sy, camera.zoom * factor)
    dirty = true
  },
  recenter() {
    camera = fit([...cells].map(unpack), canvas.clientWidth, canvas.clientHeight)
    dirty = true
  },
  toggleHelp: () => document.getElementById('help')!.togglePopover(),
  toggleLibrary: () => document.getElementById('library')!.togglePopover(),
  cancelPlacing() {
    placing = undefined
    dirty = true
  },
}

// Drawing: the first cell touched decides whether the whole stroke paints or erases.
let stroke: { before: Snapshot; paint: boolean } | undefined
function setCell([x, y]: Cell) {
  if (!stroke || !inBounds(x, y)) return
  if (stroke.paint) cells.add(pack(x, y))
  else cells.delete(pack(x, y))
  dirty = true
}
attachPointer(canvas, {
  toCell: cellAt,
  start(cell) {
    const [x, y] = cell
    const paint = !inBounds(x, y) || !cells.has(pack(x, y))
    stroke = { before: snapshot(), paint }
    setCell(cell)
  },
  move: setCell,
  end() {
    // One stroke is one history entry, so J undoes it in one go.
    if (stroke) history.push(stroke.before)
    stroke = undefined
  },
  cancel() {
    if (stroke) restore(stroke.before)
    stroke = undefined
  },
  pan: actions.pan,
  zoom: (sx, sy, factor) => actions.zoom(factor, sx, sy),
  isPlacing: () => placing !== undefined,
  aim(point) {
    if (placing) placing.at = point
    dirty = true
  },
  place: placeAt,
  cancelPlacing: actions.cancelPlacing,
})
attachKeyboard(actions)
const updateControls = attachControls(actions, CELL_LIMIT)
attachLibrary((id, fromKeyboard) => {
  placing = { pattern: patternCells(id) }
  dirty = true
  // No pointer to aim with: drop it in the middle of the screen at once.
  if (fromKeyboard) placeAt(canvas.clientWidth / 2, canvas.clientHeight / 2)
})
attachLanguageSwitch(() => (dirty = true))
applyLanguage(detectLang(location.search, navigator.languages))

function draw() {
  const ghost = placing?.at ? centred(placing.pattern, ...cellAt(...placing.at)) : []
  render(ctx, camera, cells, canvas.clientWidth, canvas.clientHeight, ghost)
  const state = { playing, canGoBack: history.canGoBack, generation, speed, limitReached }
  updateControls({ ...state, population: cells.size, placing: placing !== undefined })
  dirty = false
}
attachThemeToggle(draw)

new ResizeObserver(() => {
  canvas.width = Math.round(canvas.clientWidth * devicePixelRatio)
  canvas.height = Math.round(canvas.clientHeight * devicePixelRatio)
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)
  dirty = true
}).observe(canvas)

// The board's colours come from CSS: repaint when the theme changes.
new MutationObserver(() => (dirty = true)).observe(document.documentElement, {
  attributeFilter: ['data-theme'],
})

let last = performance.now()
let pending = 0 // generations owed to the clock
function frame(now: number) {
  // Capped so a tab coming back from the background does not compute a burst of generations.
  pending = playing ? Math.min(pending + ((now - last) * speed) / 1000, 4) : 0
  last = now
  // Time budget: a huge pattern slows the simulation down instead of freezing the page.
  const deadline = performance.now() + 8
  while (pending >= 1 && performance.now() < deadline && advance()) pending--
  if (dirty) draw()
  requestAnimationFrame(frame)
}
requestAnimationFrame(frame)
