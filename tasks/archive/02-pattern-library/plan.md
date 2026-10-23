# Implementation Plan: Pattern library (v1.1)

Spec: [`specs/02-pattern-library.md`](../../../specs/02-pattern-library.md) (approved). Detailed tasks:
[`tasks/todo.md`](todo.md).

## Overview

A bundled library of 17 famous patterns, stored as RLE and proven by tests against the engine,
opened from a new "Patterns" button and placed on the board with a ghost that follows the mouse or
the finger. Ships as v1.1.0.

## Dependency graph

```
RLE parser ── pattern data (+ behaviour tests) ── library panel ── placing (desktop)
                                                                        └── placing (touch)
```

## Architecture decisions

- Patterns are RLE strings in `src/engine/patterns.ts`; the parser in `src/engine/rle.ts` is pure
  and tested. Names come from the three dictionaries (`pattern.<id>`).
- A pure `stamp(cells, pattern, x, y)` helper adds a pattern centred on a cell; `main.ts` wraps it
  in one history entry and the cell-limit check, like a stroke.
- Placing is a mode of `pointer.ts` (next to drawing); the ghost is drawn by `render.ts` in the
  accent colour at ~35 % opacity.
- Card previews are SVG built from the pattern's cells (no extra canvas).

## Git flow

- One branch, `feature/pattern-library`, from `develop`; its first commit holds this spec and plan.
- One Conventional Commit per task; review and merge into `develop` at the final checkpoint, then
  release `v1.1.0` (develop → main, tag, push), each after Léonard's "yes".

## Risks and Mitigations

| Risk                                                           | Impact | Mitigation                                                                               |
| -------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------- |
| A pattern copied wrong (one cell off)                          | Med    | Behaviour tests per pattern (periods, speeds, lifespans) fail at once.                   |
| Reference figures recalled wrong (diehard, R-pentomino, acorn) | Low    | Cross-check any failing figure against a second source before touching the pattern.      |
| Ghost + drawing + pan gestures conflicting on touch            | Med    | Placing is a separate pointer mode; pinch keeps cancelling; real-phone check at the end. |
| Bar overflow on phones                                         | Low    | Patterns button on the first row (decided); measured at 320 / 360 / 390 px.              |
| Slower test suite (acorn: 5,206 generations)                   | Low    | Measured in Task 2; acceptable if the whole suite stays under ~10 s.                     |

## Open Questions

None.
