# Plan view API (test contract)

Contract for `specs/plan/plan-view.feature`. Test-writer, coder and reviewer follow it exactly: the names, types and results below are the only ones the tests may use. Anything not listed here is internal and must not be used by tests. A change to this contract is the maintainer's decision.

## `core` (`@cabane3d/core`)

This feature adds the plan point type, used by the view and by the walls:

```ts
/** A point of the plan, in millimeters (X to the right, Y up, ADR-0017). */
interface Point {
  readonly x: Mm;
  readonly y: Mm;
}
```

Exported from the package index, with the `Mm` helpers of `units.ts`.

## `renderer` (`@cabane3d/renderer`)

The view is a plain, immutable value and its operations are pure functions: no DOM, no Three.js, no Canvas (the conversion is the "view transform" of ADR-0017). They live in `packages/renderer`, in the plan module. The package depends on `core` for `Point`.

```ts
interface ScreenPoint {
  readonly x: number; // pixels, from the top-left corner of the Plan view, X to the right
  readonly y: number; // pixels, Y down
}

interface PlanView {
  readonly width: number;   // size of the Plan view, in pixels
  readonly height: number;
  readonly scale: number;   // screen pixels per millimeter: 0.1 is "1 px = 10 mm"
  readonly origin: ScreenPoint; // where the plan origin (0 mm, 0 mm) is on screen
}

/** Scale 0.1 (1 px = 10 mm), origin at the center of the view. */
function createPlanView(width: number, height: number): PlanView;

function planToScreen(view: PlanView, point: Point): ScreenPoint;
function screenToPlan(view: PlanView, point: ScreenPoint): Point;

/**
 * Each notch multiplies the scale by 1.1 (`notches > 0`, zoom in) or divides it by 1.1
 * (`notches < 0`, zoom out), the scale staying within [0.01, 1] (1 px = 100 mm .. 1 px = 1 mm).
 * The plan point under `cursor` does not move on screen. Returns the same view when the scale is
 * already at the limit.
 */
function zoomView(view: PlanView, notches: number, cursor: ScreenPoint): PlanView;

/** Moves the plan by `(dx, dy)` pixels under the cursor: the origin moves, the scale does not. */
function panView(view: PlanView, dx: number, dy: number): PlanView;

/** The zoom as a percentage: 100 at scale 0.1, 1000 at scale 1, 10 at scale 0.01. Not rounded. */
function zoomPercent(view: PlanView): number;
```

### Spec wording

| Spec wording | Test |
|---|---|
| a view of W px by H px at 1 px = S mm with the plan origin at the center | `{ width: W, height: H, scale: 1 / S, origin: { x: W / 2, y: H / 2 } }` |
| a view of W px by H px at 1 px = S mm with the plan origin at screen (X, Y) | the same with `origin: { x: X, y: Y }` |
| a view of W px by H px is created | `createPlanView(W, H)` |
| the plan point P is converted to screen coordinates | `planToScreen(view, P)` |
| converting that screen point back gives the plan point P | `screenToPlan(view, screen)` equals `P` with `lengthsEqual` on both axes |
| the view is zoomed in / out by N notches with the cursor at screen (X, Y) | `zoomView(view, N, { x: X, y: Y })` / `zoomView(view, -N, …)` |
| the plan point under the screen point S is the same as before | `screenToPlan` of S before and after, equal with `lengthsEqual` |
| the scale is 1 px = M mm | `Math.abs(1 / view.scale - M) < 0.001` |
| the zoom is Z% | `Math.abs(zoomPercent(view) - Z) < 0.001` |
| the plan origin is at screen (X, Y) | `view.origin` equals `(X, Y)` within `0.001` px |
| the plan is moved by (DX, DY) px | `panView(view, DX, DY)` |

## Interface

Locators follow the glossary in `docs/design/main-window.md`. The Plan view is a `region` named `Plan view`; the plan itself is drawn on a canvas inside it, so the region also exposes its view as attributes, updated by the renderer without going through React (they change at every gesture):

| Attribute on the `Plan view` region | Value |
|---|---|
| `data-scale` | the scale, pixels per millimeter (`0.1` at the start) |
| `data-origin-x`, `data-origin-y` | the position of the plan origin, in pixels from the top-left corner of the region |

The Status bar is a `contentinfo` named `Status bar`, at the bottom of the Main window, with the text `Zoom <percent>%` (percent rounded to an integer) and, while the cursor is over the Plan view, the text `x <X> mm · y <Y> mm` (coordinates rounded to an integer, in the display unit, millimeters by default).

Steps convert plan points to the page with the region's bounding box `box` and its attributes:
`pageX = box.x + originX + P.x * scale`, `pageY = box.y + originY - P.y * scale`. They use plan points that land on whole pixels at the scale of the scenario.

| Spec wording | Observed in the page |
|---|---|
| the Plan view is displayed | `getByRole('region', { name: 'Plan view' })` is visible |
| the Status bar is displayed | `getByRole('contentinfo', { name: 'Status bar' })` is visible |
| the Status bar shows a zoom of Z% | the Status bar has the text `Zoom Z%` |
| the cursor is at / the user moves the cursor to the plan point P | `page.mouse.move(pageX, pageY)` |
| the user turns the wheel up / down by N notches | `page.mouse.wheel(0, -100)` / `page.mouse.wheel(0, 100)`, N times: each wheel event is one notch, its direction (the sign of `deltaY`) decides |
| the plan point under the cursor is still P | converting the cursor position back with the attributes gives P within 1 pixel (`1 / scale` mm) on each axis |
| the user moves the plan with the middle button by (DX, DY) px | `mouse.down({ button: 'middle' })`, `mouse.move` by `(DX, DY)`, `mouse.up({ button: 'middle' })` |
| the user moves the plan with the Space key and the left button by (DX, DY) px | `keyboard.down('Space')`, `mouse.down()`, `mouse.move` by `(DX, DY)`, `mouse.up()`, `keyboard.up('Space')` |
| the plan origin has moved by (DX, DY) px on screen | `data-origin-x` / `data-origin-y` changed by exactly `DX` / `DY` |
| the user moved the plan … (Given) | the same gesture |
| the Status bar shows "x 1250 mm · y 830 mm" | the Status bar has exactly that text for the coordinates |

The scenarios assume a window of at least 1280 × 720 px, so the Plan view is at least 1000 px wide at the start (±5000 mm around the origin at the initial scale).

## Platform

- `@e2e` scenarios run on the fake platform; `@electron` ones on the Electron platform. The window is at least 1280 × 720 px in both.
- This feature adds no IPC channel.

## Implementation decisions

Decided by the maintainer; not covered by a scenario, but binding for coder and reviewer.

- **Resizing the Plan view** (window resized, Catalog shown or hidden): the plan point at the center of the view stays at the center. The scale does not change.
- **High-frequency state stays out of React.** The cursor coordinates in the Status bar are written straight to the DOM: React renders the Status bar once, with a ref on the coordinates element, and the renderer's cursor event updates its `textContent` without `setState` or a store. The zoom text only changes with the wheel and may be rendered by React.
