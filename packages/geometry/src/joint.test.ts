/**
 * Joints of walls that meet at an anchor: the scenarios WALL-040 to WALL-042 and WALL-047 to
 * WALL-048 of specs/walls/draw-wall.feature, through the public API of geometry
 * (docs/api/walls.md). The walls are built with the public API of core, through addWall, as the
 * Given steps of the scenarios do.
 */
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
import { jointOf, jointsOf, MITRE_LIMIT } from './index';

/** A plan point, written as [x, y] in millimeters. */
type Coordinates = readonly [number, number];

/** Tolerance of the points of a joint, in millimeters (docs/api/walls.md). */
const POINT_TOLERANCE_MM = 0.01;

function at(x: number, y: number): Point {
  return { x: mm(x), y: mm(y) };
}

function levelZero(project: Project): Level {
  const level = project.levels.find((candidate) => candidate.name === 'Level 0');
  if (!level) throw new Error('The project has no level named "Level 0"');
  return level;
}

/** Draws the two walls of a scenario on "Level 0", in order, and returns them in creation order. */
function twoWalls(
  first: readonly [Coordinates, Coordinates],
  second: readonly [Coordinates, Coordinates],
): readonly [Wall, Wall] {
  const project = createProject();
  const level = levelZero(project);
  const [a1, a2] = first;
  const [b1, b2] = second;
  addWall(project, level.id, { start: at(a1[0], a1[1]), end: at(a2[0], a2[1]) });
  addWall(project, level.id, { start: at(b1[0], b1[1]), end: at(b2[0], b2[1]) });
  const walls = wallsOf(levelZero(project));
  const [wallA, wallB] = walls;
  if (!wallA || !wallB) throw new Error('The two walls were not added');
  return [wallA, wallB];
}

/** Draws the walls of a scenario on "Level 0", in creation order, and returns the walls of the level. */
function wallsOnLevelZero(
  segments: readonly (readonly [Coordinates, Coordinates])[],
): readonly Wall[] {
  const project = createProject();
  const level = levelZero(project);
  for (const [[x1, y1], [x2, y2]] of segments) {
    addWall(project, level.id, { start: at(x1, y1), end: at(x2, y2) });
  }
  return wallsOf(levelZero(project));
}

/** The joint of two walls, expected to exist, with each point within the tolerance of the spec. */
function expectJointCovers(joint: readonly Point[] | null, expected: readonly Coordinates[]): void {
  expect(joint, 'the walls have no joint').not.toBeNull();
  if (joint === null) return;
  expect(joint).toHaveLength(expected.length);
  expected.forEach(([x, y], index) => {
    const point = joint[index];
    if (!point) throw new Error(`The joint has no point ${index}`);
    expect(Math.abs(point.x - x), `point ${index} x`).toBeLessThanOrEqual(POINT_TOLERANCE_MM);
    expect(Math.abs(point.y - y), `point ${index} y`).toBeLessThanOrEqual(POINT_TOLERANCE_MM);
  });
}

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

describe('jointOf: walls that meet at an anchor are joined with a mitre', () => {
  it.each([
    {
      label: 'at a right angle',
      first: [
        [0, 0],
        [4000, 0],
      ] as const,
      second: [
        [4000, 0],
        [4000, 3000],
      ] as const,
      points: [
        [4000, 0],
        [4200, 0],
        [4200, -200],
        [4000, -200],
      ] as const,
    },
    {
      label: 'at an oblique angle',
      first: [
        [0, 0],
        [4000, 0],
      ] as const,
      second: [
        [4000, 0],
        [6000, 2000],
      ] as const,
      points: [
        [4000, 0],
        [4141.42, -141.42],
        [4082.84, -200],
        [4000, -200],
      ] as const,
    },
  ])(
    '@WALL-040 fills the outer corner $label: the joint covers the expected points',
    ({ first, second, points }) => {
      const [wallA, wallB] = twoWalls(first, second);

      expectJointCovers(jointOf(wallA, wallB), points);
    },
  );
});

describe('jointOf: a very sharp angle is cut off', () => {
  it('@WALL-041 bevels the corner when the meeting point is farther than MITRE_LIMIT times the thickness', () => {
    const [wallA, wallB] = twoWalls(
      [
        [0, 0],
        [4000, 0],
      ],
      [
        [4000, 0],
        [1000, 1000],
      ],
    );

    expectJointCovers(jointOf(wallA, wallB), [
      [4000, 0],
      [4063.25, 189.74],
      [4000, -200],
    ]);
  });

  it('@WALL-041 the limit is twice the larger thickness', () => {
    expect(MITRE_LIMIT).toBe(2);
  });

  /**
   * Walls from P = (4000 mm, 0 mm) meeting at an angle phi between their away directions. The meeting
   * point of their outer faces is then at a distance of thickness / sin(phi / 2) from P, so the angle
   * is chosen to put it at `ratio` times the thickness. Both walls are 200 mm thick.
   */
  function wallsAtRatio(ratio: number): readonly [Wall, Wall] {
    const phi = 2 * Math.asin(1 / ratio);
    const far = 3000;
    const end: Coordinates = [4000 - far * Math.cos(phi), far * Math.sin(phi)];
    return twoWalls(
      [
        [0, 0],
        [4000, 0],
      ],
      [[4000, 0], end],
    );
  }

  it('@WALL-041 keeps the mitre just inside MITRE_LIMIT times the thickness', () => {
    const ratio = MITRE_LIMIT * 0.9;
    const [wallA, wallB] = wallsAtRatio(ratio);

    const joint = jointOf(wallA, wallB);

    // Four points: the shared point, the outer corner of the second wall, the meeting point, the
    // outer corner of the first wall. The meeting point is the third one, at ratio * 200 mm.
    expect(joint).toHaveLength(4);
    const meeting = joint?.[2];
    if (!meeting) throw new Error('The mitre has no meeting point');
    expect(Math.abs(distance(at(4000, 0), meeting) - ratio * 200)).toBeLessThanOrEqual(
      POINT_TOLERANCE_MM,
    );
  });

  it('@WALL-041 bevels the corner just beyond MITRE_LIMIT times the thickness', () => {
    const [wallA, wallB] = wallsAtRatio(MITRE_LIMIT * 1.1);

    // Three points only: no meeting point, the two outer corners and the shared point.
    expect(jointOf(wallA, wallB)).toHaveLength(3);
  });
});

describe('jointOf: walls without an outer notch have no joint', () => {
  it.each([
    {
      label: 'turning towards the thickness',
      first: [
        [0, 0],
        [4000, 0],
      ] as const,
      second: [
        [4000, 0],
        [4000, -3000],
      ] as const,
    },
    {
      label: 'in line',
      first: [
        [0, 0],
        [4000, 0],
      ] as const,
      second: [
        [4000, 0],
        [7000, 0],
      ] as const,
    },
    {
      label: 'going back along the first wall',
      first: [
        [0, 0],
        [4000, 0],
      ] as const,
      second: [
        [4000, 0],
        [1000, 0],
      ] as const,
    },
    {
      label: 'both ending at the same point',
      first: [
        [0, 0],
        [4000, 0],
      ] as const,
      second: [
        [4000, 3000],
        [4000, 0],
      ] as const,
    },
    {
      label: 'not sharing a point',
      first: [
        [0, 0],
        [4000, 0],
      ] as const,
      second: [
        [5000, 0],
        [5000, 3000],
      ] as const,
    },
    {
      label: 'meeting before the shared point',
      first: [
        [0, 0],
        [4000, 0],
      ] as const,
      second: [
        [6000, 2000],
        [4000, 0],
      ] as const,
    },
  ])('@WALL-042 $label: the two walls have no joint', ({ first, second }) => {
    const [wallA, wallB] = twoWalls(first, second);

    expect(jointOf(wallA, wallB)).toBeNull();
  });
});

describe('jointsOf: one joint per corner, dropped when a wall meets inside it', () => {
  it('@WALL-047 two walls that meet give one joint, at the shared point', () => {
    const walls = wallsOnLevelZero([
      [
        [0, 0],
        [4000, 0],
      ],
      [
        [4000, 0],
        [4000, 3000],
      ],
    ]);

    const joints = jointsOf(walls);

    expect(joints).toHaveLength(1);
    const joint = joints[0];
    if (!joint) throw new Error('There is no joint');
    expect(Math.abs(joint.at.x - 4000)).toBeLessThanOrEqual(POINT_TOLERANCE_MM);
    expect(Math.abs(joint.at.y - 0)).toBeLessThanOrEqual(POINT_TOLERANCE_MM);
  });

  it('@WALL-048 a wall that meets inside the corner takes the joint away', () => {
    const walls = wallsOnLevelZero([
      [
        [0, 0],
        [4000, 0],
      ],
      [
        [4000, 0],
        [4000, 3000],
      ],
      [
        [4000, 0],
        [7000, 0],
      ],
    ]);

    expect(jointsOf(walls)).toEqual([]);
  });
});
