import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { lengthsEqual, mm, type Point, wallCorners } from '.';

function at(x: number, y: number): Point {
  return { x: mm(x), y: mm(y) };
}

describe('wallCorners', () => {
  it('puts the thickness to the right of start → end', () => {
    const corners = wallCorners(at(0, 0), at(1000, 0), mm(200));

    expect(corners).toEqual([at(0, 0), at(1000, 0), at(1000, -200), at(0, -200)]);
    expect(Object.isFrozen(corners)).toBe(true);
  });

  it('moves the end and the start by the thickness, perpendicular and to the right', () => {
    const coordinate = fc.integer({ min: -5000, max: 5000 });
    const thickness = fc.integer({ min: 1, max: 1000 });
    fc.assert(
      fc.property(
        coordinate,
        coordinate,
        coordinate,
        coordinate,
        thickness,
        (x1, y1, x2, y2, t) => {
          fc.pre(Math.hypot(x2 - x1, y2 - y1) > 1);
          const [start, end, endMoved, startMoved] = wallCorners(at(x1, y1), at(x2, y2), mm(t));
          const along = { x: end.x - start.x, y: end.y - start.y };

          for (const [from, to] of [
            [end, endMoved],
            [start, startMoved],
          ] as const) {
            const offset = { x: to.x - from.x, y: to.y - from.y };
            expect(lengthsEqual(mm(Math.hypot(offset.x, offset.y)), mm(t))).toBe(true);
            // Perpendicular, and to the right: the cross product along × offset is negative.
            const length = Math.hypot(along.x, along.y);
            expect(
              lengthsEqual(mm((along.x * offset.x + along.y * offset.y) / length), mm(0)),
            ).toBe(true);
            expect(along.x * offset.y - along.y * offset.x).toBeLessThan(0);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
