/**
 * Anchors and snapping (specs/walls/draw-wall.feature, docs/api/walls.md). Pure and deterministic
 * (ADR-0006): plan points in millimeters in, plan points out.
 */
import { LENGTH_TOLERANCE, type Level, type Point, wallsOf } from '@cabane3d/core';

/** The snap distance, on screen, in pixels, whatever the zoom. An application constant. */
export const SNAP_DISTANCE_PX = 8;

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * The start and end points of the walls of `level`, in creation order (start, then end of each
 * wall). A point already listed, within `LENGTH_TOLERANCE`, is not listed again.
 */
export function anchorsOf(level: Level): readonly Point[] {
  const anchors: Point[] = [];
  for (const wall of wallsOf(level)) {
    for (const point of [wall.start, wall.end]) {
      if (!anchors.some((anchor) => distance(anchor, point) <= LENGTH_TOLERANCE)) {
        anchors.push(point);
      }
    }
  }
  return anchors;
}

/**
 * The nearest anchor at a distance of at most `SNAP_DISTANCE_PX * mmPerPixel` from `cursor` (the
 * limit included), or `null`. The first of equal distances wins.
 */
export function findSnapPoint(
  anchors: readonly Point[],
  cursor: Point,
  mmPerPixel: number,
): Point | null {
  const limit = SNAP_DISTANCE_PX * mmPerPixel;
  let nearest: Point | null = null;
  let nearestDistance = Number.POSITIVE_INFINITY;
  for (const anchor of anchors) {
    const candidate = distance(anchor, cursor);
    if (candidate <= limit && candidate < nearestDistance) {
      nearest = anchor;
      nearestDistance = candidate;
    }
  }
  return nearest;
}
