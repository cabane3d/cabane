import { uuidv4 } from 'lib0/random';
import * as Y from 'yjs';
import { type Mm, mm } from '../units';
import {
  createRecord,
  getRoot,
  readLength,
  readRecord,
  readRecords,
  readString,
  SCHEMA_VERSION,
  type YRecord,
} from './document';

/** Name of a project that has never been saved (docs/design/main-window.md). */
const UNTITLED = 'Untitled';

const DEFAULT_LEVEL_NAME = 'Level 0';
const DEFAULT_LEVEL_ELEVATION = mm(0);
const DEFAULT_LEVEL_HEIGHT = mm(2500);
const DEFAULT_WALL_THICKNESS = mm(200);
const DEFAULT_WALL_HEIGHT = mm(2500);

/** Anything placed in a project: a wall, a room, a piece of furniture… */
export interface ProjectElement {
  readonly id: string;
}

export interface Level {
  readonly id: string;
  readonly name: string;
  /** Elevation of the level's floor, along Z from the floor of level 0. */
  readonly elevation: Mm;
  readonly height: Mm;
  readonly elements: readonly ProjectElement[];
}

export interface WallDefaults {
  readonly thickness: Mm;
  readonly height: Mm;
}

/**
 * Transaction origin of every command. The undo manager tracks this class only, so each
 * command is one undo step and nothing else (document creation, future remote updates) is.
 */
export class CommandOrigin {
  constructor(readonly command: string) {}
}

/** Internal state of a project, reserved to `core` commands. Not exported from the package. */
export const projectInternals = Symbol('projectInternals');

interface ProjectInternals {
  readonly doc: Y.Doc;
  readonly undoManager: Y.UndoManager;
}

/**
 * An open project: a typed, read-only view over its Yjs document (ADR-0004).
 * Every read returns the current state; changes go through `core` commands.
 */
export interface Project {
  readonly name: string;
  /** File the project is saved to, `null` until it is saved. */
  readonly filePath: string | null;
  readonly hasUnsavedChanges: boolean;
  /** Ordered list of levels; never empty. */
  readonly levels: readonly Level[];
  readonly wallDefaults: WallDefaults;
  readonly [projectInternals]: ProjectInternals;
}

function readLevel(record: YRecord): Level {
  return {
    id: readString(record, 'id'),
    name: readString(record, 'name'),
    elevation: readLength(record, 'elevation'),
    height: readLength(record, 'height'),
    elements: readRecords(record, 'elements')
      .toArray()
      .map((element) => ({ id: readString(element, 'id') })),
  };
}

function initializeDocument(doc: Y.Doc): void {
  const root = getRoot(doc);
  doc.transact(() => {
    root.set('schemaVersion', SCHEMA_VERSION);
    root.set(
      'wallDefaults',
      createRecord({ thickness: DEFAULT_WALL_THICKNESS, height: DEFAULT_WALL_HEIGHT }),
    );
    const levels = new Y.Array<YRecord>();
    levels.push([
      createRecord({
        id: uuidv4(),
        name: DEFAULT_LEVEL_NAME,
        elevation: DEFAULT_LEVEL_ELEVATION,
        height: DEFAULT_LEVEL_HEIGHT,
        elements: new Y.Array<YRecord>(),
      }),
    ]);
    root.set('levels', levels);
  });
}

/** Creates a blank project: one empty level, untitled, not linked to any file. */
export function createNewProject(): Project {
  const doc = new Y.Doc();
  initializeDocument(doc);

  const root = getRoot(doc);
  // Created after initialization: the initial content is neither undoable nor an unsaved change.
  const undoManager = new Y.UndoManager(root, {
    trackedOrigins: new Set([CommandOrigin]),
    captureTimeout: 0,
  });
  let hasUnsavedChanges = false;
  doc.on('update', () => {
    hasUnsavedChanges = true;
  });

  return {
    name: UNTITLED,
    filePath: null,
    get hasUnsavedChanges() {
      return hasUnsavedChanges;
    },
    get levels() {
      return readRecords(root, 'levels').toArray().map(readLevel);
    },
    get wallDefaults() {
      const defaults = readRecord(root, 'wallDefaults');
      return {
        thickness: readLength(defaults, 'thickness'),
        height: readLength(defaults, 'height'),
      };
    },
    [projectInternals]: { doc, undoManager },
  };
}

/** Whether the project has a document change to undo. */
export function canUndo(project: Project): boolean {
  return project[projectInternals].undoManager.canUndo();
}
