/**
 * `jointsOf` keeps the joint of two walls when a third wall meets at the shared point outside
 * the angular sector that contains the direction from the shared point to M, or on its edge
 * (docs/api/walls.md, "neighbours around the point only"), and a wall that shares no point with
 * the others never changes the joints. The walls are built with the public API of core.
 */
import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  addWall,
  createProject,
  type Level,
  mm,
  type Point,
  type Project,
  type Wall,
  wallsOf,
} from '../../core/src/index';
import { jointOf, jointsOf } from './index';

/** A plan point, written as [x, y] in millimeters. */
type Coordinates = readonly [number, number];

type Segment = readonly [Coordinates, Coordinates];

/** Tolerance of the points of a joint, in millimeters (docs/api/walls.md). */
const POINT_TOLERANCE_MM = 0.01;

function at([x, y]: Coordinates): Point {
  return { x: mm(x), y: mm(y) };
}

function levelZero(project: Project): Level {
  const level = project.levels.find((candidate) => candidate.name === 'Level 0');
  if (!level) throw new Error('The project has no level named "Level 0"');
  return level;
}

/** Draws the walls on "Level 0" of a new project, in order, and returns the walls of the level. */
function wallsOnLevelZero(segments: readonly Segment[]): readonly Wall[] {
  const project = createProject();
  const level = levelZero(project);
  for (const [start, end] of segments) {
    addWall(project, level.id, { start: at(start), end: at(end) });
  }
  // A level is a snapshot: read it again after the commands.
  return wallsOf(levelZero(project));
}

function expectPointsClose(actual: readonly Point[], expected: readonly Coordinates[]): void {
  expect(actual).toHaveLength(expected.length);
  expected.forEach(([x, y], index) => {
    const point = actual[index];
    if (!point) throw new Error(`There is no point ${index}`);
    expect(Math.abs(point.x - x)).toBeLessThanOrEqual(POINT_TOLERANCE_MM);
    expect(Math.abs(point.y - y)).toBeLessThanOrEqual(POINT_TOLERANCE_MM);
  });
}

/** The two walls of the corner at (4000, 0), as in WALL-047. */
const corner: readonly Segment[] = [
  [
    [0, 0],
    [4000, 0],
  ],
  [
    [4000, 0],
    [4000, 3000],
  ],
];

/** The mitre of the corner, 200 mm thick (the default), as `jointOf` orders it. */
const cornerMitre: readonly Coordinates[] = [
  [4000, 0],
  [4200, 0],
  [4200, -200],
  [4000, -200],
];

/** `jointsOf` keeps exactly the joint of the first two walls, at (4000, 0). */
function expectOnlyTheCornerJoint(walls: readonly Wall[]): void {
  const [first, second] = walls;
  if (!first || !second) throw new Error('The walls were not added');
  const joints = jointsOf(walls);

  expect(joints).toHaveLength(1);
  const joint = joints[0];
  if (!joint) throw new Error('There is no joint');
  expectPointsClose([joint.at], [[4000, 0]]);
  expectPointsClose(joint.points, cornerMitre);
  expect(joint.points).toEqual(jointOf(first, second));
}

describe('jointsOf: a third wall outside the sector that contains M keeps the joint', () => {
  it('keeps the joint when the third wall leaves the shared point away from M', () => {
    // M is at (4200, -200): the sector that contains P → M goes from the first wall (180°)
    // counterclockwise to the second (90°), through 270° and 0°. The third wall leaves at 135°,
    // in the other sector, between the two walls on their inner side.
    const walls = wallsOnLevelZero([
      ...corner,
      [
        [4000, 0],
        [2000, 2000],
      ],
    ]);

    expectOnlyTheCornerJoint(walls);
  });

  it('keeps the joint when the third wall goes back along the first wall, on the sector edge', () => {
    // The third wall leaves at 180°, along the first wall: on the edge of the sector, not
    // strictly inside it.
    const walls = wallsOnLevelZero([
      ...corner,
      [
        [4000, 0],
        [1000, 0],
      ],
    ]);

    expectOnlyTheCornerJoint(walls);
  });
});

/** Coordinates on a coarse grid, so that the walls often share their ends. */
const onGrid = fc.integer({ min: 0, max: 4 }).map((step) => step * 1000);

/** Coordinates half a step off that grid: never within `LENGTH_TOLERANCE` of a grid point. */
const offGrid = fc.integer({ min: -5, max: 4 }).map((step) => step * 1000 + 500);

function segment(coordinate: fc.Arbitrary<number>): fc.Arbitrary<Segment> {
  return fc
    .tuple(fc.tuple(coordinate, coordinate), fc.tuple(coordinate, coordinate))
    .filter(([[x1, y1], [x2, y2]]) => x1 !== x2 || y1 !== y2);
}

describe('jointsOf: a wall whose ends are at no end of the other walls', () => {
  it('never changes the joints', () => {
    fc.assert(
      fc.property(
        fc.array(segment(onGrid), { minLength: 1, maxLength: 6 }),
        segment(offGrid),
        (segments, lonely) => {
          const before = jointsOf(wallsOnLevelZero(segments));
          const after = jointsOf(wallsOnLevelZero([...segments, lonely]));
          expect(after).toEqual(before);
        },
      ),
    );
  });
});
