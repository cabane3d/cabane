# Tool bar API (test contract)

Contract for `specs/ui/tool-bar.feature`. Test-writer, coder and reviewer follow it exactly: the names, types and results below are the only ones the tests may use. Anything not listed here is internal and must not be used by tests. A change to this contract is the maintainer's decision.

The visual components (`Toolbar`, `ToolButton`, `Tooltip`) already exist in `@cabane3d/ui`; this contract is about the state and the behavior wired to them.

## `ui` (`@cabane3d/ui`)

The active tool is application window state, not project state: it lives outside the project document (ADR-0004), in a small module with no React in it (low-frequency state, but it must be testable without a screen).

```ts
/** `'select'` for this feature. draw-wall.feature adds `'wall'`: a later feature only extends the union. */
type ToolId = 'select';

interface KeyPress {
  readonly key: string;        // `KeyboardEvent.key`: 'v', 'V', 'Q', '1'…
  readonly ctrl: boolean;
  readonly alt: boolean;
  readonly meta: boolean;
  readonly shift: boolean;
  readonly inTextField: boolean; // the focus is in an input, a textarea or an editable element
}

interface ToolState {
  readonly activeTool: ToolId;
  /** Makes `tool` the only active tool. Choosing the active tool keeps it active. */
  choose(tool: ToolId): void;
  /**
   * Handles a key press. Returns `true` when the key chose a tool (the caller then prevents the
   * default action), `false` otherwise. A key is a shortcut only when no modifier is down
   * (`ctrl`, `alt`, `meta` and `shift` are all `false`) and `inTextField` is `false`.
   * Letters are matched without regard to case.
   */
  handleKey(press: KeyPress): boolean;
}

/** One per shown project. The Select tool is active. */
function createToolState(): ToolState;
```

Shortcuts: `V` is the Select tool.

### Spec wording

In the table, `press(key)` is a `KeyPress` with that `key`, every modifier `false` and `inTextField: false`, unless stated.

| Spec wording | Test |
|---|---|
| a project is shown | `createToolState()` |
| a new project is shown | `createProject()` and `createToolState()` |
| the active tool is the X tool | `state.activeTool === 'x'` (`'select'` for Select) |
| the X tool is chosen | `state.choose('x')` |
| the key K is pressed | `state.handleKey(press('k'))`; `handleKey` returns `true` for V and `false` for Q, 1, F |
| the project has no unsaved changes / there is nothing to undo | `project.hasUnsavedChanges === false` / `project.canUndo === false` |

## Interface

Locators follow the glossary in `docs/design/main-window.md`. The Tool bar is a `toolbar` named `Tool bar`; each tool is a `button` whose accessible name is the tool name (`Select tool`).

| Spec wording | Observed in the page |
|---|---|
| the Tool bar is displayed in the Plan view | `getByRole('region', { name: 'Plan view' }).getByRole('toolbar', { name: 'Tool bar' })` is visible |
| the Tool bar contains only the Select tool | inside the Tool bar, `getByRole('button')` has exactly one match, named `Select tool` |
| the user chooses the Select tool | click on `getByRole('button', { name: 'Select tool' })` |
| the Select tool is active | that button has `aria-pressed="true"` |
| the Select tool is announced as pressed | same check: `aria-pressed="true"` (and `"false"` for "not pressed") |
| the user presses V | `page.keyboard.press('v')` with the focus on the page (not in a field) |
| the user hovers the Select tool | `hover()` on the button |
| a tooltip shows "Select tool" and the shortcut "V" | after hovering, `getByRole('tooltip')` has the text `Select tool` and a `kbd` element with the text `V` |
| the user presses Tab until the focus enters the Tool bar | `page.keyboard.press('Tab')` at most 20 times, until the focused element is inside the Tool bar |
| the focus is on the Select tool | the `Select tool` button `toBeFocused()` |
| the Tool bar matches its reference screenshot | `expect(toolbarLocator).toHaveScreenshot('TOOL-012.png')`, light theme, on the fake platform |

## Platform

- `@e2e` and `@visual` scenarios run on the fake platform; `@electron` ones on the Electron platform.
- This feature adds no IPC channel.
