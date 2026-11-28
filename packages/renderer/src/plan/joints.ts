/**
 * The joints the plan shows (specs/walls/draw-wall.feature, docs/api/walls.md): one for every pair
 * of walls of the level that `jointOf` joins. A joint is not stored: it is derived from the walls
 * every time they change.
 */
import type { Point, Wall } from '@cabane3d/core';
import { jointOf } from '@cabane3d/geometry';

/** A joint of two walls of the plan. */
export interface PlanJoint {
  /** The point the two walls share. */
  readonly at: Point;
  /** The polygon to fill, in the order of `jointOf`. */
  readonly points: readonly Point[];
}

/**
 * The joints of `walls`, in the order of `jointOf` over the pairs of walls: the first wall by
 * creation order, then the second.
 */
export function jointsOf(walls: readonly Wall[]): readonly PlanJoint[] {
  const joints: PlanJoint[] = [];
  walls.forEach((first, index) => {
    for (const second of walls.slice(index + 1)) {
      const points = jointOf(first, second);
      // `jointOf` starts its polygon with the shared point.
      const at = points?.[0];
      if (points && at) joints.push({ at, points });
    }
  });
  return joints;
}
