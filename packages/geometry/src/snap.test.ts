/**
 * Anchors and snapping: the scenarios of specs/walls/draw-wall.feature that run at unit level.
 * Tests use the public API of geometry (docs/api/walls.md) and the public API of core to build
 * the walls (imported by relative path: geometry depends on core only).
 */
import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  addWall,
  createProject,
  type Level,
  type LevelId,
  lengthsEqual,
  mm,
  type Point,
  type Project,
} from '../../core/src/index';
import { anchorsOf, findSnapPoint, SNAP_DISTANCE_PX } from './index';

/** A point of the plan, in millimeters. */
function at(x: number, y: number): Point {
  return { x: mm(x), y: mm(y) };
}

function expectPoint(actual: Point | null, expected: Point): void {
  expect(actual).not.toBeNull();
  if (actual === null) return;
  expect(lengthsEqual(actual.x, expected.x), `${actual.x} mm is not ${expected.x} mm`).toBe(true);
  expect(lengthsEqual(actual.y, expected.y), `${actual.y} mm is not ${expected.y} mm`).toBe(true);
}

function levelZero(project: Project): Level {
  const level = project.levels.find((candidate) => candidate.name === 'Level 0');
  if (!level) throw new Error('The project has no level named "Level 0"');
  return level;
}

/** Distance between two points, in millimeters. */
function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

describe('snapping to anchors', () => {
  const anchors = [at(0, 0), at(3500, 0)];

  it.each([
    { label: 'the cursor close to the first anchor', cursor: at(60, 30), expected: at(0, 0) },
    {
      label: 'the cursor close to the second anchor',
      cursor: at(3450, -40),
      expected: at(3500, 0),
    },
    { label: 'the cursor far from any anchor', cursor: at(200, 0), expected: null },
    { label: 'the cursor exactly at the snap distance', cursor: at(80, 0), expected: at(0, 0) },
    { label: 'the cursor just beyond the snap distance', cursor: at(81, 0), expected: null },
  ])('@WALL-008 at 1 px = 10 mm, $label', ({ cursor, expected }) => {
    const snapped = findSnapPoint(anchors, cursor, 10);

    if (expected === null) {
      expect(snapped).toBeNull();
    } else {
      expectPoint(snapped, expected);
    }
  });

  it('@WALL-008 the nearest anchor within the snap distance is chosen, whatever the anchors', () => {
    const coordinate = fc.integer({ min: -5000, max: 5000 });
    const point = fc.record({ x: coordinate, y: coordinate });
    const scale = fc.integer({ min: 1, max: 100 });
    fc.assert(
      fc.property(
        fc.array(point, { minLength: 1, maxLength: 8 }),
        point,
        scale,
        (listed, cursor, mmPerPixel) => {
          const points = listed.map(({ x, y }) => at(x, y));
          const pointer = at(cursor.x, cursor.y);
          const limit = SNAP_DISTANCE_PX * mmPerPixel;
          // The first of equal distances wins.
          const nearest = points.reduce((best, candidate) =>
            distance(candidate, pointer) < distance(best, pointer) ? candidate : best,
          );

          const snapped = findSnapPoint(points, pointer, mmPerPixel);

          if (distance(nearest, pointer) <= limit) {
            expectPoint(snapped, nearest);
          } else {
            expect(snapped).toBeNull();
          }
        },
      ),
    );
  });

  it('@WALL-009 the snap distance is 8 px, so it changes with the scale', () => {
    const origin = [at(0, 0)];

    expect(findSnapPoint(origin, at(200, 0), 10)).toBeNull();
    expectPoint(findSnapPoint(origin, at(200, 0), 50), at(0, 0));
  });

  it('@WALL-009 the snap distance is 8 px at any scale', () => {
    const origin = [at(0, 0)];
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 2000 }),
        fc.integer({ min: 1, max: 100 }),
        (distanceMm, mmPerPixel) => {
          const snapped = findSnapPoint(origin, at(distanceMm, 0), mmPerPixel);
          expect(snapped !== null).toBe(distanceMm <= SNAP_DISTANCE_PX * mmPerPixel);
        },
      ),
    );
  });

  it('@WALL-010 with two anchors in range, the nearest one wins', () => {
    const snapped = findSnapPoint([at(0, 0), at(100, 0)], at(70, 0), 10);

    expectPoint(snapped, at(100, 0));
  });
});

describe('anchors of a level', () => {
  it('@WALL-011 the anchors of a level are the ends of its walls, each listed once', () => {
    const project: Project = createProject();
    const levelId: LevelId = levelZero(project).id;
    addWall(project, levelId, { start: at(0, 0), end: at(3500, 0) });
    addWall(project, levelId, { start: at(3500, 0), end: at(3500, 2000) });

    const anchors = anchorsOf(levelZero(project));

    expect(anchors).toHaveLength(3);
    expectPoint(anchors[0] ?? null, at(0, 0));
    expectPoint(anchors[1] ?? null, at(3500, 0));
    expectPoint(anchors[2] ?? null, at(3500, 2000));
  });
});
