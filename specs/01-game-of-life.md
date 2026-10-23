# Spec: Feature 1 — Game of Life v1

Status: **APPROVED**

## Objective

A web version of Conway's Game of Life (B3/S23) on an infinite board, linked from the Projects
section of https://leonard-fontaine.com. Visitors draw cells, run, pause and rewind the
simulation, on desktop and phone. It must feel like part of the portfolio: same colours, fonts,
motion and tone.

Users: portfolio visitors (recruiters, developers, curious people), often on a phone, often for
less than a minute. They must understand how to play without reading anything long.

## Decisions already taken (interview, 2026-10-21)

- **Board:** infinite, with zoom and pan. Not toroidal.
- **Drawing and navigation by gestures only**, no mode button:
  - mouse: left button draws, wheel zooms around the pointer, Space held + drag or middle-button
    drag pans;
  - touch: one finger draws, two fingers pan and pinch-zoom.
- **Draw or erase:** the first cell touched decides. Starting on a dead cell paints, starting on
  a live cell erases. A tap toggles one cell.
- **Timeline:** visible buttons. Their tooltip (on hover and on keyboard focus) shows the
  shortcut. `J` = previous, `K` = play/pause, `L` = next. A short Space press also plays/pauses.
- **History:** bounded to the last 100 states. Drawing after rewinding discards the "future".
- **Help:** a "?" button opens a panel listing the controls: shortcuts on desktop, gestures on
  touch devices.
- **Languages:** French, English, Dutch, like the portfolio.
- **Stack:** TypeScript + Vite + Canvas 2D, no framework. The goal is to ship, not to learn
  a new technology.
- **Mobile:** bottom control bar, two rows at ~390 px (timeline above, tools and speed slider below), touch targets
  ≥ 44 px, respects the iPhone safe area. Initial zoom ≈ 16 px per cell.
- **Later (not v1):** famous patterns (glider, Gosper gun…), other rules (HighLife, Seeds…), RLE
  import/export, sharing a pattern by URL.

## Features (v1)

| Feature            | Behaviour                                                                                                                   |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| Draw / erase       | Gestures above. A whole stroke is one history entry.                                                                        |
| Play / pause       | `K`, short Space press, or the play button.                                                                                 |
| Previous           | `J` or button: restores the previous state (generation **or** edit). Disabled when history is empty.                        |
| Next               | `L` or button: replays the "future" if we rewound, otherwise computes one generation.                                       |
| Speed              | 1–30 generations/s, default 4, on a progressive slider (left half = 1–6/s). Same slider on mobile, on the bar's second row. |
| Random fill        | Fills the visible area at ~25 % density. One history entry.                                                                 |
| Clear              | Removes every cell and resets the counter to 0. One history entry, so `J` undoes it.                                        |
| Generation counter | Shown in JetBrains Mono. Goes back with `J`.                                                                                |
| Zoom               | Wheel / pinch / `+` `-`. Range 2–64 px per cell. Grid lines only at ≥ 8 px.                                                 |
| Pan                | Space + drag / middle drag / two fingers / arrow keys.                                                                      |
| Recenter           | `0` or button: fits the live cells (or the origin if empty).                                                                |
| Help               | `?` or button: opens the controls panel; Escape closes it.                                                                  |
| Theme              | Toggle like the portfolio (`dataset.theme` + `localStorage.theme`, defaults to `prefers-color-scheme`).                     |
| Language           | Switcher like the portfolio (flag + code, menu of Français / English / Nederlands).                                         |
| Portfolio link     | "← Portfolio" to `https://leonard-fontaine.com/<lang>`.                                                                     |

### Safety limits

- The board holds at most **50,000 live cells**. When a step would go past it, the simulation
  pauses and shows a short message. This bounds history memory to ~40 MB in the worst case.
- Coordinates are bounded to ±2²⁰ cells in each direction. Cells beyond are dropped. Nobody can
  pan that far by hand.

### Language selection

The portfolio uses language paths (`/fr`, `/en`, `/nl`, default `en`). The game is one page,
so: `?lang=fr|en|nl` if present, otherwise the browser language (`fr*`, `nl*`), otherwise
English. Choosing a language in the switcher updates `?lang=` with `history.replaceState`. No
storage.

## Architecture

```
input (pointer, keyboard) ──→ game state ──→ render (canvas)
                                  │
                       engine (pure)  history (pure)
```

- **Engine:** live cells are a `Set<number>`. Each cell `(x, y)` is packed into one safe integer.
  `step(cells)` counts neighbours in a `Map` and returns a new set. It is pure and has no DOM
  access, so it is easy to test. Tiles or HashLife are not needed at this size.
- **History:** a stack of past snapshots (max 100) and a stack of "future" snapshots. Every
  change (step, stroke, random, clear) pushes the previous state.
- **Camera:** `{ x, y, zoom }`, with pure screen↔world conversions and zoom around a point.
- **Render:** draws only the visible cells, scaled by `devicePixelRatio`. Colours come from the
  CSS custom properties, so the theme switch repaints.
- **Loop:** `requestAnimationFrame`. Generations advance at the chosen speed, independent of the
  frame rate.

## Tech Stack

Same tools and majors as the portfolio frontend (checked in `portfolio/frontend/package.json`).
Exact versions are chosen at install time, each published ≥ 2 weeks ago, and listed for approval
before installing.

- Runtime dependencies: `@fontsource-variable/google-sans`,
  `@fontsource-variable/bricolage-grotesque`, `@fontsource-variable/jetbrains-mono`.
- Dev dependencies: `vite`, `typescript`, `vitest`, `oxlint`, `prettier`.
- Nothing else. No jsdom: logic tests need no DOM, and UI checks use `playwright-cli`.

## Commands

```
Dev:          npm run dev
Build:        npm run build          # tsc --noEmit && vite build → dist/
Preview:      npm run preview
Test:         npm test               # vitest run
Coverage:     npm test -- --coverage
Lint:         npm run lint           # oxlint
Format:       npm run format         # prettier --write .
Format check: npm run format:check
```

## Project Structure

```
index.html                 → single page (no inline script or style)
public/theme-init.js       → sets data-theme before first paint (external file, CSP-safe)
src/main.ts                → wiring: state, loop, event listeners
src/engine/life.ts         → step(), packing helpers         (+ life.test.ts)
src/engine/history.ts      → bounded undo/redo of snapshots   (+ history.test.ts)
src/view/camera.ts         → screen↔world, zoom, fit          (+ camera.test.ts)
src/view/render.ts         → canvas drawing
src/input/pointer.ts       → mouse / touch gestures
src/input/keyboard.ts      → shortcuts
src/ui/                    → control bar, tooltips, help panel, theme toggle, language switcher
src/i18n/{en,fr,nl}.ts     → dictionaries, typed against en.ts
src/i18n/lang.ts           → language detection                (+ lang.test.ts)
src/styles/                → tokens.css (colours, spacing, motion), app.css
specs/  tasks/  docs/deployment-checklist.md  README.md
```

## Code Style

Prettier config copied from the portfolio: no semicolons, single quotes, print width 100.
Strict TypeScript. Small pure functions for logic, with the DOM kept at the edges. Comments only
for the "why".

```ts
const OFFSET = 2 ** 20
const SPAN = 2 ** 21

export const pack = (x: number, y: number): number => (x + OFFSET) * SPAN + (y + OFFSET)

export function step(cells: ReadonlySet<number>): Set<number> {
  const counts = new Map<number, number>()
  for (const cell of cells) {
    for (const n of neighbours(cell)) counts.set(n, (counts.get(n) ?? 0) + 1)
  }
  const next = new Set<number>()
  for (const [cell, count] of counts) {
    if (count === 3 || (count === 2 && cells.has(cell))) next.add(cell)
  }
  return next
}
```

## Accessibility

- Every control is a real `<button>` / `<input>` with a localized accessible name, visible focus
  and `aria-keyshortcuts`.
- Tooltips appear on hover **and** keyboard focus, and are linked with `aria-describedby`.
- The help panel uses the native `popover` attribute (Escape and focus handling built in).
- The canvas has `role="img"` and a label with the generation and live-cell count, updated when
  paused (not every frame).
- WCAG AA contrast for text, controls and cells in both themes, and stronger borders under
  `prefers-contrast: more`.
- `prefers-reduced-motion`: no UI transitions. The simulation itself still runs, because the
  user starts it.

## Privacy and security

- No tracker, analytics, cookie, CDN or external request. Fonts are bundled.
- `localStorage` holds only `theme`, the same key as the portfolio.
- Headers to set in Caddy (portfolio repo), recorded in `docs/deployment-checklist.md`:
  `Content-Security-Policy: default-src 'none'; script-src 'self'; style-src 'self';
font-src 'self'; img-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`,
  plus `Referrer-Policy: no-referrer`, `X-Content-Type-Options: nosniff`, the portfolio's HSTS,
  `X-Frame-Options` and `Permissions-Policy`, and long cache lifetimes for hashed assets.

## Testing Strategy

- **Unit (Vitest, TDD)** for the engine, history, camera and language detection:
  - engine: empty board stays empty; a lone cell dies; block stays still; blinker oscillates
    with period 2; glider moves by (1, 1) every 4 generations; birth only at 3 neighbours;
    survival at 2 or 3; packing round-trips at the coordinate bounds;
  - history: cap at 100; previous/next round-trip; a new change clears the future;
  - camera: screen→world→screen round-trip; zoom keeps the point under the cursor fixed; fit
    frames all live cells;
  - language: `?lang` beats the browser, `nl-BE` → `nl`, unknown → `en`.
- **Coverage:** ≥ 90 % lines on `src/engine`, `src/view/camera.ts`, `src/i18n/lang.ts`.
- **Type check:** `nl.ts` and `fr.ts` must have every key of `en.ts`, or the build fails.
- **UI (playwright-cli)** for every visible change: light + dark, desktop + ~390 px, Chrome +
  Firefox. Plus manual touch checks on a real phone before release.

## Boundaries

- **Always:** spec → plan → build order; TDD for logic; Conventional Commits on `feature/…`
  branches; run test, lint, format check and build before each commit.
- **Ask first:** any dependency or version; any design choice not written here; merges, pushes,
  releases; changing this spec.
- **Never:** external requests, CDN, analytics or cookies; inline scripts; assistant attribution
  in git; secrets in the repo or the chat.

## Success Criteria

1. On desktop and at 390 px, in Chrome and Firefox, a visitor can draw, erase, play, pause,
   step forward and back, change speed, fill randomly, clear, zoom, pan and recenter, using
   the gestures and buttons above.
2. Every shortcut in the help panel works, and its tooltip shows on hover and on focus.
3. A glider runs indefinitely without hitting an edge. `J` walks back up to 100 states.
4. A random soup filling a 1080p screen at 8 px per cell runs at 30 generations/s without visibly
   dropped frames on desktop Chrome.
5. Above 50,000 live cells, the game pauses with a message instead of freezing the tab.
6. The interface is fully translated into FR, EN and NL. The browser language and `?lang=` work.
7. Light and dark themes match the portfolio tokens, contrast is AA, and reduced motion is
   honoured.
8. `npm run build` produces a static `dist/` that works under the CSP above, with zero
   requests to other origins (checked in the network panel).
9. All tests, lint, format check and type check pass.
10. The README (description, screenshot, local setup, stack, "All rights reserved" notice) and
    `docs/deployment-checklist.md` exist.

## Decisions (round 2)

- No keyboard drawing in v1: keyboard users play with random fill. Revisit with patterns.
- `J` undoes edits (strokes, random, clear) as well as generations: one history for everything.
- Theme toggle and language switcher at the top right, next to "← Portfolio".
- Repo `game-of-life`; served at `https://life.leonard-fontaine.com`.
- Page titles: "Jeu de la vie" (FR), "Game of Life" (EN), "Spel des levens" (NL).

- No licence: no `LICENSE` file; the README states "© Léonard Fontaine. All rights reserved."

## Open Questions

None.
