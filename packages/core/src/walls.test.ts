/**
 * Walls of the document: the scenarios of specs/walls/draw-wall.feature that run at unit level.
 * Tests use the public API of core only (docs/api/walls.md).
 */
import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  addWall,
  CommandError,
  type CommandErrorCode,
  createProject,
  type Level,
  type LevelId,
  lengthsEqual,
  type Mm,
  mm,
  type Point,
  type Project,
  redo,
  setWallDefaults,
  undo,
  type Wall,
  wallsOf,
} from './index';

/** A point of the plan, in millimeters. */
function at(x: number, y: number): Point {
  return { x: mm(x), y: mm(y) };
}

/** The level of the project named "Level 0" (read again each time: the accessors are live). */
function levelZero(project: Project): Level {
  const level = project.levels.find((candidate) => candidate.name === 'Level 0');
  if (!level) throw new Error('The project has no level named "Level 0"');
  return level;
}

/** The only wall of "Level 0". Throws when there is not exactly one. */
function soleWall(project: Project): Wall {
  const [wall, ...others] = wallsOf(levelZero(project));
  if (!wall || others.length > 0) throw new Error('Expected exactly one wall on "Level 0"');
  return wall;
}

function expectLength(actual: Mm, expected: Mm): void {
  expect(lengthsEqual(actual, expected), `${actual} mm is not ${expected} mm`).toBe(true);
}

function expectPoint(actual: Point, expected: Point): void {
  expectLength(actual.x, expected.x);
  expectLength(actual.y, expected.y);
}

/** Asserts that the action is refused with a {@link CommandError} of the given code. */
function expectRefusal(refused: () => unknown, code: CommandErrorCode): void {
  let error: unknown;
  try {
    refused();
  } catch (caught) {
    error = caught;
  }
  expect(error).toBeInstanceOf(CommandError);
  expect(error).toHaveProperty('code', code);
}

describe('walls', () => {
  it('@WALL-001 adding a wall gives it the default thickness and height', () => {
    const project = createProject();
    const levelId = levelZero(project).id;

    addWall(project, levelId, { start: at(0, 0), end: at(3500, 0) });

    expect(wallsOf(levelZero(project))).toHaveLength(1);
    const wall = soleWall(project);
    expectPoint(wall.start, at(0, 0));
    expectPoint(wall.end, at(3500, 0));
    expectLength(wall.length, mm(3500));
    expectLength(wall.thickness, mm(200));
    expectLength(wall.height, mm(2500));
  });

  it('@WALL-002 a wall takes the defaults of the project at the time it is added', () => {
    const project = createProject();
    setWallDefaults(project, { thickness: mm(100), height: mm(2700) });

    addWall(project, levelZero(project).id, { start: at(0, 0), end: at(1000, 0) });

    const wall = soleWall(project);
    expectLength(wall.thickness, mm(100));
    expectLength(wall.height, mm(2700));
  });

  it('@WALL-002 changing the defaults afterwards changes neither the existing walls nor their values', () => {
    const project = createProject();
    setWallDefaults(project, { thickness: mm(100), height: mm(2700) });
    addWall(project, levelZero(project).id, { start: at(0, 0), end: at(1000, 0) });

    setWallDefaults(project, { thickness: mm(300), height: mm(3000) });

    const existing = soleWall(project);
    expectLength(existing.thickness, mm(100));
    expectLength(existing.height, mm(2700));
    expect(project.wallDefaults.thickness).toBe(300);
  });

  it('@WALL-003 a wall without length is refused and leaves the project untouched', () => {
    const project = createProject();
    const levelId = levelZero(project).id;

    expectRefusal(
      () => addWall(project, levelId, { start: at(500, 500), end: at(500, 500) }),
      'no-length',
    );

    expect(levelZero(project).elements).toHaveLength(0);
    expect(project.canUndo).toBe(false);
    expect(project.hasUnsavedChanges).toBe(false);
  });

  it('@WALL-004 a wall on a level that does not exist is refused and leaves the project untouched', () => {
    const project = createProject();

    expectRefusal(
      () => addWall(project, 'missing' as LevelId, { start: at(0, 0), end: at(1000, 0) }),
      'unknown-level',
    );

    expect(project.canUndo).toBe(false);
    expect(project.hasUnsavedChanges).toBe(false);
  });

  it('@WALL-005 adding a wall can be undone and redone in one step each', () => {
    const project = createProject();
    addWall(project, levelZero(project).id, { start: at(0, 0), end: at(3500, 0) });

    undo(project);
    expect(levelZero(project).elements).toHaveLength(0);

    redo(project);
    expect(wallsOf(levelZero(project))).toHaveLength(1);
  });

  describe('thickness side', () => {
    const rows = [
      {
        label: 'from (0, 0) to (3500, 0)',
        start: at(0, 0),
        end: at(3500, 0),
        corners: [at(0, 0), at(3500, 0), at(3500, -200), at(0, -200)],
      },
      {
        label: 'from (0, 0) to (0, -3500)',
        start: at(0, 0),
        end: at(0, -3500),
        corners: [at(0, 0), at(0, -3500), at(-200, -3500), at(-200, 0)],
      },
      {
        label: 'from (3500, 0) to (0, 0)',
        start: at(3500, 0),
        end: at(0, 0),
        corners: [at(3500, 0), at(0, 0), at(0, 200), at(3500, 200)],
      },
    ];

    it.each(rows)(
      '@WALL-006 the wall covers the expected corners $label',
      ({ start, end, corners }) => {
        const project = createProject();
        addWall(project, levelZero(project).id, { start, end });

        const wall = soleWall(project);
        expect(wall.corners).toHaveLength(4);
        corners.forEach((corner, index) => {
          const actual = wall.corners[index];
          expect(actual).toBeDefined();
          if (actual) expectPoint(actual, corner);
        });
      },
    );

    it('@WALL-006 the thickness lies to the right of any drawing direction', () => {
      const coordinate = fc.integer({ min: -5000, max: 5000 });
      fc.assert(
        fc.property(coordinate, coordinate, coordinate, coordinate, (x1, y1, x2, y2) => {
          const length = Math.hypot(x2 - x1, y2 - y1);
          fc.pre(length >= 10);
          const project = createProject();
          const start = at(x1, y1);
          const end = at(x2, y2);
          addWall(project, levelZero(project).id, { start, end });

          const wall = soleWall(project);
          // Right of (dx, dy) is (dy, -dx) / length, at the wall thickness.
          const right = { x: (y2 - y1) / length, y: -(x2 - x1) / length };
          const thickness = wall.thickness;
          const [c0, c1, c2, c3] = wall.corners;
          expectPoint(c0 ?? start, start);
          expectPoint(c1 ?? end, end);
          expectPoint(c2 ?? end, at(x2 + right.x * thickness, y2 + right.y * thickness));
          expectPoint(c3 ?? start, at(x1 + right.x * thickness, y1 + right.y * thickness));
        }),
      );
    });
  });

  it('@WALL-007 walls may overlap', () => {
    const project = createProject();
    const levelId = levelZero(project).id;
    addWall(project, levelId, { start: at(0, 0), end: at(3500, 0) });

    addWall(project, levelId, { start: at(1000, 0), end: at(2000, 0) });

    expect(wallsOf(levelZero(project))).toHaveLength(2);
  });
});
