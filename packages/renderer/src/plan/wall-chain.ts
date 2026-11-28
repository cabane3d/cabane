/**
 * The chain of walls being drawn with the Wall tool (specs/walls/draw-wall.feature): an immutable
 * value and pure functions. The chain only remembers what it drew; the walls themselves are in the
 * project, created through core commands by the interface (ADR-0004).
 */
import { LENGTH_TOLERANCE, type Point, type WallId } from '@cabane3d/core';

/** A wall drawn by the chain. */
interface ChainWall {
  readonly id: WallId;
  readonly start: Point;
}

/** A wall the chain drew that an undo took out, with its end point, for a redo to bring back. */
interface UndoneWall extends ChainWall {
  readonly end: Point;
}

export interface WallChain {
  /** The first point of the chain: a click there closes it. */
  readonly first: Point;
  /** The start point of the next wall: the end of the last wall drawn, or the first point. */
  readonly current: Point;
  /** The walls drawn by this chain, in order, with their start points. */
  readonly walls: readonly ChainWall[];
  /** The walls an undo took out of the chain, the next one to redo last. */
  readonly undone: readonly UndoneWall[];
}

function samePoint(a: Point, b: Point): boolean {
  return Math.hypot(a.x - b.x, a.y - b.y) < LENGTH_TOLERANCE;
}

/** A chain started at `point`, with no wall yet. */
export function startChain(point: Point): WallChain {
  return { first: point, current: point, walls: [], undone: [] };
}

/** Whether a wall from the current point to `point` would have a length. */
export function hasLength(chain: WallChain, point: Point): boolean {
  return !samePoint(chain.current, point);
}

/**
 * Whether a click at `point` draws a wall from the current point. Not when the wall would have no
 * length, nor when it would close a chain of a single wall: it would lie on top of that wall
 * (maintainer's decision, docs/api/walls.md). That click is ignored and the chain goes on.
 */
export function drawsWall(chain: WallChain, point: Point): boolean {
  if (!hasLength(chain, point)) return false;
  return !(chain.walls.length === 1 && samePoint(chain.first, point));
}

/** Whether a wall ending at `point` closes the chain: it has walls and `point` is its first point. */
export function closesChain(chain: WallChain, point: Point): boolean {
  return chain.walls.length > 0 && samePoint(chain.first, point);
}

/**
 * The chain after the wall `id`, from the current point to `end`, was drawn. A new wall clears what
 * an undo took out, as it clears the redo history of the project.
 */
export function extendChain(chain: WallChain, id: WallId, end: Point): WallChain {
  return {
    ...chain,
    current: end,
    walls: [...chain.walls, { id, start: chain.current }],
    undone: [],
  };
}

/**
 * The chain once the walls it drew that are no longer in the project are left out, from its last
 * one: after an undo, drawing continues from the start of the wall that was removed. The walls left
 * out are kept, for {@link restoreChain}.
 */
export function pruneChain(chain: WallChain, exists: (id: WallId) => boolean): WallChain {
  let { walls, current, undone } = chain;
  while (walls.length > 0) {
    const last = walls[walls.length - 1];
    if (!last || exists(last.id)) break;
    undone = [...undone, { ...last, end: current }];
    current = last.start;
    walls = walls.slice(0, -1);
  }
  return walls === chain.walls ? chain : { ...chain, current, walls, undone };
}

/**
 * The chain once the walls an undo took out that are back in the project are back in it, in the
 * order they were drawn: after a redo, drawing continues from the end of the wall redone.
 */
export function restoreChain(chain: WallChain, exists: (id: WallId) => boolean): WallChain {
  let { walls, current, undone } = chain;
  while (undone.length > 0) {
    const next = undone[undone.length - 1];
    if (!next || !exists(next.id)) break;
    walls = [...walls, { id: next.id, start: next.start }];
    current = next.end;
    undone = undone.slice(0, -1);
  }
  return undone === chain.undone ? chain : { ...chain, current, walls, undone };
}
