# Spec: Feature 2 — Pattern library (v1.1)

Status: **APPROVED**

## Objective

Let visitors drop famous Game of Life patterns on the board instead of drawing them cell by cell:
pick one from a library, a translucent preview follows the pointer, a click (or lifting the
finger) places it. The point is discovery: a visitor who has never heard of a glider gun can see
one fire within seconds.

## Decisions already taken (interview, 2026-10-23)

- **Library to place**, opened from a **"Patterns" button in the bottom bar** (shortcut `P`).
- **All four families**: spaceships, oscillators, guns and methuselahs, still lifes.
- **Ghost that follows**: on desktop, a translucent preview follows the mouse, a click places it,
  Escape or right click cancels; on touch, the preview follows the finger while it slides and the
  pattern lands when the finger lifts.
- **One placement per choice**: after placing, the board is back to drawing.
- **Later (not v1.1)**: rotate / flip before placing, pasting RLE text, copying a region of the
  board, placing the same pattern several times in a row.

## The patterns (17)

| Family               | Patterns                                                                      |
| -------------------- | ----------------------------------------------------------------------------- |
| Spaceships           | Glider, lightweight / middleweight / heavyweight spaceship (LWSS, MWSS, HWSS) |
| Oscillators          | Blinker, toad, beacon, pulsar, pentadecathlon                                 |
| Guns and methuselahs | Gosper glider gun, R-pentomino, acorn, diehard                                |
| Still lifes          | Block, beehive, loaf, boat                                                    |

Names in the three languages (FR / NL use the usual community names, English when there is none):

| EN                     | FR                         | NL                      |
| ---------------------- | -------------------------- | ----------------------- |
| Glider                 | Planeur                    | Glider                  |
| Lightweight spaceship  | Vaisseau léger             | Licht ruimteschip       |
| Middleweight spaceship | Vaisseau moyen             | Middelzwaar ruimteschip |
| Heavyweight spaceship  | Vaisseau lourd             | Zwaar ruimteschip       |
| Blinker                | Clignotant                 | Knipperlicht            |
| Toad                   | Crapaud                    | Pad                     |
| Beacon                 | Phare                      | Baken                   |
| Pulsar                 | Pulsar                     | Pulsar                  |
| Pentadecathlon         | Pentadécathlon             | Pentadecathlon          |
| Gosper glider gun      | Canon à planeurs de Gosper | Gosper-glidergeweer     |
| R-pentomino            | R-pentomino                | R-pentomino             |
| Acorn                  | Gland                      | Eikel                   |
| Diehard                | Diehard                    | Diehard                 |
| Block                  | Bloc                       | Blok                    |
| Beehive                | Ruche                      | Bijenkorf               |
| Loaf                   | Pain                       | Brood                   |
| Boat                   | Bateau                     | Boot                    |

## Behaviour

| Step       | Desktop                                                           | Touch                                                                        |
| ---------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Open       | "Patterns" button or `P`                                          | "Patterns" button                                                            |
| Choose     | Click a card; the panel closes, the ghost appears under the mouse | Tap a card; the panel closes                                                 |
| Aim        | The ghost follows the mouse, centred on it                        | Put a finger down: the ghost appears under it and follows it                 |
| Place      | Click                                                             | Lift the finger                                                              |
| Cancel     | Escape or right click                                             | Escape is not available: a "Cancel" chip shows above the bar while placing   |
| Pan / zoom | Still work while aiming (wheel, Space + drag, middle drag)        | Two fingers still pan and zoom; a gesture that became a pinch places nothing |

- **Keyboard users**: choosing a card with the keyboard (Enter / Space) places the pattern at the
  centre of the screen at once, since there is no pointer to aim with.
- Placing **adds** the pattern's cells to the board (it does not clear what is underneath), as one
  history entry: `J` undoes it.
- If placing would go past the 50,000-cell limit, nothing is placed and the limit message shows.
- The simulation keeps its play / pause state while aiming.
- The library panel is a native `popover` like the help: Escape and outside click close it.
- The help panel gains a "Patterns" line (`P` on desktop, the button on touch).

## Library panel

- Four sections, one per family, each a heading followed by a grid of cards.
- Each card is a `<button>`: a small drawing of the pattern (cells in the accent colour, scaled to
  fit a fixed square) and its name. Accessible name = the pattern's name.
- Fits a 390 px screen: two cards per row on phones, four or more on desktop; scrolls inside the
  panel if needed.

## Architecture

```
src/engine/rle.ts        → parseRle(text): Cell[]  (pure, tested)
src/engine/patterns.ts   → the 17 patterns as RLE strings + family  (tested against the engine)
src/ui/library.ts        → the panel, cards and their previews
src/input/pointer.ts     → a "placing" mode next to drawing
src/view/render.ts       → draws the ghost (accent colour, ~35 % opacity)
```

- **RLE** (run-length encoded) is the standard text format of Life patterns: `bo$2bo$3o!` is a
  glider. Storing patterns this way keeps them compact and easy to check against the references.
  The parser is internal: pasting RLE stays a "later" feature, but becomes easy to add.
- Pattern names live in the three dictionaries (`pattern.glider`, …).

## Testing Strategy

- **RLE parser (TDD)**: glider; run counts (`3o`); blank rows (`2$`); trailing dead cells omitted;
  header line (`x = 3, y = 3, rule = B3/S23`) and comments (`#N …`) ignored; invalid input throws.
- **Every pattern, against the engine** — this is what proves the data is right:
  - still lifes: unchanged after one generation;
  - oscillators: back to the start after their period (blinker, toad, beacon 2; pulsar 3;
    pentadecathlon 15), and not before;
  - spaceships: same shape shifted after their period (glider 4 → (1, 1); LWSS, MWSS, HWSS 4 →
    2 cells);
  - Gosper gun: 36 cells; population grows by one glider (5 cells) every 30 generations;
  - methuselahs: diehard dies out at generation 130; R-pentomino settles at generation 1103 with
    116 cells; acorn settles at generation 5206 with 633 cells (escaping gliders included: on an
    infinite board they simply fly on). The tests check these published figures.
- **Placement**: unit test of the "add pattern at offset" helper (cells added, existing cells kept,
  centred on the target cell).
- **UI (playwright-cli)**: open the library (button and `P`), place with the mouse, cancel with
  Escape, place by keyboard at the centre, place on touch (emulated), undo with `J`; light + dark,
  desktop + 390 px, Chrome + Firefox.

## Boundaries

- **Always**: branch `feature/pattern-library`; TDD for the parser and the pattern data; same
  visual language as the help panel; no new dependency.
- **Ask first**: the bar layout change on phones (see open question); any pattern added or removed.
- **Never**: fetching patterns from the network (everything is bundled); an RLE import field in
  this version.

## Success Criteria

1. The library opens with the button and with `P`, lists the 17 patterns in 4 families with
   previews, in FR / EN / NL.
2. On desktop, a chosen pattern follows the mouse as a ghost, lands on click, and Escape or right
   click cancels.
3. On a phone, the ghost follows the finger and lands when it lifts; a pinch places nothing; the
   Cancel chip works.
4. Keyboard users can place a pattern (at the centre of the screen).
5. Every pattern behaves as its tests describe (periods, speeds, lifespans).
6. A placed pattern is one undo step (`J`).
7. Everything still fits at 320–390 px; contrast AA; no new request at load (patterns are bundled).

## Decisions (round 2)

- On narrow screens the Patterns button ends the **first** row of the bar (after the generation
  counter), so the speed slider keeps its room on the second row.
- The acorn test runs the full 5,206 generations: it is the proof that the pattern is exact.

## Open Questions

None.
