import '@fontsource-variable/bricolage-grotesque'
import '@fontsource-variable/google-sans'
import '@fontsource-variable/jetbrains-mono'
import './styles/tokens.css'
import './styles/app.css'
import { History } from './engine/history.ts'
import { inBounds, pack, step, unpack } from './engine/life.ts'
import { attachKeyboard } from './input/keyboard.ts'
import { attachPointer, type Cell } from './input/pointer.ts'
import { attachControls } from './ui/controls.ts'
import { fit, pan, screenToWorld, zoomAt } from './view/camera.ts'
import { render } from './view/render.ts'

// A past state, stored compactly (8 bytes per cell) so 100 of them stay small.
interface Snapshot {
  cells: Float64Array
  generation: number
}

const canvas = document.querySelector<HTMLCanvasElement>('#board')!
const ctx = canvas.getContext('2d')!

let cells = new Set<number>()
let generation = 0
let camera = fit([], canvas.clientWidth, canvas.clientHeight)
let playing = false
let speed = 4 // generations per second
let dirty = true
let limitReached = false
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
  toCell: (sx, sy) => screenToWorld(camera, sx, sy).map(Math.floor) as Cell,
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
})
attachKeyboard(actions)
const updateControls = attachControls(actions)

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
  if (dirty) {
    render(ctx, camera, cells, canvas.clientWidth, canvas.clientHeight)
    updateControls({ playing, canGoBack: history.canGoBack, generation, speed, limitReached })
    dirty = false
  }
  requestAnimationFrame(frame)
}
requestAnimationFrame(frame)
