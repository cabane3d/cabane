import { describe, expect, it } from 'vitest';
import * as Y from 'yjs';
import { mm } from '../units';
import { deleteLevel } from './commands';
import { createRecord, getRoot, readRecords, type YRecord } from './document';
import { canUndo, createNewProject, type Project, projectInternals } from './project';

/** Adds a level behind the command layer: there is no `addLevel` command yet. */
function addLevelForTest(project: Project, id: string): void {
  const { doc } = project[projectInternals];
  doc.transact(() => {
    readRecords(getRoot(doc), 'levels').push([
      createRecord({
        id,
        name: 'Level 1',
        elevation: mm(2500),
        height: mm(2500),
        elements: new Y.Array<YRecord>(),
      }),
    ]);
  });
}

describe('deleteLevel', () => {
  it('rejects an unknown level without changing the project', () => {
    const project = createNewProject();

    expect(deleteLevel(project, 'missing')).toEqual({ ok: false, reason: 'unknown-level' });
    expect(project.levels).toHaveLength(1);
    expect(project.hasUnsavedChanges).toBe(false);
  });

  it('rejects the last level without changing the project', () => {
    const project = createNewProject();
    const [level] = project.levels;
    if (!level) throw new Error('Expected one level');

    expect(deleteLevel(project, level.id)).toEqual({ ok: false, reason: 'last-level' });
    expect(canUndo(project)).toBe(false);
  });

  it('deletes a level as one undoable step', () => {
    const project = createNewProject();
    addLevelForTest(project, 'second');

    expect(deleteLevel(project, 'second')).toEqual({ ok: true });
    expect(project.levels.map((level) => level.name)).toEqual(['Level 0']);
    expect(canUndo(project)).toBe(true);

    project[projectInternals].undoManager.undo();
    expect(project.levels.map((level) => level.name)).toEqual(['Level 0', 'Level 1']);
    expect(canUndo(project)).toBe(false);
  });
});
