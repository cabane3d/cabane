# Walls API (test contract)

Contract for `specs/walls/draw-wall.feature` and `specs/walls/edit-wall.feature`. Test-writer, coder and reviewer follow it exactly: the names, types and results below are the only ones the tests may use. Anything not listed here is internal and must not be used by tests. A change to this contract is the maintainer's decision.

The two features share one contract. Each section says which feature needs it, so draw-wall can be built and merged before edit-wall: the sections marked *edit-wall* are not needed by draw-wall.

All lengths are `Mm` (ADR-0017). Tests compare them with `lengthsEqual`, never `===`. `Point` is defined in `docs/api/plan-view.md`.

## `core` (`@cabane3d/core`)

### Walls (draw-wall)

```ts
type WallId = string & { readonly __brand: 'WallId' };

interface Wall {
  readonly kind: 'wall';
  readonly id: WallId;
  readonly start: Point;
  readonly end: Point;
  readonly thickness: Mm;
  readonly height: Mm;
  /** Derived: the distance between `start` and `end`. */
  readonly length: Mm;
  /**
   * Derived: `start`, `end`, then `end` and `start` moved by `thickness` to the right of the
   * direction `start → end` (X right, Y up). Right of `(dx, dy)` is `(dy, -dx) / length`.
   */
  readonly corners: readonly [Point, Point, Point, Point];
}

/** `Element` was `never`: it is now the union of the element types. */
type Element = Wall;

function wallsOf(level: Level): readonly Wall[];
/** Live, like the other accessors; `undefined` for an id the project does not contain. */
function findWall(project: Project, wallId: WallId): Wall | undefined;
```

```ts
/**
 * The corners of a wall of the given start, end and thickness (same rule as `Wall.corners`).
 * Pure; `wallOf` uses it, and so does the plan for the wall being drawn. The distance between
 * `start` and `end` must not be zero.
 */
function wallCorners(start: Point, end: Point, thickness: Mm): readonly [Point, Point, Point, Point];

/**
 * Calls `listener` after every change of the project (a command, an undo, a redo), until the
 * returned function is called. For the interface only: a change itself goes through a command.
 */
function observeProject(project: Project, listener: () => void): () => void;
```

`Level.elements` contains the walls of the level, in creation order. `Level` and the other types are those of `docs/api/project.md`.

The document layout is extended in schema version 1, with no migration: no project file exists yet (the save feature is not specified). The `elements` of a level are stored in its Yjs map, and the undo manager tracks them (ADR-0004). The exact layout is internal.

### Commands (draw-wall)

Every command validates first, applies its change in a single Yjs transaction (one undo step) and, when refused, **throws a `CommandError`** and changes nothing: the elements are the same, `canUndo` is unchanged and `hasUnsavedChanges` is unchanged.

```ts
function addWall(
  project: Project,
  levelId: LevelId,
  wall: { readonly start: Point; readonly end: Point },
): WallId;

function undo(project: Project): void;
function redo(project: Project): void;

function setWallDefaults(
  project: Project,
  defaults: { readonly thickness?: Mm; readonly height?: Mm },
): void;

type CommandErrorCode =
  | 'last-level' | 'unknown-level'                      // existing
  | 'no-length' | 'unknown-wall'
  | 'non-positive-thickness' | 'non-positive-height' | 'non-positive-length';
```

- `addWall` takes the thickness and the height from `project.wallDefaults` at the time it is called. The points are stored as given (no rounding). It refuses with `unknown-level`, then with `no-length` when the distance between the two points is smaller than `LENGTH_TOLERANCE`.
- `undo` and `redo` undo and redo the last change of the project, one command at a time. They do nothing when `canUndo` / `canRedo` is `false`.
- `setWallDefaults` changes the defaults for the walls added afterwards, in one undo step; existing walls do not change. A thickness or height `<= 0` is refused with `non-positive-thickness` / `non-positive-height`. It is the only way for a test to start from other defaults and is not offered in the interface.

| Spec wording | Result |
|---|---|
| a wall is added from A to B on "Level 0" | `addWall(project, levelId, { start: A, end: B })`, `levelId` of the level named `Level 0` |
| a wall added … (Given) | the same call, in the Given |
| a new project whose default wall thickness is T and default wall height is H | `createProject()` then `setWallDefaults(project, { thickness: T, height: H })` |
| the addition is refused because the wall has no length | throws `CommandError` with `code === 'no-length'` |
| the addition is refused because the level does not exist | throws `CommandError` with `code === 'unknown-level'` (same way of building a level that does not exist as PROJ-011) |
| the last change is undone / redone | `undo(project)` / `redo(project)` |
| "Level 0" contains N walls (or no element) | `wallsOf(level).length === N` (`level.elements.length === 0`) |
| the wall starts at P and ends at Q | `start` and `end` of the only wall of the level, equal with `lengthsEqual` on both axes |
| the wall has a length / thickness / height of X | `wall.length`, `wall.thickness`, `wall.height`, with `lengthsEqual` |
| the wall covers the corners C1 C2 C3 C4 | `wall.corners`, each equal to the given corner with `lengthsEqual` |
| there is nothing to undo / to redo | `project.canUndo === false` / `project.canRedo === false` |

### Changing and deleting a wall (edit-wall)

```ts
function setWallThickness(project: Project, wallId: WallId, thickness: Mm): void;
function setWallHeight(project: Project, wallId: WallId, height: Mm): void;
/** Moves `end` along the direction `start → end`; `start` and the direction do not change. */
function setWallLength(project: Project, wallId: WallId, length: Mm): void;
function deleteWall(project: Project, wallId: WallId): void;
```

- Each refuses with `unknown-wall` first, then (for the setters) with `non-positive-thickness`, `non-positive-height` or `non-positive-length` when the value is `<= 0`.
- No other wall is ever changed by these commands, even one that shares a point.
- `deleteWall` is one undo step; undoing it brings back the wall with the same id, start, end, thickness and height.
- A wall that does not exist is built with an id the project never had: `'no-such-wall' as WallId`.

| Spec wording | Result |
|---|---|
| the thickness / height / length of the wall is set to X | `setWallThickness` / `setWallHeight` / `setWallLength` |
| the default wall thickness of the project is set to X | `setWallDefaults(project, { thickness: X })` |
| the wall is deleted | `deleteWall(project, wallId)` |
| the change is refused because the thickness / height / length must be positive | throws `CommandError` with `code` `'non-positive-thickness'` / `'non-positive-height'` / `'non-positive-length'` |
| the change / the deletion is refused because the wall does not exist | throws `CommandError` with `code === 'unknown-wall'` |
| the direction of the wall is still 45 degrees | `lengthsEqual(end.x - start.x, end.y - start.y)` with both positive |
| the wall has a length of X within the core tolerance | `lengthsEqual(wall.length, X)` |
| "Level 0" contains 1 wall with the same start, end, thickness and height | the wall is back, compared with the values before the deletion |
| the first / second wall | the walls of the level in creation order |

## `geometry` (`@cabane3d/geometry`) (draw-wall)

Pure and deterministic (ADR-0006). The package depends on `core` for `Level`, `Point` and `Mm`, and on nothing else.

```ts
/** On screen, in pixels, whatever the zoom. */
const SNAP_DISTANCE_PX = 8;

/**
 * The start and end points of the walls of `level`, in creation order (start, then end of each
 * wall). A point already listed, within `LENGTH_TOLERANCE`, is not listed again.
 */
function anchorsOf(level: Level): readonly Point[];

/**
 * The nearest anchor at a distance of at most `SNAP_DISTANCE_PX * mmPerPixel` from `cursor`
 * (the limit included), or `null`. The first of equal distances wins.
 */
function findSnapPoint(
  anchors: readonly Point[],
  cursor: Point,
  mmPerPixel: number,
): Point | null;
```

| Spec wording | Test |
|---|---|
| the anchor(s) A (and B) | the `anchors` array |
| a scale of 1 px = S mm / at a scale of 1 px = S mm | `mmPerPixel = S` |
| the snap point is looked up for the cursor at C | `findSnapPoint(anchors, C, mmPerPixel)` |
| the snap point is P / no anchor | the result equals `P` with `lengthsEqual` on both axes / is `null` |
| the anchors of "Level 0" are listed | `anchorsOf(level)` |
| the anchors are P, Q and R | the result equals `[P, Q, R]`, in this order |
| a wall added from A to B on "Level 0" (Given) | `addWall`, then the walls from `wallsOf(level)`: the first and the second wall of the level |
| the joint of the two walls is computed | `jointOf(first, second)` |
| the joint covers the points (x, y) … | the result has these points, in this order, each within `0.01` |
| the two walls have no joint | the result is `null` |

### Joints

```ts
/** A joint is cut off (bevel) when the meeting point is farther than this many times the larger thickness. */
const MITRE_LIMIT = 2;

/**
 * The joint of two walls that share a point, as the polygon to fill, or `null` (no joint).
 * The shared point is found with `LENGTH_TOLERANCE`, trying in this order: end of `first` and
 * start of `second`, start of `first` and end of `second`, the two starts, the two ends.
 *
 * Seen from the shared point P, each wall has an away direction (towards its other end) and a
 * thickness side (the right of its drawing direction). The outer face of a wall is the one on
 * the side away from the other wall: its edge through P, or its edge offset by the thickness.
 * M is where the two outer faces meet. The polygon is P, the outer corner of `second` at P, M,
 * the outer corner of `first` at P. The outer corner of a wall at P is P when its outer face is
 * the edge through P, and P moved by the thickness to the right of the wall otherwise. M is left
 * out (a bevel) when `|PM| > MITRE_LIMIT * max(thickness of the two walls)`.
 * `null` when the walls are parallel, when the polygon has no area, or when they share no point.
 */
function jointOf(first: Wall, second: Wall): readonly Point[] | null;
```

The examples of the spec fix the order of the points: P, the corner of `second`, M, the corner of `first` (a bevel: P, the corner of `second`, the corner of `first`).

## `ui` (`@cabane3d/ui`) (draw-wall)

The tool state of `docs/api/tool-bar.md` is extended: `type ToolId = 'select' | 'wall'`, and `W` is the shortcut of the Wall tool. Nothing else changes in its contract.

| Spec wording | Test |
|---|---|
| the active tool is the Wall tool (Given) | `state.choose('wall')` |
| the key W is pressed with Ctrl / Alt | `state.handleKey({ key: 'w', ctrl: true, … })` / `alt: true`, other modifiers `false` |
| the focus is in a text field | `inTextField: true` |

## Interface

Locators follow the glossary in `docs/design/main-window.md`. The Plan view is a canvas, so, like its view attributes (`docs/api/plan-view.md`), it exposes what it shows to tests and to assistive tools.

### Plan elements (draw-wall)

Inside the `Plan view` region, a visually hidden `list` named `Plan elements`, with one `listitem` per element. It is part of the interface (it describes the plan to a screen reader), not only for tests:

| Item | Attributes |
|---|---|
| a wall of the level, in creation order | `data-element="wall"`, `data-wall-id`, `data-start-x`, `data-start-y`, `data-end-x`, `data-end-y`, `data-thickness`, `data-height` (millimeters, numbers), `data-selected` (`"true"` or `"false"`); text `Wall from (<x> mm, <y> mm) to (<x> mm, <y> mm)` |
| an anchor, only while the Wall tool is active | `data-element="anchor"`, `data-x`, `data-y`, `data-snapped` (`"true"` for the one the cursor snaps to) |
| a joint of two walls, in the order of `jointOf` over the pairs of walls (first wall by creation order, then second) | `data-element="joint"`, `data-x`, `data-y` (the shared point), `data-points` (the polygon as JSON `[[x,y],…]`, millimeters, in the order of `jointOf`) |
| a handle, on each end of the selected wall (edit-wall) | `data-element="handle"`, `data-x`, `data-y` |

While a wall is being drawn, the `Plan view` region also has (updated by the renderer without going through React, they change at every mouse move): `data-drawing="true"` (`"false"` otherwise), `data-drawing-length` (the live length in millimeters) and `data-drawing-thickness`.

### Gestures

`pageX` / `pageY` are computed from a plan point as in `docs/api/plan-view.md`. The scale is the initial one (1 px = 10 mm), so the plan points of the scenarios land on whole pixels.

| Spec wording | Observed in the page |
|---|---|
| the user clicks the plan at P | `page.mouse.click(pageX, pageY)` |
| the user clicks the plan near P, a few pixels off | the same, at `(pageX + 3, pageY + 3)` |
| the user double-clicks the plan at P | `page.mouse.dblclick(pageX, pageY)` |
| the user right-clicks the plan at P | `page.mouse.click(pageX, pageY, { button: 'right' })` |
| the user moves the cursor to / near P | `page.mouse.move(pageX, pageY)` (`+ 3` on both axes for "near") |
| the user presses Escape / Ctrl+Z / Ctrl+Shift+Z | `page.keyboard.press('Escape')` / `'Control+z'` / `'Control+Shift+z'`, the focus on the page |
| the user clicked … / the user chooses … (Given) | the same gesture |
| the Wall tool is still active, the user chooses the Select tool | as in `docs/api/tool-bar.md` |
| the Tool bar contains the Select tool and the Wall tool, in this order | the buttons of the Tool bar are `Select tool` then `Wall tool` |
| the focus is on the Select tool, the user presses the Down arrow | `focus()` on the button, `page.keyboard.press('ArrowDown')` |
| the Wall tool is active and announced as pressed | `aria-pressed="true"` on `Wall tool` (`"false"` for "not pressed") |
| a tooltip shows "Wall tool" and the shortcut "W" | as in `docs/api/tool-bar.md` |
| a wall is drawn from A to B (Given) | press `W`, click A, double-click B, press `V`: the wall exists, the chain is ended and the Select tool is active |
| the project has N walls on "Level 0" / the plan shows N walls | the number of items `data-element="wall"` (Level 0 is the only level) |
| the project has no wall (yet) | no item `data-element="wall"` |
| that wall / the second wall starts at P and ends at Q | the `data-start-*` / `data-end-*` of the first / second wall item, within `0.01` |
| the second wall starts at exactly P | the same, equal to `P` exactly |
| the plan shows a wall being drawn with a length of L mm | `data-drawing="true"` and `data-drawing-length` within `0.01` of `L` |
| the plan shows no wall being drawn | `data-drawing="false"` |
| the plan shows a joint at P / no joint | an item `data-element="joint"` with `data-x` / `data-y` equal to `P` within `0.01` / none |
| that joint covers the points … | `data-points` of that item, each point within `0.01` |
| the plan shows an anchor at P and at Q / no anchor | items `data-element="anchor"` at those points / none |
| the plan marks the anchor at P as snapped | the anchor item at `P` has `data-snapped="true"` |
| the Undo / Redo button of the Top bar is disabled | `getByRole('banner', { name: 'Top bar' }).getByRole('button', { name: 'Undo' })` (`'Redo'`) is disabled |
| the user chooses / chose the Undo (Redo) button of the Top bar | click on that button |
| the plan matches its reference screenshot | `expect(planViewLocator).toHaveScreenshot('<id>.png')`, light theme, fake platform, scenario identifier as name |
| the Tool bar matches its reference screenshot | `expect(toolbarLocator).toHaveScreenshot('WALL-021.png')` |

Chain behaviours not covered by a scenario (maintainer's decisions on the review of draw-wall):

- A click that would close a chain of a single wall (back on the start of that wall) creates no wall: it is ignored, and the chain goes on.
- A redo during a chain brings the wall back into the chain, like the undo takes it out: drawing resumes from the end of the redone wall.
- Escape ends the chain without `preventDefault()`, so an open tooltip or menu closes on the same key press.

The Undo and Redo buttons are `IconButton`s named `Undo` and `Redo`, with the shortcut in their tooltip (`Ctrl+Z`, `Ctrl+Shift+Z`); `Ctrl+Z` and `Ctrl+Shift+Z` do nothing while the focus is in a text field.

### Selection and Properties panel (edit-wall)

The Properties panel is a `complementary` named `Properties`, on the right of the Main window.

| Spec wording | Observed in the page |
|---|---|
| the Properties panel is displayed | `getByRole('complementary', { name: 'Properties' })` is visible |
| it / the Properties panel shows "Nothing selected" | it has the text `Nothing selected` |
| the Properties panel shows "Wall" with a Length of L, a Thickness of T and a Height of H | a `heading` named `Wall`, and the `textbox` named `Length`, `Thickness`, `Height` with the values `L`, `T`, `H` (numbers in the display unit, millimeters: `3500`, `200`, `2500`) |
| the user clicks the plan inside the wall | click on the center of its footprint: the middle of the axis moved by half the thickness to the right of the direction |
| the user clicks the plan inside the first / second wall | the same, for that wall |
| the user clicks the plan on an empty part | click at the plan point (-2000 mm, -2000 mm), where the scenarios draw nothing |
| the wall / the first wall is selected (Given) | the Select tool is active (press `V`) and the click inside the wall |
| the wall is selected / only the second wall is selected / nothing is selected | the wall item has `data-selected="true"` / only the second one / no wall item has it |
| the plan shows a handle at each end of the wall | two items `data-element="handle"`, at the start and end points of the wall |
| the user sets the Thickness to "30 cm" in the Properties panel | `fill('30 cm')` then `press('Enter')` on the `Thickness` textbox |
| the user types "w" in the Thickness field | `focus()` the `Thickness` textbox, `page.keyboard.press('w')` |
| the user empties the Thickness field | `fill('')` then `press('Enter')` |
| the user chooses Delete | click on the `Delete` button of the `dialog` (`Keep` is the other button) |
| the plan shows the wall 300 mm thick | `data-thickness="300"` on the wall item |
| the wall ends at P | `data-end-x`, `data-end-y` of the wall item |
| the Properties panel shows a Thickness of 200 mm (after undo) | the `Thickness` textbox value is `200` |
| the plan and the Properties panel match their reference screenshot | `expect(mainWindowLocator).toHaveScreenshot('WALL-124.png')` |

## Platform

- `@e2e` and `@visual` scenarios run on the fake platform; `@electron` ones on the Electron platform. The window is at least 1280 × 720 px in both: the Plan view is then at least 1000 px wide once the Properties panel is shown, which holds every plan point used by the scenarios (±5000 mm horizontally, ±3000 mm vertically).
- These features add no IPC channel.
