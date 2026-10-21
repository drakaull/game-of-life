// Keyboard shortcuts. Space is shared with panning: a short press toggles play, while holding it
// and dragging pans (see pointer.ts), so play only toggles if no pointer went down meanwhile.
export interface KeyActions {
  togglePlay(): void
  previous(): void
  next(): void
  zoom(factor: number): void
  pan(dx: number, dy: number): void
  recenter(): void
}

const PAN_STEP = 80 // CSS pixels per arrow press
const ZOOM_STEP = 1.25

export function attachKeyboard(actions: KeyActions): void {
  let spaceDown = false
  let spaceUsed = false
  const shortcuts: Record<string, () => void> = {
    j: actions.previous,
    k: actions.togglePlay,
    l: actions.next,
    '+': () => actions.zoom(ZOOM_STEP),
    '=': () => actions.zoom(ZOOM_STEP),
    '-': () => actions.zoom(1 / ZOOM_STEP),
    '0': actions.recenter,
    ArrowLeft: () => actions.pan(PAN_STEP, 0),
    ArrowRight: () => actions.pan(-PAN_STEP, 0),
    ArrowUp: () => actions.pan(0, PAN_STEP),
    ArrowDown: () => actions.pan(0, -PAN_STEP),
  }

  addEventListener('pointerdown', () => {
    if (spaceDown) spaceUsed = true
  })

  addEventListener('keydown', (event) => {
    // Leave browser shortcuts (ctrl + 0, ctrl + plus…) alone.
    if (event.ctrlKey || event.metaKey || event.altKey) return
    // A focused slider keeps its own arrow keys.
    if (event.target instanceof HTMLInputElement) return
    if (event.code === 'Space') {
      // On a focused button, Space is the button's own activation key.
      if (event.target instanceof Element && event.target.closest('button, a')) return
      event.preventDefault()
      if (!event.repeat) [spaceDown, spaceUsed] = [true, false]
      return
    }
    const action = shortcuts[event.key.length === 1 ? event.key.toLowerCase() : event.key]
    if (!action) return
    event.preventDefault()
    action()
  })

  addEventListener('keyup', (event) => {
    if (event.code !== 'Space' || !spaceDown) return
    spaceDown = false
    if (!spaceUsed) actions.togglePlay()
  })
  addEventListener('blur', () => (spaceDown = false))
}
