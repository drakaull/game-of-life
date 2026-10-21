// Bounded undo/redo of whole states. The caller passes the current state in,
// so the history never has to know what "now" is.
export class History<T> {
  private past: T[] = []
  private future: T[] = []
  private readonly limit: number

  constructor(limit = 100) {
    this.limit = limit
  }

  get canGoBack(): boolean {
    return this.past.length > 0
  }

  get canGoForward(): boolean {
    return this.future.length > 0
  }

  /** Records the state as it was before a change. Any "future" is lost. */
  push(previous: T): void {
    this.past.push(previous)
    if (this.past.length > this.limit) this.past.shift()
    this.future = []
  }

  back(current: T): T | undefined {
    const previous = this.past.pop()
    if (previous !== undefined) this.future.push(current)
    return previous
  }

  forward(current: T): T | undefined {
    const next = this.future.pop()
    if (next !== undefined) this.past.push(current)
    return next
  }
}
