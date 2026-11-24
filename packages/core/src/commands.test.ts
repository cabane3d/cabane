import { describe, expect, it } from 'vitest';
import { deleteLevel } from './commands';
import { createProject, type LevelId, levelMap, projectDocument } from './project';
import { mm } from './units';

/** A new project with a second level, added outside any command (no command adds levels yet). */
function projectWithTwoLevels() {
  const project = createProject();
  const document = projectDocument(project);
  document.doc.transact(() => {
    document.levelMaps.push([
      levelMap({
        id: 'upper' as LevelId,
        name: 'Level 1',
        elevation: mm(2500),
        height: mm(2500),
      }),
    ]);
  });
  return { project, document };
}

describe('deleteLevel', () => {
  it('removes the level in a single undo step', () => {
    const { project, document } = projectWithTwoLevels();
    expect(project.canUndo).toBe(false);

    deleteLevel(project, 'upper' as LevelId);

    expect(project.levels.map((level) => level.name)).toEqual(['Level 0']);
    expect(project.canUndo).toBe(true);
    expect(project.hasUnsavedChanges).toBe(true);

    document.undoManager.undo();

    expect(project.levels.map((level) => level.name)).toEqual(['Level 0', 'Level 1']);
    expect(project.canUndo).toBe(false);
    expect(project.canRedo).toBe(true);
  });

  it('records each deletion as its own undo step', () => {
    const { project, document } = projectWithTwoLevels();
    document.doc.transact(() => {
      document.levelMaps.push([
        levelMap({ id: 'top' as LevelId, name: 'Level 2', elevation: mm(5000), height: mm(2500) }),
      ]);
    });

    deleteLevel(project, 'top' as LevelId);
    deleteLevel(project, 'upper' as LevelId);
    document.undoManager.undo();

    expect(project.levels.map((level) => level.name)).toEqual(['Level 0', 'Level 1']);
  });

  it('rejects a project that core did not create', () => {
    const foreign = { ...createProject() };

    expect(() => deleteLevel(foreign, 'upper' as LevelId)).toThrow(TypeError);
  });
});

describe('createProject', () => {
  it('gives each new level a distinct id', () => {
    const [first] = createProject().levels;
    const [second] = createProject().levels;

    expect(first?.id).not.toBe(second?.id);
  });
});
