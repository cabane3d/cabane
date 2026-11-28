import { mm, type Point, type WallId } from '@cabane3d/core';
import { describe, expect, it } from 'vitest';
import {
  closesChain,
  drawsWall,
  extendChain,
  hasLength,
  pruneChain,
  restoreChain,
  startChain,
} from './wall-chain';

function at(x: number, y: number): Point {
  return { x: mm(x), y: mm(y) };
}

const first = 'first' as WallId;
const second = 'second' as WallId;

describe('wall chain', () => {
  it('continues from the end of the last wall', () => {
    const chain = extendChain(startChain(at(0, 0)), first, at(1000, 0));

    expect(chain.current).toEqual(at(1000, 0));
    expect(chain.first).toEqual(at(0, 0));
    expect(hasLength(chain, at(1000, 0))).toBe(false);
    expect(hasLength(chain, at(1000, 500))).toBe(true);
  });

  it('is closed by a wall ending on its first point, once it has a wall', () => {
    expect(closesChain(startChain(at(0, 0)), at(0, 0))).toBe(false);
    const chain = extendChain(startChain(at(0, 0)), first, at(1000, 0));
    expect(closesChain(chain, at(0, 0))).toBe(true);
    expect(closesChain(chain, at(0, 10))).toBe(false);
  });

  it('continues from the start of the walls removed from the project', () => {
    const chain = extendChain(
      extendChain(startChain(at(0, 0)), first, at(1000, 0)),
      second,
      at(1000, 1000),
    );

    const pruned = pruneChain(chain, (id) => id === first);

    expect(pruned.current).toEqual(at(1000, 0));
    expect(pruned.walls.map((wall) => wall.id)).toEqual([first]);
    expect(pruneChain(chain, () => true)).toBe(chain);
    expect(pruneChain(chain, () => false).current).toEqual(at(0, 0));
  });

  it('draws no wall back onto the start of its only wall, but closes a longer chain', () => {
    const single = extendChain(startChain(at(0, 0)), first, at(1000, 0));
    expect(drawsWall(single, at(0, 0))).toBe(false);
    expect(drawsWall(single, at(1000, 0))).toBe(false);
    expect(drawsWall(single, at(1000, 1000))).toBe(true);
    expect(drawsWall(startChain(at(0, 0)), at(1000, 0))).toBe(true);

    const longer = extendChain(single, second, at(1000, 1000));
    expect(drawsWall(longer, at(0, 0))).toBe(true);
    expect(closesChain(longer, at(0, 0))).toBe(true);
  });

  it('brings back the walls redone, in the order they were drawn', () => {
    const chain = extendChain(
      extendChain(startChain(at(0, 0)), first, at(1000, 0)),
      second,
      at(1000, 1000),
    );
    const none = pruneChain(chain, () => false);

    const one = restoreChain(none, (id) => id === first);
    expect(one.current).toEqual(at(1000, 0));
    expect(one.walls.map((wall) => wall.id)).toEqual([first]);

    const both = restoreChain(one, () => true);
    expect(both.current).toEqual(at(1000, 1000));
    expect(both.walls).toEqual(chain.walls);
    expect(both.undone).toEqual([]);
    expect(restoreChain(both, () => true)).toBe(both);
  });

  it('does not bring back a wall once a new wall was drawn', () => {
    const chain = extendChain(startChain(at(0, 0)), first, at(1000, 0));
    const redrawn = extendChain(
      pruneChain(chain, () => false),
      second,
      at(0, 1000),
    );

    expect(redrawn.undone).toEqual([]);
    expect(restoreChain(redrawn, () => true)).toBe(redrawn);
  });
});
