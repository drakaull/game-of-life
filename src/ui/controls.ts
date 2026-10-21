// The bottom control bar: buttons call the game's actions, update() mirrors the game's state.
export interface ControlActions {
  togglePlay(): void
  previous(): void
  next(): void
  setSpeed(generationsPerSecond: number): void
  randomFill(): void
  clear(): void
  recenter(): void
}

export interface ControlState {
  playing: boolean
  canGoBack: boolean
  generation: number
  speed: number
  limitReached: boolean
}

const byId = <T extends HTMLElement>(id: string) => document.getElementById(id) as T

// Progressive slider: position 0–100 maps to 1–30 generations/s, so the left half covers the
// slow speeds people actually watch (1–6/s).
const MAX_SPEED = 30
const speedAt = (position: number) => Math.round(MAX_SPEED ** (position / 100))

export function attachControls(actions: ControlActions): (state: ControlState) => void {
  const play = byId<HTMLButtonElement>('play')
  const previous = byId<HTMLButtonElement>('previous')
  const generation = byId<HTMLOutputElement>('generation')
  const speed = byId<HTMLInputElement>('speed')
  const speedValue = byId<HTMLOutputElement>('speed-value')
  const notice = byId('notice')
  play.addEventListener('click', actions.togglePlay)
  previous.addEventListener('click', actions.previous)
  byId('next').addEventListener('click', actions.next)
  byId('random').addEventListener('click', actions.randomFill)
  byId('clear').addEventListener('click', actions.clear)
  byId('recenter').addEventListener('click', actions.recenter)
  speed.addEventListener('input', () => actions.setSpeed(speedAt(speed.valueAsNumber)))

  return (state) => {
    play.classList.toggle('playing', state.playing)
    play.setAttribute('aria-label', state.playing ? 'Pause' : 'Play')
    // aria-disabled, not disabled: a disabled button would drop keyboard focus to the page.
    previous.setAttribute('aria-disabled', String(!state.canGoBack))
    generation.value = String(state.generation)
    speedValue.value = `${state.speed}/s`
    const unit = state.speed === 1 ? 'generation' : 'generations'
    speed.setAttribute('aria-valuetext', `${state.speed} ${unit} per second`)
    notice.hidden = !state.limitReached
  }
}
