// The bottom control bar: buttons call the game's actions, update() mirrors the game's state.
import { currentLang, t } from '../i18n/lang.ts'

export interface ControlActions {
  togglePlay(): void
  previous(): void
  next(): void
  setSpeed(generationsPerSecond: number): void
  randomFill(): void
  clear(): void
  recenter(): void
  cancelPlacing(): void
}

export interface ControlState {
  playing: boolean
  canGoBack: boolean
  generation: number
  population: number
  speed: number
  limitReached: boolean
  placing: boolean
}

const byId = <T extends HTMLElement>(id: string) => document.getElementById(id) as T

// Progressive slider: position 0–100 maps to 1–30 generations/s, so the left half covers the
// slow speeds people actually watch (1–6/s).
const MAX_SPEED = 30
const speedAt = (position: number) => Math.round(MAX_SPEED ** (position / 100))

export function attachControls(
  actions: ControlActions,
  cellLimit: number,
): (state: ControlState) => void {
  const play = byId<HTMLButtonElement>('play')
  const previous = byId<HTMLButtonElement>('previous')
  const generation = byId<HTMLOutputElement>('generation')
  const speed = byId<HTMLInputElement>('speed')
  const speedValue = byId<HTMLOutputElement>('speed-value')
  const placingChip = byId('placing')
  const notice = byId('notice')
  const board = byId('board')
  play.addEventListener('click', actions.togglePlay)
  previous.addEventListener('click', actions.previous)
  byId('next').addEventListener('click', actions.next)
  byId('random').addEventListener('click', actions.randomFill)
  byId('clear').addEventListener('click', actions.clear)
  byId('recenter').addEventListener('click', actions.recenter)
  byId('cancel-placing').addEventListener('click', actions.cancelPlacing)
  speed.addEventListener('input', () => actions.setSpeed(speedAt(speed.valueAsNumber)))

  return (state) => {
    play.classList.toggle('playing', state.playing)
    play.setAttribute('aria-label', t(state.playing ? 'controls.pause' : 'controls.play'))
    // aria-disabled, not disabled: a disabled button would drop keyboard focus to the page.
    previous.setAttribute('aria-disabled', String(!state.canGoBack))
    generation.value = String(state.generation)
    speedValue.value = `${state.speed}/s`
    const unit = state.speed === 1 ? 'controls.speedOne' : 'controls.speedMany'
    speed.setAttribute('aria-valuetext', t(unit, { n: state.speed }))
    notice.hidden = !state.limitReached
    placingChip.hidden = !state.placing
    // 50,000 / 50 000 / 50.000 depending on the language.
    const limit = cellLimit.toLocaleString(currentLang())
    notice.textContent = t('notice.limit', { limit })
    // Describe the board to screen readers only while paused: a label changing 30 times a
    // second would be noise.
    if (!state.playing) {
      const cells = state.population.toLocaleString(currentLang())
      board.setAttribute('aria-label', t('board.label', { generation: state.generation, cells }))
    }
  }
}
