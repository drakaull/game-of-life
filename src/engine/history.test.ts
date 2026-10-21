import { describe, expect, it } from 'vitest'
import { History } from './history.ts'

describe('History', () => {
  it('cannot go back or forward when empty', () => {
    const history = new History<string>()
    expect(history.canGoBack).toBe(false)
    expect(history.canGoForward).toBe(false)
    expect(history.back('now')).toBeUndefined()
    expect(history.forward('now')).toBeUndefined()
  })

  it('goes back to the recorded state, then forward again', () => {
    const history = new History<string>()
    history.push('a')
    expect(history.back('b')).toBe('a')
    expect(history.canGoBack).toBe(false)
    expect(history.forward('a')).toBe('b')
    expect(history.canGoForward).toBe(false)
    expect(history.back('b')).toBe('a')
  })

  it('walks back through several states in order', () => {
    const history = new History<number>()
    history.push(1)
    history.push(2)
    expect(history.back(3)).toBe(2)
    expect(history.back(2)).toBe(1)
    expect(history.forward(1)).toBe(2)
    expect(history.forward(2)).toBe(3)
  })

  it('discards the future when a new change is recorded', () => {
    const history = new History<string>()
    history.push('a')
    history.back('b')
    history.push('a')
    expect(history.canGoForward).toBe(false)
  })

  it('keeps only the most recent states', () => {
    const history = new History<number>(100)
    for (let i = 0; i < 101; i++) history.push(i)
    let current = 101
    let steps = 0
    let previous: number | undefined
    while ((previous = history.back(current)) !== undefined) {
      current = previous
      steps++
    }
    expect(steps).toBe(100)
    expect(current).toBe(1)
  })
})
