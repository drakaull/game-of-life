import { en, type TranslationKey } from './en.ts'
import { fr } from './fr.ts'
import { nl } from './nl.ts'

const dictionaries = { en, fr, nl }

export type Lang = keyof typeof dictionaries

export const LANGS = Object.keys(dictionaries) as Lang[]
export const DEFAULT_LANG: Lang = 'en'

export const isLang = (value: string | null | undefined): value is Lang =>
  value != null && Object.hasOwn(dictionaries, value)

/** ?lang= wins, then the first browser language we support (nl-BE → nl), then English. */
export function detectLang(search: string, browser: readonly string[]): Lang {
  const param = new URLSearchParams(search).get('lang')
  if (isLang(param)) return param
  for (const tag of browser) {
    const base = tag.split('-')[0]?.toLowerCase()
    if (isLang(base)) return base
  }
  return DEFAULT_LANG
}

let current: Lang = DEFAULT_LANG

export const currentLang = () => current

export function setLang(lang: Lang): void {
  current = lang
}

/** Text in the current language, with {name} placeholders filled from `vars`. */
export const t = (key: TranslationKey, vars: Record<string, string | number> = {}): string =>
  dictionaries[current][key].replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name]))
