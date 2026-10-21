import '@fontsource-variable/bricolage-grotesque'
import '@fontsource-variable/google-sans'
import '@fontsource-variable/jetbrains-mono'
import './styles/tokens.css'
import './styles/app.css'
import { pack, step, unpack } from './engine/life.ts'
import { fit } from './view/camera.ts'
import { render } from './view/render.ts'

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
let speed = 10 // generations per second
let dirty = true

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
