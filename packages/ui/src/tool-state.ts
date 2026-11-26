/**
 * The active tool of the Main window (specs/ui/tool-bar.feature, docs/api/tool-bar.md).
 *
 * It is application window state, not project state: it lives outside the project document
 * (ADR-0004), so choosing a tool is never saved, never undone and never marks the project as
 * having unsaved changes. No React here, so it can be tested without a screen.
 */

/** `'select'` for now. A feature that adds a tool extends the union. */
export type ToolId = 'select';

/** A key press, as seen by the tool shortcuts. */
export interface KeyPress {
  /** `KeyboardEvent.key`: 'v', 'V', 'Q', '1'… */
  readonly key: string;
  readonly ctrl: boolean;
  readonly alt: boolean;
  readonly meta: boolean;
  readonly shift: boolean;
  /** The focus is in an input, a textarea or an editable element. */
  readonly inTextField: boolean;
}

export interface ToolState {
  readonly activeTool: ToolId;
  /** Makes `tool` the only active tool. Choosing the active tool keeps it active. */
  choose(tool: ToolId): void;
  /**
   * Handles a key press. Returns `true` when the key chose a tool (the caller then prevents the
   * default action), `false` otherwise. A key is a shortcut only when no modifier is down and the
   * focus is not in a text field. Letters are matched without regard to case.
   */
  handleKey(press: KeyPress): boolean;
}

/** The shortcut of each tool: a single key, written as shown in the tooltip. */
export const TOOL_SHORTCUTS: Readonly<Record<ToolId, string>> = { select: 'V' };

const DEFAULT_TOOL: ToolId = 'select';

function isToolId(id: string): id is ToolId {
  return Object.hasOwn(TOOL_SHORTCUTS, id);
}

/** The tool whose shortcut is `key`, if any. */
function toolOfKey(key: string): ToolId | undefined {
  const pressed = key.toLowerCase();
  return Object.keys(TOOL_SHORTCUTS)
    .filter(isToolId)
    .find((tool) => TOOL_SHORTCUTS[tool].toLowerCase() === pressed);
}

/** One per shown project. The Select tool is active. */
export function createToolState(): ToolState {
  let activeTool: ToolId = DEFAULT_TOOL;

  return {
    get activeTool() {
      return activeTool;
    },
    choose(tool) {
      activeTool = tool;
    },
    handleKey(press) {
      if (press.ctrl || press.alt || press.meta || press.shift || press.inTextField) return false;
      const tool = toolOfKey(press.key);
      if (tool === undefined) return false;
      activeTool = tool;
      return true;
    },
  };
}
