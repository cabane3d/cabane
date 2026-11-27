import { createProject } from '@cabane3d/core';
import { createToolState, type KeyPress } from '@cabane3d/ui';
import { describe, expect, it } from 'vitest';

/** A key press without modifiers, outside any text field. */
function press(key: string, overrides: Partial<Omit<KeyPress, 'key'>> = {}): KeyPress {
  return {
    key,
    ctrl: false,
    alt: false,
    meta: false,
    shift: false,
    inTextField: false,
    ...overrides,
  };
}

describe('tool state', () => {
  it('@TOOL-001 the Select tool is active when a project is shown', () => {
    const state = createToolState();

    expect(state.activeTool).toBe('select');
  });

  it('@TOOL-002 choosing the Select tool keeps it active', () => {
    const state = createToolState();

    state.choose('select');

    expect(state.activeTool).toBe('select');
  });

  it('@TOOL-003 the shortcut V chooses the Select tool', () => {
    const state = createToolState();

    expect(state.handleKey(press('v'))).toBe(true);
    expect(state.activeTool).toBe('select');
  });

  it('@TOOL-003 letters are matched without regard to case', () => {
    const state = createToolState();

    expect(state.handleKey(press('V'))).toBe(true);
    expect(state.activeTool).toBe('select');
  });

  it('@TOOL-003 V with a modifier is not a shortcut', () => {
    const state = createToolState();

    expect(state.handleKey(press('v', { ctrl: true }))).toBe(false);
    expect(state.handleKey(press('v', { alt: true }))).toBe(false);
    expect(state.handleKey(press('v', { meta: true }))).toBe(false);
    expect(state.handleKey(press('v', { shift: true }))).toBe(false);
    expect(state.activeTool).toBe('select');
  });

  it('@TOOL-003 V while the focus is in a text field is not a shortcut', () => {
    const state = createToolState();

    expect(state.handleKey(press('v', { inTextField: true }))).toBe(false);
    expect(state.activeTool).toBe('select');
  });

  it.each(['Q', '1', 'F'])('@TOOL-004 the key %s does nothing', (key) => {
    const state = createToolState();

    expect(state.handleKey(press(key))).toBe(false);
    expect(state.activeTool).toBe('select');
  });
});

describe('tool state and the project', () => {
  it('@TOOL-005 choosing a tool leaves a new project without unsaved changes', () => {
    const project = createProject();
    const state = createToolState();

    state.choose('select');

    expect(project.hasUnsavedChanges).toBe(false);
  });

  it('@TOOL-005 choosing a tool leaves nothing to undo in a new project', () => {
    const project = createProject();
    const state = createToolState();

    state.choose('select');

    expect(project.canUndo).toBe(false);
  });
});
