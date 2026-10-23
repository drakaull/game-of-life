// Page language: fills the data-i18n* elements and drives the language switcher.
import type { TranslationKey } from '../i18n/en.ts'
import { LANGS, setLang, t, type Lang } from '../i18n/lang.ts'

// Each name is written in its own language, so it is not part of the dictionaries.
const NAMES: Record<Lang, string> = { fr: 'Français', en: 'English', nl: 'Nederlands' }

// Flags drawn like the portfolio's (3:2), French and Dutch split with Belgium along the
// top-right → bottom-left diagonal. Polygons instead of a clipPath: no SVG ids to keep unique.
const BELGIUM =
  '<path fill="#000" d="M0 0h10v20H0z"/><path fill="#FDDA24" d="M10 0h10v20H10z"/><path fill="#EF3340" d="M20 0h10v20H20z"/>'
const FLAGS: Record<Lang, string> = {
  fr: `${BELGIUM}<path fill="#002654" d="M0 0h10v13.33L0 20z"/><path fill="#FFF" d="M10 0h10v6.67l-10 6.66z"/><path fill="#CE1126" d="M20 0h10L20 6.67z"/>`,
  nl: `${BELGIUM}<path fill="#AE1C28" d="M0 0h30l-10 6.67H0z"/><path fill="#FFF" d="M0 6.67h20l-10 6.66H0z"/><path fill="#21468B" d="M0 13.33h10L0 20z"/>`,
  // shortcut: the red diagonals are centred, not counterchanged; invisible at ~20 px, redraw if flags grow.
  en: '<path fill="#012169" d="M0 0h30v20H0z"/><path stroke="#FFF" stroke-width="4" d="M0 0l30 20M30 0L0 20"/><path stroke="#C8102E" stroke-width="1.4" d="M0 0l30 20M30 0L0 20"/><path stroke="#FFF" stroke-width="6.6" d="M15 0v20M0 10h30"/><path stroke="#C8102E" stroke-width="4" d="M15 0v20M0 10h30"/>',
}
const flag = (lang: Lang) =>
  `<svg class="flag" viewBox="0 0 30 20" aria-hidden="true">${FLAGS[lang]}</svg>`

const keyOf = (value: string | undefined) => value as TranslationKey

/** Switches every text on the page to `lang`; dynamic labels follow on the next render. */
export function applyLanguage(lang: Lang): void {
  setLang(lang)
  document.documentElement.lang = lang
  document.title = t('title')
  for (const el of document.querySelectorAll<HTMLElement>('[data-i18n]')) {
    el.textContent = t(keyOf(el.dataset.i18n))
  }
  // Only our own dictionaries reach innerHTML (for the <kbd> keys in the help).
  for (const el of document.querySelectorAll<HTMLElement>('[data-i18n-html]')) {
    el.innerHTML = t(keyOf(el.dataset.i18nHtml))
  }
  for (const el of document.querySelectorAll<HTMLElement>('[data-i18n-label]')) {
    el.setAttribute('aria-label', t(keyOf(el.dataset.i18nLabel)))
  }
  document.querySelector<HTMLAnchorElement>('.back')!.href = `https://leonard-fontaine.com/${lang}`
  const button = document.getElementById('lang-button')!
  button.setAttribute('aria-label', `${t('language.label')} ${NAMES[lang]}`)
  document.getElementById('lang-flag')!.innerHTML = flag(lang)
  document.getElementById('lang-code')!.textContent = lang.toUpperCase()
  for (const item of document.querySelectorAll<HTMLElement>('.lang-menu a')) {
    if (item.lang === lang) item.setAttribute('aria-current', 'true')
    else item.removeAttribute('aria-current')
  }
}

/** Builds the menu items; choosing one keeps the game running and only swaps the texts. */
export function attachLanguageSwitch(onChange: () => void): void {
  const menu = document.getElementById('lang-menu')!
  menu.innerHTML = LANGS.map(
    (lang) =>
      `<li><a href="?lang=${lang}" lang="${lang}" hreflang="${lang}">${flag(lang)}${NAMES[lang]}</a></li>`,
  ).join('')
  menu.addEventListener('click', (event) => {
    const link = (event.target as Element).closest('a')
    if (!link) return
    event.preventDefault()
    history.replaceState(null, '', `?lang=${link.lang}`)
    applyLanguage(link.lang as Lang)
    menu.hidePopover()
    onChange()
  })
}
