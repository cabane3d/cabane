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

describe('wall tool state', () => {
  it.each([
    { before: 'select', chosen: 'wall' },
    { before: 'wall', chosen: 'select' },
    { before: 'wall', chosen: 'wall' },
    { before: 'select', chosen: 'select' },
  ] as const)(
    '@WALL-012 choosing the $chosen tool after the $before tool makes it the only active one',
    ({ before, chosen }) => {
      const state = createToolState();
      state.choose(before);

      state.choose(chosen);

      expect(state.activeTool).toBe(chosen);
    },
  );

  it.each([
    { key: 'W', tool: 'wall' },
    { key: 'V', tool: 'select' },
  ] as const)('@WALL-013 the shortcut $key chooses the $tool tool', ({ key, tool }) => {
    const state = createToolState();
    // Start from the other tool, so that the key has to do the choosing.
    state.choose(tool === 'wall' ? 'select' : 'wall');

    expect(state.handleKey(press(key))).toBe(true);

    expect(state.activeTool).toBe(tool);
  });

  it.each([{ modifier: 'ctrl' }, { modifier: 'alt' }] as const)(
    '@WALL-014 W with $modifier does nothing',
    ({ modifier }) => {
      const state = createToolState();
      // Control: the plain shortcut does choose the Wall tool.
      expect(state.handleKey(press('w'))).toBe(true);
      state.choose('select');

      const modified = modifier === 'ctrl' ? press('w', { ctrl: true }) : press('w', { alt: true });
      expect(state.handleKey(modified)).toBe(false);

      expect(state.activeTool).toBe('select');
    },
  );

  it('@WALL-015 W while the focus is in a text field does nothing', () => {
    const state = createToolState();
    // Control: outside a text field, the same key does choose the Wall tool.
    expect(state.handleKey(press('w'))).toBe(true);
    state.choose('select');

    expect(state.handleKey(press('w', { inTextField: true }))).toBe(false);

    expect(state.activeTool).toBe('select');
  });
});
