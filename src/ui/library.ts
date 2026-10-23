// The pattern library panel: one section per family, one card (preview + name) per pattern.
import { PATTERNS, patternCells, type PatternFamily, type PatternId } from '../engine/patterns.ts'
import type { TranslationKey } from '../i18n/en.ts'

const FAMILIES: PatternFamily[] = ['spaceship', 'oscillator', 'methuselah', 'still']

// The smallest area a preview shows, in cells: small patterns stay small next to big ones.
const [MIN_WIDTH, MIN_HEIGHT] = [12, 7]

/** A small SVG of the pattern, centred in its card. */
function preview(id: PatternId): string {
  const cells = patternCells(id)
  const width = Math.max(...cells.map(([x]) => x)) + 1
  const height = Math.max(...cells.map(([, y]) => y)) + 1
  const [viewWidth, viewHeight] = [Math.max(width + 1, MIN_WIDTH), Math.max(height + 1, MIN_HEIGHT)]
  const viewBox = `${(width - viewWidth) / 2} ${(height - viewHeight) / 2} ${viewWidth} ${viewHeight}`
  const rects = cells.map(([x, y]) => `<rect x="${x}" y="${y}" width=".86" height=".86"/>`)
  return `<svg class="card-preview" viewBox="${viewBox}" aria-hidden="true">${rects.join('')}</svg>`
}

/**
 * Builds the cards (before applyLanguage, which fills their data-i18n texts). `choose` gets the
 * pattern and whether the card was activated from the keyboard (no pointer to aim with).
 */
export function attachLibrary(choose: (id: PatternId, fromKeyboard: boolean) => void): void {
  const panel = document.getElementById('library')!
  const list = document.getElementById('library-list')!
  list.innerHTML = FAMILIES.map((family) => {
    const cards = PATTERNS.filter((p) => p.family === family).map(
      ({ id }) =>
        `<li><button class="card" type="button" data-pattern="${id}">${preview(id)}<span data-i18n="${`pattern.${id}` satisfies TranslationKey}"></span></button></li>`,
    )
    return `<section><h3 class="library-family" data-i18n="${`family.${family}` satisfies TranslationKey}"></h3><ul class="cards">${cards.join('')}</ul></section>`
  }).join('')
  // Opening the popover moves focus here, so keyboard users land on the cards.
  list.querySelector('.card')!.setAttribute('autofocus', '')

  list.addEventListener('click', (event) => {
    const card = (event.target as Element).closest<HTMLElement>('[data-pattern]')
    if (!card) return
    panel.hidePopover()
    // A click from Enter or Space has no pointer position: detail is 0.
    choose(card.dataset.pattern as PatternId, event.detail === 0)
  })
}
