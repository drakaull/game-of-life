// Light / dark toggle, like the portfolio's: the initial theme is already on <html data-theme>
// (public/theme-init.js); a choice is remembered in localStorage.theme.
export function attachThemeToggle(redraw: () => void): void {
  const root = document.documentElement
  const button = document.getElementById('theme-button')!
  const sync = () => button.setAttribute('aria-pressed', String(root.dataset.theme === 'dark'))
  sync()

  button.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark'
    const apply = () => {
      root.dataset.theme = next
      sync()
      // Repaint now, so the cross-fade captures the board in its new colours.
      redraw()
    }
    // Cross-fade instead of a sudden jump in brightness, unless motion is reduced.
    if (document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.startViewTransition(apply)
    } else {
      apply()
    }
    try {
      localStorage.setItem('theme', next)
    } catch {
      // Storage can be blocked (private mode); the theme still applies for this visit.
    }
  })
}
