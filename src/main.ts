import '@fontsource-variable/bricolage-grotesque'
import '@fontsource-variable/google-sans'
import '@fontsource-variable/jetbrains-mono'
import './styles/tokens.css'
import './styles/app.css'
import { History } from './engine/history.ts'
import { inBounds, pack, step, unpack } from './engine/life.ts'
import { attachPointer, type Cell } from './input/pointer.ts'
import { fit, screenToWorld } from './view/camera.ts'
import { render } from './view/render.ts'

interface Snapshot {
  cells: Set<number>
  generation: number
}

const canvas = document.querySelector<HTMLCanvasElement>('#board')!
const ctx = canvas.getContext('2d')!

// shortcut: temporary glider seed so the loop is visible, removed in Task 7.
let cells = new Set(
  [
    [1, 0],
    [2, 1],
    [0, 2],
    [1, 2],
    [2, 2],
  ].map(([x, y]) => pack(x!, y!)),
)
let camera = fit([...cells].map(unpack), canvas.clientWidth, canvas.clientHeight)
let generation = 0
let speed = 10 // generations per second
let dirty = true
const history = new History<Snapshot>()

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
    stroke = { before: { cells: new Set(cells), generation }, paint }
    setCell(cell)
  },
  move: setCell,
  end() {
    // One stroke is one history entry, so J undoes it in one go.
    if (stroke) history.push(stroke.before)
    stroke = undefined
  },
  cancel() {
    if (stroke) ({ cells, generation } = stroke.before)
    stroke = undefined
    dirty = true
  },
})

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
  pending = Math.min(pending + ((now - last) * speed) / 1000, 4)
  last = now
  while (pending >= 1) {
    cells = step(cells)
    generation++
    pending--
    dirty = true
  }
  if (dirty) {
    render(ctx, camera, cells, canvas.clientWidth, canvas.clientHeight)
    dirty = false
  }
  requestAnimationFrame(frame)
}
requestAnimationFrame(frame)
