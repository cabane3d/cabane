import { describe, expect, it } from 'vitest';
import { canUndo, createNewProject, deleteLevel, mm } from '../index';

// Specs: specs/project/new-project.feature (ADR-0011, ADR-0013).
// Every test name carries the scenario identifier so that check-scenario-coverage.sh can trace it.

describe('New project', () => {
  describe('A new project starts with a single empty level', () => {
    it('@PROJ-001 contains one level named "Level 0" at elevation 0 mm with a height of 2500 mm', () => {
      const project = createNewProject();

      expect(project.levels).toHaveLength(1);
      const [level] = project.levels;
      expect(level?.name).toBe('Level 0');
      expect(level?.elevation).toBe(mm(0));
      expect(level?.height).toBe(mm(2500));
    });

    it('@PROJ-002 has a level "Level 0" that contains no element', () => {
      const project = createNewProject();

      const level = project.levels.find((candidate) => candidate.name === 'Level 0');
      expect(level).toBeDefined();
      expect(level?.elements).toHaveLength(0);
    });
  });

  describe('A project always has at least one level', () => {
    it('@PROJ-003 rejects the deletion of the last level', () => {
      const project = createNewProject();
      const level = project.levels.find((candidate) => candidate.name === 'Level 0');
      if (!level) throw new Error('Expected a new project to contain "Level 0"');

      const result = deleteLevel(project, level.id);

      expect(result.ok).toBe(false);
      expect(project.levels).toHaveLength(1);
    });
  });

  describe('A new project is untitled and has nothing to save', () => {
    it('@PROJ-004 is named "Untitled"', () => {
      const project = createNewProject();

      expect(project.name).toBe('Untitled');
    });

    it('@PROJ-005 is not linked to any file', () => {
      const project = createNewProject();

      expect(project.filePath).toBeNull();
    });

    it('@PROJ-006 has no unsaved changes', () => {
      const project = createNewProject();

      expect(project.hasUnsavedChanges).toBe(false);
    });

    it('@PROJ-007 has nothing to undo', () => {
      const project = createNewProject();

      expect(canUndo(project)).toBe(false);
    });
  });

  describe('Default wall settings are stored in the project', () => {
    it('@PROJ-008 has a default wall thickness of 200 mm and a default wall height of 2500 mm', () => {
      const project = createNewProject();

      expect(project.wallDefaults.thickness).toBe(mm(200));
      expect(project.wallDefaults.height).toBe(mm(2500));
    });
  });
});
