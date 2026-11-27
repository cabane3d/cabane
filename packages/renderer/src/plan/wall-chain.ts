/**
 * The chain of walls being drawn with the Wall tool (specs/walls/draw-wall.feature): an immutable
 * value and pure functions. The chain only remembers what it drew; the walls themselves are in the
 * project, created through core commands by the interface (ADR-0004).
 */
import { LENGTH_TOLERANCE, type Point, type WallId } from '@cabane3d/core';

export interface WallChain {
  /** The first point of the chain: a click there closes it. */
  readonly first: Point;
  /** The start point of the next wall: the end of the last wall drawn, or the first point. */
  readonly current: Point;
  /** The walls drawn by this chain, in order, with their start points. */
  readonly walls: readonly { readonly id: WallId; readonly start: Point }[];
}

function samePoint(a: Point, b: Point): boolean {
  return Math.hypot(a.x - b.x, a.y - b.y) < LENGTH_TOLERANCE;
}

/** A chain started at `point`, with no wall yet. */
export function startChain(point: Point): WallChain {
  return { first: point, current: point, walls: [] };
}

/** Whether a wall from the current point to `point` would have a length. */
export function hasLength(chain: WallChain, point: Point): boolean {
  return !samePoint(chain.current, point);
}

/** Whether a wall ending at `point` closes the chain: it has walls and `point` is its first point. */
export function closesChain(chain: WallChain, point: Point): boolean {
  return chain.walls.length > 0 && samePoint(chain.first, point);
}

/** The chain after the wall `id`, from the current point to `end`, was drawn. */
export function extendChain(chain: WallChain, id: WallId, end: Point): WallChain {
  return { ...chain, current: end, walls: [...chain.walls, { id, start: chain.current }] };
}

/**
 * The chain once the walls it drew that are no longer in the project are left out, from its last
 * one: after an undo, drawing continues from the start of the wall that was removed.
 */
export function pruneChain(chain: WallChain, exists: (id: WallId) => boolean): WallChain {
  let { walls, current } = chain;
  while (walls.length > 0) {
    const last = walls[walls.length - 1];
    if (!last || exists(last.id)) break;
    current = last.start;
    walls = walls.slice(0, -1);
  }
  return walls === chain.walls ? chain : { ...chain, current, walls };
}
