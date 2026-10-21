# Implementation Plan: Game of Life v1

Spec: [`specs/01-game-of-life.md`](../specs/01-game-of-life.md) (approved). Detailed tasks:
[`tasks/todo.md`](todo.md).

## Overview

A static TypeScript + Vite + Canvas 2D app: a pure engine and history (built test-first), a
camera, a canvas renderer, gesture and keyboard input, an HTML control bar, help panel, theme
and three languages. Output: a `dist/` folder that works under a strict CSP. Deployment itself
happens later, from the `portfolio` repo.

## Dependency graph

```
setup (repo, tooling)
  ├── engine ── history ─────────────┐
  └── page skeleton (tokens, fonts,  │
      theme-init)                    │
        └── camera + render + loop ──┤
              ├── draw / erase       │
              ├── zoom / pan         │
              └── control bar ◄──────┘
                    ├── speed, random, clear, cap
                    ├── tooltips + help panel
                    ├── mobile layout
                    ├── i18n + language switcher
                    └── theme toggle + a11y polish
                          └── CSP check, docs, README, GitHub repo
```

## Architecture decisions (from the spec)

- Live cells in a `Set<number>` (packed coordinates), `step()` pure. No tiles, no HashLife.
- One history for generations and edits (100 states), so `J` is also "undo".
- Camera math pure and tested. Render and input stay thin.
- Canvas colours read from CSS custom properties, so one source of truth for themes.
- No framework, no DOM test library: logic is unit-tested, UI is checked with `playwright-cli`.

## Git flow for this feature

- Task 0 creates `main` (spec, plan, tooling) and `develop`.
- One branch per phase: `feature/engine`, `feature/board`, `feature/controls`,
  `feature/i18n-theme`, `feature/release-prep`. Each is merged into `develop` with `--no-ff`
  at its checkpoint, after review and your "yes".
- One Conventional Commit per task (or a few, if a task has clear sub-steps).
- Release `v1.0.0` (develop → main, tag, push) only at the final checkpoint, after your "yes".

## Phases

1. **Setup**: Task 0.
2. **Engine** (TDD): Tasks 1–2. → Checkpoint A.
3. **Board**: Tasks 3–6. A glider runs on screen and can be drawn, zoomed and panned.
   → Checkpoint B.
4. **Controls**: Tasks 7–10. Every v1 feature is usable on desktop and at 390 px.
   → Checkpoint C.
5. **Languages, theme, accessibility**: Tasks 11–12. → Checkpoint D.
6. **Release prep**: Tasks 13–14. → Final checkpoint, release.

## Risks and Mitigations

| Risk                                                                              | Impact | Mitigation                                                                                                                                          |
| --------------------------------------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Set<number>` engine too slow for criterion 4 (30 gen/s, full 1080p soup at 8 px) | Med    | Measured in Task 6 with a soup benchmark. Fallback: reuse a typed-array neighbour count. The engine sits behind `step()`, so only one file changes. |
| Space doing two things (tap = play, hold+drag = pan) feels wrong                  | Low    | Built in Task 7 and checked by hand at Checkpoint C. Fallback: Space = play only, pan with middle drag.                                             |
| Gesture conflicts on touch (draw vs two-finger pan, page scroll/zoom)             | Med    | `touch-action: none` on the canvas; a stroke is cancelled if a second finger lands. Real-phone check at Checkpoint C.                               |
| Fonts or theme flash before first paint under a strict CSP                        | Low    | `public/theme-init.js` as an external blocking script; fonts bundled by Vite. Checked in Task 13.                                                   |
| Dependency versions < 2 weeks old                                                 | Low    | Versions listed with their publish dates in Task 0 for your approval before `npm install`.                                                          |
| Kaspersky TLS interception breaking `npm` or Playwright                           | Low    | Known cause, check it first if a network call fails.                                                                                                |

## Open Questions

None. Any question raised during the build gets added here and asked before acting.
