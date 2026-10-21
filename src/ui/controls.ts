// The bottom control bar: buttons call the game's actions, update() mirrors the game's state.
export interface ControlActions {
  togglePlay(): void
  previous(): void
  next(): void
  setSpeed(generationsPerSecond: number): void
  randomFill(): void
  clear(): void
}

export interface ControlState {
  playing: boolean
  canGoBack: boolean
  generation: number
  speed: number
  limitReached: boolean
}

const byId = <T extends HTMLElement>(id: string) => document.getElementById(id) as T

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
  speed.addEventListener('input', () => actions.setSpeed(speed.valueAsNumber))

  return (state) => {
    play.classList.toggle('playing', state.playing)
    play.setAttribute('aria-label', state.playing ? 'Pause' : 'Play')
    // aria-disabled, not disabled: a disabled button would drop keyboard focus to the page.
    previous.setAttribute('aria-disabled', String(!state.canGoBack))
    generation.value = String(state.generation)
    speedValue.value = `${state.speed}/s`
    notice.hidden = !state.limitReached
  }
}
