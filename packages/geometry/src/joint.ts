/**
 * Joints of walls that meet at an anchor (specs/walls/draw-wall.feature, docs/api/walls.md): the
 * mitre, or the bevel at a very sharp angle, that fills the outer corner of two walls sharing a
 * point, and the joints of the walls of a level, between neighbours around each shared point only.
 * A joint is not stored: it is derived from the walls. Pure and deterministic
 * (ADR-0006): plan points in millimeters in, plan points out.
 */
import { LENGTH_TOLERANCE, type Mm, mm, type Point, type Wall } from '@cabane3d/core';

/** A joint is cut off (bevel) when the meeting point is farther than this many times the larger thickness. */
export const MITRE_LIMIT = 2;

/**
 * Two walls are parallel (in line, or going back along each other) when the sine of the angle
 * between their directions is at most this. Unitless: the outer faces then have no meeting point
 * that can be computed reliably.
 */
const PARALLEL_TOLERANCE = 1e-9;

interface Vector {
  readonly x: number;
  readonly y: number;
}

function cross(a: Vector, b: Vector): number {
  return a.x * b.y - a.y * b.x;
}

function dot(a: Vector, b: Vector): number {
  return a.x * b.x + a.y * b.y;
}

function samePoint(a: Point, b: Point): boolean {
  return Math.hypot(a.x - b.x, a.y - b.y) <= LENGTH_TOLERANCE;
}

function moved(point: Point, direction: Vector, distance: number): Point {
  return { x: mm(point.x + direction.x * distance), y: mm(point.y + direction.y * distance) };
}

/** A wall seen from the shared point. */
interface Arm {
  /** Unit vector from the shared point towards the other end of the wall. */
  readonly away: Vector;
  /** Unit vector towards the thickness side: the right of the drawing direction. */
  readonly right: Vector;
  readonly thickness: Mm;
}

function armOf(wall: Wall, atStart: boolean): Arm {
  const dx = (wall.end.x - wall.start.x) / wall.length;
  const dy = (wall.end.y - wall.start.y) / wall.length;
  return {
    away: atStart ? { x: dx, y: dy } : { x: -dx, y: -dy },
    // Right of (dx, dy) is (dy, -dx) (docs/api/walls.md).
    right: { x: dy, y: -dx },
    thickness: wall.thickness,
  };
}

/**
 * The shared point and which end of each wall it is, trying in this order: end of `first` and
 * start of `second`, start of `first` and end of `second`, the two starts, the two ends.
 */
function sharedPoint(
  first: Wall,
  second: Wall,
): {
  readonly point: Point;
  readonly firstAtStart: boolean;
  readonly secondAtStart: boolean;
} | null {
  const candidates = [
    [false, true],
    [true, false],
    [true, true],
    [false, false],
  ] as const;
  for (const [firstAtStart, secondAtStart] of candidates) {
    const point = firstAtStart ? first.start : first.end;
    if (samePoint(point, secondAtStart ? second.start : second.end)) {
      return { point, firstAtStart, secondAtStart };
    }
  }
  return null;
}

/**
 * The outer corner of a wall at the shared point: the shared point when the other wall lies on the
 * thickness side (the outer face is the edge through the shared point), the shared point moved by
 * the thickness to the right otherwise (the outer face is the offset edge).
 */
function outerCorner(point: Point, arm: Arm, other: Arm): Point {
  return dot(other.away, arm.right) > 0 ? point : moved(point, arm.right, arm.thickness);
}

/** Twice the signed area of a polygon (shoelace formula), in square millimeters. */
function doubleArea(points: readonly Point[]): number {
  let sum = 0;
  points.forEach((point, index) => {
    const next = points[(index + 1) % points.length] ?? point;
    sum += point.x * next.y - next.x * point.y;
  });
  return sum;
}

/** The joint of two walls, with what `jointsOf` needs to find the walls that meet inside it. */
interface Corner {
  /** The shared point P. */
  readonly point: Point;
  /** The meeting point M of the outer faces, also when the polygon leaves it out (a bevel). */
  readonly meeting: Point;
  readonly first: Arm;
  readonly second: Arm;
  /** The polygon of `jointOf`. */
  readonly polygon: readonly Point[];
}

function cornerOf(first: Wall, second: Wall): Corner | null {
  const shared = sharedPoint(first, second);
  if (shared === null) return null;
  const { point } = shared;
  const a = armOf(first, shared.firstAtStart);
  const b = armOf(second, shared.secondAtStart);
  const sine = cross(a.away, b.away);
  if (Math.abs(sine) <= PARALLEL_TOLERANCE) return null;

  const cornerA = outerCorner(point, a, b);
  const cornerB = outerCorner(point, b, a);
  // M = cornerA + s * a.away = cornerB + t * b.away.
  const between = { x: cornerB.x - cornerA.x, y: cornerB.y - cornerA.y };
  const s = cross(between, b.away) / sine;
  const t = cross(between, a.away) / sine;
  // The faces are extended past the end of the walls: M must lie behind both outer corners.
  if (s >= -LENGTH_TOLERANCE || t >= -LENGTH_TOLERANCE) return null;
  const meeting = moved(cornerA, a.away, s);

  const limit = MITRE_LIMIT * Math.max(a.thickness, b.thickness);
  const mitre = Math.hypot(meeting.x - point.x, meeting.y - point.y) <= limit;
  const polygon = mitre ? [point, cornerB, meeting, cornerA] : [point, cornerB, cornerA];
  // No area: the walls turn towards their thickness, or both outer faces pass through P.
  if (Math.abs(doubleArea(polygon)) / 2 <= LENGTH_TOLERANCE * LENGTH_TOLERANCE) return null;
  return { point, meeting, first: a, second: b, polygon };
}

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
 * The faces are extended past the end of the walls: M must lie behind the outer corner of each
 * wall, seen from its away direction, by more than `LENGTH_TOLERANCE`. `null` when it does not,
 * when the walls are parallel, when the polygon has no area, or when they share no point.
 */
export function jointOf(first: Wall, second: Wall): readonly Point[] | null {
  return cornerOf(first, second)?.polygon ?? null;
}

/** A joint of two walls of a list. */
export interface Joint {
  /** The shared point. */
  readonly at: Point;
  /** The polygon of `jointOf`. */
  readonly points: readonly Point[];
}

/** The angle from `from` to `to`, counterclockwise, in radians, in `[0, 2π)`. */
function turnFrom(from: Vector, to: Vector): number {
  const angle = Math.atan2(cross(from, to), dot(from, to));
  return angle < 0 ? angle + 2 * Math.PI : angle;
}

/**
 * Whether `direction` lies strictly between the away directions of the two walls of `corner`, in
 * the angular sector that contains the direction from P to M. A direction along one of the two
 * walls (within `PARALLEL_TOLERANCE`) is on the edge of the sector, not inside it.
 */
function insideCorner(corner: Corner, direction: Vector): boolean {
  const from = corner.first.away;
  const toSecond = turnFrom(from, corner.second.away);
  const towardsMeeting = {
    x: corner.meeting.x - corner.point.x,
    y: corner.meeting.y - corner.point.y,
  };
  // The sector from the first wall to the second, counterclockwise, or the other one.
  const [low, high] =
    turnFrom(from, towardsMeeting) < toSecond ? [0, toSecond] : [toSecond, 2 * Math.PI];
  const angle = turnFrom(from, direction);
  return angle > low + PARALLEL_TOLERANCE && angle < high - PARALLEL_TOLERANCE;
}

/** The away directions of `wall` from its ends that lie within `LENGTH_TOLERANCE` of `point`. */
function awayDirectionsAt(wall: Wall, point: Point): readonly Vector[] {
  const directions: Vector[] = [];
  if (samePoint(wall.start, point)) directions.push(armOf(wall, true).away);
  if (samePoint(wall.end, point)) directions.push(armOf(wall, false).away);
  return directions;
}

/**
 * The joints of a list of walls (the walls of a level, in creation order): `jointOf` for each pair
 * `(i, j)` with `i < j`, ordered by `i` then `j`, without the `null` ones. A joint is dropped when
 * another wall of the list has a point within `LENGTH_TOLERANCE` of the shared point and its
 * direction away from that point lies strictly between the two walls, in the angular sector that
 * contains the direction from the shared point to M (neighbours around the point only).
 */
export function jointsOf(walls: readonly Wall[]): readonly Joint[] {
  const joints: Joint[] = [];
  walls.forEach((first, i) => {
    walls.forEach((second, j) => {
      if (j <= i) return;
      const corner = cornerOf(first, second);
      if (corner === null) return;
      const crowded = walls.some(
        (other, k) =>
          k !== i &&
          k !== j &&
          awayDirectionsAt(other, corner.point).some((away) => insideCorner(corner, away)),
      );
      if (!crowded) joints.push({ at: corner.point, points: corner.polygon });
    });
  });
  return joints;
}
