# Todo: Pattern library (v1.1)

Standing bar for every task: `npm test`, `npm run lint`, `npm run format:check` and
`npm run build` pass; one Conventional Commit, no assistant attribution. Every visible change
is checked with `playwright-cli` in light + dark, desktop + ~390 px, Chrome + Firefox.

## Phase 1: Data (`feature/pattern-library`, TDD)

- [x] **Task 1: RLE parser**
  - Acceptance: `parseRle` handles runs, blank rows (`2$`), omitted trailing dead cells, a header
    line and `#` comments; throws on invalid input; returns cells relative to the top-left corner.
  - Verify: `npm test -- src/engine/rle.test.ts`; coverage ≥ 90 %.
  - Files: `src/engine/rle.ts`, `src/engine/rle.test.ts`
  - Scope: S

- [ ] **Task 2: The 17 patterns and `stamp()`**
  - Acceptance: every pattern passes its behaviour test from the spec (still lifes, periods,
    spaceship shifts, Gosper gun +5 cells / 30 gens, diehard 130, R-pentomino 1103 / 116,
    acorn 5206 / 633); `stamp` adds cells centred on a target and keeps existing ones.
  - Verify: `npm test -- src/engine/patterns.test.ts`; suite duration noted.
  - Files: `src/engine/patterns.ts`, `src/engine/patterns.test.ts`
  - Scope: M

### Checkpoint A: Data

- [ ] All tests pass, coverage ≥ 90 % on `src/engine`; suite duration reported to Léonard

## Phase 2: Interface

- [ ] **Task 3: Library panel**
  - Acceptance: "Patterns" button (tooltip with `P`) and `P` open a popover with 4 family
    sections and 17 cards (SVG preview + name) in FR / EN / NL; two cards per row at 390 px;
    on narrow screens the button ends the bar's first row; help panel lists `P` / the button.
  - Verify: playwright screenshots (both themes, desktop + 320 / 390 px, both browsers); the
    i18n key test covers the new keys.
  - Files: `index.html`, `src/ui/library.ts`, `src/i18n/{en,fr,nl}.ts`, `src/styles/app.css`,
    `src/input/keyboard.ts`
  - Scope: M

- [ ] **Task 4: Placing on desktop and by keyboard**
  - Acceptance: a chosen card shows a ghost that follows the mouse; click places it (one history
    entry, cell limit respected); Escape / right click cancel; pan and zoom still work while
    aiming; choosing a card by keyboard places it at the screen centre.
  - Verify: playwright: place, cancel, undo with `J`, keyboard placement; cell counts checked.
  - Files: `src/input/pointer.ts`, `src/view/render.ts`, `src/main.ts`, `src/ui/library.ts`
  - Scope: M

- [ ] **Task 5: Placing on touch**
  - Acceptance: the ghost appears under the finger, follows it and lands on lift; a pinch places
    nothing; a "Cancel" chip above the bar ends placing mode.
  - Verify: emulated touch events in both browsers; real-phone check at the final checkpoint.
  - Files: `src/input/pointer.ts`, `index.html`, `src/styles/app.css`, `src/main.ts`
  - Scope: S

### Final checkpoint: Release v1.1.0

- [ ] All 7 spec success criteria met; Léonard tries it on his phone
- [ ] Review, merge `feature/pattern-library` → `develop` after "yes"
- [ ] Release: `develop` → `main` ("Release v1.1.0"), tag `v1.1.0`, push, each after "yes"
- [ ] Plan archived to `tasks/archive/02-pattern-library/`; redeploy from the portfolio repo
