import { afterEach, describe, expect, it } from 'vitest'
import html from '../../index.html?raw'
import { en } from './en.ts'
import { detectLang, setLang, t } from './lang.ts'

describe('detectLang', () => {
  it('prefers ?lang over the browser languages', () => {
    expect(detectLang('?lang=nl', ['fr-FR'])).toBe('nl')
  })

  it('ignores an unknown ?lang value', () => {
    expect(detectLang('?lang=de', ['fr-BE'])).toBe('fr')
  })

  it('takes the first supported browser language, regional variants included', () => {
    expect(detectLang('', ['de-DE', 'nl-BE', 'fr'])).toBe('nl')
  })

  it('falls back to English', () => {
    expect(detectLang('', ['de-DE', 'es'])).toBe('en')
    expect(detectLang('', [])).toBe('en')
  })
})

describe('t', () => {
  afterEach(() => setLang('en'))

  it('returns the text of the current language and fills placeholders', () => {
    expect(t('controls.speedMany', { n: 4 })).toBe('4 generations per second')
    setLang('fr')
    expect(t('controls.speedMany', { n: 4 })).toBe('4 générations par seconde')
  })
})

describe('index.html', () => {
  it('only uses translation keys that exist', () => {
    const keys = [...html.matchAll(/data-i18n(?:-html|-label)?="([^"]+)"/g)].map((m) => m[1]!)
    expect(keys.length).toBeGreaterThan(10)
    expect(keys.filter((key) => !(key in en))).toEqual([])
  })
})
