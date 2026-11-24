# Project API (test contract)

Contract for `specs/project/new-project.feature`. Test-writer, coder and reviewer follow it exactly: the names, types and results below are the only ones the tests may use. Anything not listed here is internal and must not be used by tests. A change to this contract is the maintainer's decision.

## `core` (`@cabane3d/core`)

All lengths are `Mm` (ADR-0017). Tests compare them with `lengthsEqual`, never `===`.

### Creating a project

```ts
function createProject(): Project;
```

Returns a new project as described by the spec: one level, no element, named `Untitled`, not linked to a file, no unsaved changes, nothing to undo or redo.

### Reading a project

Accessors are **live**: every read reflects the current state of the project document. Returned values are read-only.

```ts
interface Project {
  readonly name: string;                 // "Untitled" for a new project
  readonly filePath: string | null;      // null: not linked to any file
  readonly hasUnsavedChanges: boolean;
  readonly canUndo: boolean;             // false: nothing to undo
  readonly canRedo: boolean;             // false: nothing to redo
  readonly levels: readonly Level[];     // from the lowest to the highest
  readonly wallDefaults: WallDefaults;
}

interface Level {
  readonly id: LevelId;
  readonly name: string;
  readonly elevation: Mm;
  readonly height: Mm;
  readonly elements: readonly Element[];
}

interface WallDefaults {
  readonly thickness: Mm;
  readonly height: Mm;
}

type LevelId = string & { readonly __brand: 'LevelId' };

/** Union of element types. No element type exists yet: later features extend it. */
type Element = never;
```

### Deleting a level

```ts
function deleteLevel(project: Project, levelId: LevelId): void;

class CommandError extends Error {
  readonly code: CommandErrorCode;
}

type CommandErrorCode = 'last-level' | 'unknown-level';
```

- On success, the level is removed in a single undo step.
- A refused deletion **throws a `CommandError`** and changes nothing: the levels are the same, `canUndo` is unchanged and `hasUnsavedChanges` is unchanged.

| Spec wording | Result |
|---|---|
| the deletion is refused because a project needs at least one level | throws `CommandError` with `code === 'last-level'` |
| the deletion is refused because the level does not exist | throws `CommandError` with `code === 'unknown-level'` |

## Interface

Locators follow the glossary in `docs/design/main-window.md`.

| Spec wording | Observed in the page |
|---|---|
| the Start screen is displayed | `getByRole('main', { name: 'Start screen' })` is visible |
| the application name "Cabane" is shown | `getByRole('heading', { level: 1 })` has the text `Cabane`, inside the Start screen |
| the application version is shown | inside the Start screen, a text `Version <version>`, where `<version>` is the `version` returned by `platform.getAppInfo()` |
| the New project button is shown | `getByRole('button', { name: 'New project' })` is visible, inside the Start screen |
| the user chooses New project | click on that button |
| the Main window is displayed | `getByRole('main', { name: 'Main window' })` is visible and the Start screen is no longer shown |
| the Project name "X" is shown in the Top bar | inside `getByRole('banner', { name: 'Top bar' })`, a text exactly `X` |
| the Level tabs contain only "X" | `getByRole('tablist', { name: 'Level tabs' })` contains exactly one `tab`, whose accessible name is `X` |
| "X" is the selected level | the `tab` named `X` has `aria-selected="true"` |

## Platform

- `@e2e` scenarios run on the fake platform, `createFakePlatform()`: its version is `0.0.0-test`.
- `@electron` scenarios run on the Electron platform: its version is the `version` of `apps/desktop/package.json`.
- This feature adds no IPC channel.
