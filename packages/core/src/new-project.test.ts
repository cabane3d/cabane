import { describe, expect, it } from 'vitest';
import { CommandError, createProject, deleteLevel, type LevelId, lengthsEqual, mm } from './index';

/** Asserts two lengths are equal within the core tolerance (never `===`, ADR-0017). */
function expectLength(actual: number, expected: number): void {
  expect(
    lengthsEqual(mm(actual), mm(expected)),
    `expected ${actual} mm to equal ${expected} mm`,
  ).toBe(true);
}

/** Runs `action` and returns what it threw. Fails the test if it does not throw. */
function thrownBy(action: () => void): unknown {
  try {
    action();
  } catch (error) {
    return error;
  }
  throw new Error('Expected the action to throw');
}

describe('new project', () => {
  it('@PROJ-001 a new project contains one level', () => {
    const project = createProject();

    expect(project.levels).toHaveLength(1);
  });

  it('@PROJ-001 the level of a new project is named "Level 0"', () => {
    const [level] = createProject().levels;

    expect(level?.name).toBe('Level 0');
  });

  it('@PROJ-001 the level of a new project has an elevation of 0 mm', () => {
    const [level] = createProject().levels;

    expectLength(level?.elevation ?? Number.NaN, 0);
  });

  it('@PROJ-001 the level of a new project has a height of 2500 mm', () => {
    const [level] = createProject().levels;

    expectLength(level?.height ?? Number.NaN, 2500);
  });

  it('@PROJ-002 the level of a new project contains no element', () => {
    const [level] = createProject().levels;

    expect(level?.elements).toHaveLength(0);
  });

  it('@PROJ-003 the last level of a project cannot be deleted', () => {
    const project = createProject();
    const [level] = project.levels;
    if (!level) throw new Error('A new project must have a level');

    const error = thrownBy(() => deleteLevel(project, level.id));

    expect(error).toBeInstanceOf(CommandError);
    expect(error).toMatchObject({ code: 'last-level' });
    expect(project.levels).toHaveLength(1);
    expect(project.canUndo).toBe(false);
  });

  it('@PROJ-011 a level that does not exist cannot be deleted', () => {
    const project = createProject();
    // The contract has no LevelId constructor: this id matches no level of the project.
    const unknownId = 'no-such-level' as LevelId;

    const error = thrownBy(() => deleteLevel(project, unknownId));

    expect(error).toBeInstanceOf(CommandError);
    expect(error).toMatchObject({ code: 'unknown-level' });
    expect(project.levels).toHaveLength(1);
    expect(project.canUndo).toBe(false);
  });

  it('@PROJ-004 a new project is named "Untitled"', () => {
    expect(createProject().name).toBe('Untitled');
  });

  it('@PROJ-005 a new project is not linked to any file', () => {
    expect(createProject().filePath).toBeNull();
  });

  it('@PROJ-006 a new project has no unsaved changes', () => {
    expect(createProject().hasUnsavedChanges).toBe(false);
  });

  it('@PROJ-007 a new project has nothing to undo', () => {
    expect(createProject().canUndo).toBe(false);
  });

  it('@PROJ-007 a new project has nothing to redo', () => {
    expect(createProject().canRedo).toBe(false);
  });

  it('@PROJ-008 a new project has a default wall thickness of 200 mm', () => {
    expectLength(createProject().wallDefaults.thickness, 200);
  });

  it('@PROJ-008 a new project has a default wall height of 2500 mm', () => {
    expectLength(createProject().wallDefaults.height, 2500);
  });
});
