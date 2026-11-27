/**
 * The wall element (specs/walls/draw-wall.feature, docs/api/walls.md): a straight segment of a
 * level, with a thickness and a height. Its length and its corners are derived from its stored
 * values, never stored.
 */
import { type Mm, mm, type Point } from './units';

/** Identifier of a wall, unique within its project. */
export type WallId = string & { readonly __brand: 'WallId' };

export interface Wall {
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

/** The stored values of a wall, from which the derived ones are computed. */
export interface WallValues {
  readonly id: WallId;
  readonly start: Point;
  readonly end: Point;
  readonly thickness: Mm;
  readonly height: Mm;
}

/** The distance between two plan points. */
export function distanceBetween(a: Point, b: Point): Mm {
  return mm(Math.hypot(b.x - a.x, b.y - a.y));
}

function freezePoint(point: Point): Point {
  return Object.freeze({ x: point.x, y: point.y });
}

/** Builds the read-only wall of the given stored values, with its length and corners. */
export function wallOf(values: WallValues): Wall {
  const { start, end, thickness } = values;
  const length = distanceBetween(start, end);
  // A stored wall always has a length (addWall refuses the others): the division is safe.
  const right = { x: (end.y - start.y) / length, y: -(end.x - start.x) / length };
  const offset = (point: Point): Point =>
    freezePoint({
      x: mm(point.x + right.x * thickness),
      y: mm(point.y + right.y * thickness),
    });
  return Object.freeze({
    kind: 'wall',
    id: values.id,
    start: freezePoint(start),
    end: freezePoint(end),
    thickness,
    height: values.height,
    length,
    corners: Object.freeze([
      freezePoint(start),
      freezePoint(end),
      offset(end),
      offset(start),
    ] as const),
  });
}
