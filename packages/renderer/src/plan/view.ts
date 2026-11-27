import { mm, type Point } from '@cabane3d/core';

/**
 * The view transform of the Plan view (ADR-0017, docs/api/plan-view.md): an immutable value and
 * pure functions, with no DOM, Canvas or Three.js. Plan points are in millimeters with Y up;
 * screen points are in pixels from the top-left corner of the Plan view, with Y down.
 */

/** A point of the Plan view, in pixels from its top-left corner (X to the right, Y down). */
export interface ScreenPoint {
  readonly x: number;
  readonly y: number;
}

export interface PlanView {
  /** Size of the Plan view, in pixels. */
  readonly width: number;
  readonly height: number;
  /** Screen pixels per millimeter: 0.1 is "1 px = 10 mm". */
  readonly scale: number;
  /** Where the plan origin (0 mm, 0 mm) is on screen. */
  readonly origin: ScreenPoint;
}

/** Scale of a new view: 1 px = 10 mm, shown as a zoom of 100%. */
const INITIAL_SCALE = 0.1;
/** Smallest scale: 1 px = 100 mm (zoom 10%). */
const MIN_SCALE = 0.01;
/** Largest scale: 1 px = 1 mm (zoom 1000%). */
const MAX_SCALE = 1;
/** Each wheel notch multiplies or divides the scale by this factor. */
const NOTCH_FACTOR = 1.1;

/** A view of `width` by `height` px at 1 px = 10 mm, with the plan origin at its center. */
export function createPlanView(width: number, height: number): PlanView {
  return { width, height, scale: INITIAL_SCALE, origin: { x: width / 2, y: height / 2 } };
}

export function planToScreen(view: PlanView, point: Point): ScreenPoint {
  return {
    x: view.origin.x + point.x * view.scale,
    y: view.origin.y - point.y * view.scale,
  };
}

export function screenToPlan(view: PlanView, point: ScreenPoint): Point {
  return {
    x: mm((point.x - view.origin.x) / view.scale),
    y: mm((view.origin.y - point.y) / view.scale),
  };
}

/**
 * Zooms by `notches` wheel notches (positive: in, negative: out) toward `cursor`: the plan point
 * under the cursor stays in place. The scale stays within its limits; at a limit, the same view is
 * returned.
 */
export function zoomView(view: PlanView, notches: number, cursor: ScreenPoint): PlanView {
  const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, view.scale * NOTCH_FACTOR ** notches));
  if (scale === view.scale) return view;
  const anchor = screenToPlan(view, cursor);
  return {
    ...view,
    scale,
    origin: { x: cursor.x - anchor.x * scale, y: cursor.y + anchor.y * scale },
  };
}

/** Moves the plan by `(dx, dy)` pixels: the origin moves, the scale does not. */
export function panView(view: PlanView, dx: number, dy: number): PlanView {
  return { ...view, origin: { x: view.origin.x + dx, y: view.origin.y + dy } };
}

/** The zoom as a percentage: 100 at scale 0.1 (1 px = 10 mm). Not rounded. */
export function zoomPercent(view: PlanView): number {
  return view.scale * (100 / INITIAL_SCALE);
}

/**
 * The view resized to `width` by `height` px: the plan point at the center of the view stays at the
 * center, and the scale does not change (docs/api/plan-view.md, implementation decisions).
 */
export function resizeView(view: PlanView, width: number, height: number): PlanView {
  return {
    ...view,
    width,
    height,
    origin: {
      x: view.origin.x + (width - view.width) / 2,
      y: view.origin.y + (height - view.height) / 2,
    },
  };
}
