/**
 * Invariants of `jointOf` (docs/api/walls.md), checked with fast-check over walls that share a
 * point at any angle. The walls are built through the public API of core.
 */
import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  addWall,
  createProject,
  mm,
  type Point,
  setWallDefaults,
  type Wall,
  wallsOf,
} from '../../core/src/index';
import { jointOf, MITRE_LIMIT } from './index';

function at(x: number, y: number): Point {
  return { x: mm(x), y: mm(y) };
}

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Two walls drawn in a chain through `shared`, the second one `turn` radians from the first. */
function chain(
  shared: Point,
  heading: number,
  turn: number,
  thickness: number,
): readonly [Wall, Wall] {
  const project = createProject();
  const level = project.levels[0];
  if (!level) throw new Error('A new project has a level');
  setWallDefaults(project, { thickness: mm(thickness) });
  const length = 3000;
  const start = at(shared.x - length * Math.cos(heading), shared.y - length * Math.sin(heading));
  const end = at(
    shared.x + length * Math.cos(heading + turn),
    shared.y + length * Math.sin(heading + turn),
  );
  addWall(project, level.id, { start, end: shared });
  addWall(project, level.id, { start: shared, end });
  // A level is a snapshot: read it again after the commands.
  const [first, second] = wallsOf(project.levels[0] ?? level);
  if (!first || !second) throw new Error('The two walls were not added');
  return [first, second];
}

const coordinate = fc.double({ min: -10_000, max: 10_000, noNaN: true });
const angle = fc.double({ min: -Math.PI, max: Math.PI, noNaN: true });
const thickness = fc.double({ min: 50, max: 500, noNaN: true });

describe('jointOf invariants', () => {
  it('starts at the shared point and stays within the mitre limit of it', () => {
    fc.assert(
      fc.property(coordinate, coordinate, angle, angle, thickness, (x, y, heading, turn, t) => {
        const shared = at(x, y);
        const [first, second] = chain(shared, heading, turn, t);
        const joint = jointOf(first, second);
        if (joint === null) return;
        expect(joint.length === 3 || joint.length === 4).toBe(true);
        expect(distance(joint[0] ?? shared, shared)).toBeLessThanOrEqual(1e-9);
        for (const point of joint) {
          expect(distance(point, shared)).toBeLessThanOrEqual(MITRE_LIMIT * t + 1e-6);
        }
      }),
    );
  });

  it('has a joint only when the chain turns away from the thickness (to the left)', () => {
    fc.assert(
      fc.property(
        angle,
        fc.double({ min: 0.01, max: Math.PI - 0.01, noNaN: true }),
        fc.boolean(),
        (heading, turn, left) => {
          const [first, second] = chain(at(0, 0), heading, left ? turn : -turn, 200);
          expect(jointOf(first, second) !== null).toBe(left);
        },
      ),
    );
  });

  it('moves with the walls', () => {
    fc.assert(
      fc.property(coordinate, coordinate, angle, angle, (x, y, heading, turn) => {
        const here = jointOf(...chain(at(0, 0), heading, turn, 200));
        const there = jointOf(...chain(at(x, y), heading, turn, 200));
        expect(there === null).toBe(here === null);
        if (here === null || there === null) return;
        expect(there).toHaveLength(here.length);
        here.forEach((point, index) => {
          const moved = there[index];
          if (!moved) throw new Error(`No point ${index}`);
          expect(distance(moved, at(point.x + x, point.y + y))).toBeLessThanOrEqual(1e-6);
        });
      }),
    );
  });
});
