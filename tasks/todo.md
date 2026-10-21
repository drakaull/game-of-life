# Todo: Game of Life v1

Standing bar for every task: `npm test`, `npm run lint`, `npm run format:check` and
`npm run build` pass; one Conventional Commit, no assistant attribution. Every visible change
is checked with `playwright-cli` in light + dark, desktop + ~390 px, Chrome + Firefox.

## Phase 1: Setup

- [x] **Task 0: Repository and tooling**
  - Acceptance:
    - `git init` with `main`; spec, plan, `.gitignore` committed (`docs: add spec and plan`); `develop` created.
    - Dependency list with exact versions and publish dates (all ≥ 2 weeks old) **approved by Léonard before install**.
    - `package.json` scripts from the spec; strict `tsconfig.json`; `.prettierrc.json` copied from the portfolio; `.oxlintrc.json`; Vitest config with coverage.
    - `index.html` + `src/main.ts` render an empty page; `npm run build` produces `dist/`.
  - Verify: all four commands pass; `npm run dev` shows the empty page.
  - Files: `package.json`, `tsconfig.json`, `vite.config.ts`, `.prettierrc.json`, `.oxlintrc.json`, `index.html`, `src/main.ts`
  - Scope: M

## Phase 2: Engine (`feature/engine`, TDD)

- [x] **Task 1: `step()` and coordinate packing**
  - Acceptance: tests from the spec pass (empty, lone cell, block, blinker, glider shift, birth/survival, pack round-trip at ±2²⁰, cells beyond bounds dropped).
  - Verify: `npm test -- src/engine/life.test.ts`; coverage ≥ 90 %.
  - Files: `src/engine/life.ts`, `src/engine/life.test.ts`
  - Scope: S

- [x] **Task 2: Bounded history**
  - Acceptance: cap at 100; previous/next round-trip; new change clears the future; previous on empty history is a no-op.
  - Verify: `npm test -- src/engine/history.test.ts`; coverage ≥ 90 %.
  - Files: `src/engine/history.ts`, `src/engine/history.test.ts`
  - Scope: S

### Checkpoint A: Engine

- [x] All tests pass, coverage ≥ 90 % on `src/engine`
- [x] Review (`/code-review`), merge `feature/engine` → `develop` after Léonard's "yes"

## Phase 3: Board (`feature/board`)

- [x] **Task 3: Page skeleton, tokens, fonts, theme init**
  - Acceptance: `tokens.css` with every colour, spacing, radius and motion token from the spec; the 3 Fontsource fonts imported; `public/theme-init.js` sets `data-theme` before paint; header with "← Portfolio"; full-screen canvas area.
  - Verify: playwright screenshots in both themes (forced via `localStorage.theme`) and at 390 px; no theme flash on reload.
  - Files: `index.html`, `public/theme-init.js`, `src/styles/tokens.css`, `src/styles/app.css`, `src/main.ts`
  - Scope: M

- [x] **Task 4: Camera, renderer and loop: a glider runs**
  - Acceptance: camera tests pass (round-trip, zoom around a point, fit); canvas is sharp at `devicePixelRatio` 1 and 2; only visible cells drawn; grid lines at ≥ 8 px; temporary seeded glider runs at 10 gen/s, independent of frame rate; colours follow the theme.
  - Verify: `npm test -- src/view`; playwright screenshots in both themes.
  - Files: `src/view/camera.ts`, `src/view/camera.test.ts`, `src/view/render.ts`, `src/main.ts`
  - Scope: M

- [x] **Task 5: Draw and erase**
  - Acceptance: mouse left button and one finger draw; first cell decides paint vs erase; tap toggles; no gaps when dragging fast (cells interpolated along the stroke); one stroke = one history entry; stroke cancelled when a second finger lands.
  - Verify: playwright: drag across empty cells → cells appear; drag starting on a live cell → erased.
  - Files: `src/input/pointer.ts`, `src/main.ts`
  - Scope: S

- [x] **Task 6: Zoom, pan, recenter, performance**
  - Acceptance: wheel zooms around the pointer (2–64 px); Space+drag, middle drag, two-finger pan and pinch; recenter fits live cells; page never scrolls or zooms instead of the board; criterion 4 measured on a full-screen soup at 8 px.
  - Verify: playwright: zoom and pan screenshots; FPS / step time logged in the dev console during the benchmark (debug code removed afterwards).
  - Files: `src/input/pointer.ts`, `src/view/camera.ts`, `src/main.ts`
  - Scope: M

### Checkpoint B: Board

- [x] Glider runs, drawing/zoom/pan work with mouse and in mobile emulation
- [x] Performance figure reported to Léonard
- [x] Review, merge `feature/board` → `develop` after "yes"

## Phase 4: Controls (`feature/controls`)

- [x] **Task 7: Timeline bar and shortcuts**
  - Acceptance: buttons previous / play-pause / next and the generation counter in the bottom bar; `J`, `K`, `L`, short Space press, `+`, `-`, arrows, `0`; previous disabled with empty history; next replays the future, otherwise steps; temporary glider seed removed.
  - Verify: playwright: keyboard-only session runs, rewinds and steps; counter matches.
  - Files: `src/ui/controls.ts`, `src/input/keyboard.ts`, `index.html`, `src/styles/app.css`, `src/main.ts`
  - Scope: M

- [x] **Task 8: Speed, random, clear, cell cap**
  - Acceptance: speed slider 1–60 (default 10); random fills the visible area at ~25 %; clear resets the counter; both undoable with `J`; above 50,000 cells the game pauses with a short message.
  - Verify: playwright: each control; a large random soup at minimum zoom triggers the cap message.
  - Files: `src/ui/controls.ts`, `index.html`, `src/main.ts`
  - Scope: S

- [x] **Task 9: Tooltips and help panel**
  - Acceptance: tooltip on hover **and** focus shows the shortcut (`aria-describedby`, `aria-keyshortcuts`); "?" button and `?` key open a `popover` help panel; Escape closes it; shortcuts on fine pointers, gestures on touch (`pointer: coarse`).
  - Verify: playwright: hover and Tab screenshots; help panel in desktop and touch emulation.
  - Files: `src/ui/tooltip.ts`, `src/ui/help.ts`, `index.html`, `src/styles/app.css`
  - Scope: M

- [ ] **Task 10: Mobile layout**
  - Acceptance: at ~390 px the bar shows icons only, speed in a small menu, targets ≥ 44 px, `env(safe-area-inset-bottom)` respected; nothing overflows horizontally.
  - Verify: playwright at 390 × 844 in both browsers and both themes.
  - Files: `src/styles/app.css`, `src/ui/controls.ts`, `index.html`
  - Scope: S

### Checkpoint C: Controls

- [ ] Spec success criteria 1–5 pass
- [ ] Léonard tries it on a real phone (`npm run dev -- --host` on the local network)
- [ ] Review, merge `feature/controls` → `develop` after "yes"

## Phase 5: Languages, theme, accessibility (`feature/i18n-theme`)

- [ ] **Task 11: Three languages and switcher**
  - Acceptance: `en.ts`, `fr.ts`, `nl.ts` typed against `en.ts` (missing key fails the build); `lang.ts` tests pass (`?lang` beats the browser, `nl-BE` → `nl`, unknown → `en`); `<html lang>` and `<title>` follow the language; switcher with the portfolio's flags updates `?lang=` via `replaceState`; "← Portfolio" points to `/<lang>`. NL texts shown to Léonard for review.
  - Verify: `npm test -- src/i18n`; playwright screenshots in the 3 languages, switcher open and closed.
  - Files: `src/i18n/en.ts`, `src/i18n/fr.ts`, `src/i18n/nl.ts`, `src/i18n/lang.ts`, `src/i18n/lang.test.ts`, `src/ui/language.ts`
  - Scope: M

- [ ] **Task 12: Theme toggle and accessibility polish**
  - Acceptance: theme toggle like the portfolio; canvas `role="img"` label (generation + cells) updated when paused; AA contrast verified for text, controls and cells in both themes; `prefers-contrast: more` and `prefers-reduced-motion` honoured.
  - Verify: playwright with emulated media (`dark`, `reduced-motion`, `contrast: more`); contrast ratios computed and listed.
  - Files: `src/ui/theme.ts`, `src/styles/tokens.css`, `src/styles/app.css`, `src/main.ts`
  - Scope: S

### Checkpoint D: Languages and theme

- [ ] Spec success criteria 6–7 pass
- [ ] Review, merge `feature/i18n-theme` → `develop` after "yes"

## Phase 6: Release prep (`feature/release-prep`)

- [ ] **Task 13: CSP check and deployment checklist**
  - Acceptance: `vite preview` serves `dist/` with the spec's CSP headers; no CSP violation in the console; zero requests to other origins; `docs/deployment-checklist.md` lists the headers, cache rules, the subdomain `life.leonard-fontaine.com`, and the steps on the portfolio side (DNS, Caddy block, GitHub Website field, admin visibility).
  - Verify: playwright console + network log on the preview, in Chrome and Firefox.
  - Files: `vite.config.ts`, `docs/deployment-checklist.md`
  - Scope: S

- [ ] **Task 14: README and GitHub repository**
  - Acceptance: English README (description, screenshot, local setup, stack, "© Léonard Fontaine. All rights reserved."); repo description proposed to Léonard; public repo `game-of-life` created with `gh` **after his "yes"**, Website field set to `https://life.leonard-fontaine.com`.
  - Verify: README renders on GitHub; `gh repo view` shows description and homepage.
  - Files: `README.md`, `docs/screenshot.png`
  - Scope: S

### Final checkpoint: Release v1.0.0

- [ ] All 10 spec success criteria met
- [ ] Full review before merge
- [ ] Merge `feature/release-prep` → `develop`, then `develop` → `main` ("Release v1.0.0"), annotated tag `v1.0.0`, push main, develop and tag, each after Léonard's "yes"
- [ ] Plan archived to `tasks/archive/01-game-of-life/`
