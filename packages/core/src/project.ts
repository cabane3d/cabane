/**
 * The project document (ADR-0004) and its typed read layer.
 *
 * The state of a project lives in a Yjs document. This module owns its layout, creates new
 * projects and exposes them through the read-only, live {@link Project} accessors. Changes go
 * through the commands (`commands.ts`), never through the Yjs structures directly.
 *
 * Document layout, schema version 1:
 * - `project` (map): `schemaVersion`, `name`, `wallDefaults` (map: `thickness`, `height`, in mm);
 * - `levels` (array of maps, from the lowest to the highest): `id`, `name`, `elevation`, `height`.
 */
import * as Y from 'yjs';
import { type Mm, mm } from './units';

/** Version of the document layout. Bumped with an explicit migration (ADR-0004). */
const SCHEMA_VERSION = 1;

/** Identifier of a level, unique within its project. */
export type LevelId = string & { readonly __brand: 'LevelId' };

/** Union of element types. No element type exists yet: later features extend it. */
export type Element = never;

export interface Level {
  readonly id: LevelId;
  readonly name: string;
  readonly elevation: Mm;
  readonly height: Mm;
  readonly elements: readonly Element[];
}

export interface WallDefaults {
  readonly thickness: Mm;
  readonly height: Mm;
}

/** A project, read through live accessors: every read reflects the current document. */
export interface Project {
  readonly name: string;
  /** The file the project is linked to, or `null` when it was never saved. */
  readonly filePath: string | null;
  readonly hasUnsavedChanges: boolean;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  /** From the lowest to the highest. */
  readonly levels: readonly Level[];
  readonly wallDefaults: WallDefaults;
}

const UNTITLED = 'Untitled';
const FIRST_LEVEL_NAME = 'Level 0';
const DEFAULT_LEVEL_HEIGHT = mm(2500);
const DEFAULT_WALL_THICKNESS = mm(200);
const DEFAULT_WALL_HEIGHT = mm(2500);

/** Origin of the transactions run by commands: the only ones the undo manager records. */
export const COMMAND_ORIGIN = Symbol('cabane-command');

// Web Crypto is available in every runtime Cabane runs in (Electron renderer, browsers,
// Node.js), but core is compiled without DOM or Node.js types (ADR-0003).
declare const crypto: { randomUUID(): string };

function newLevelId(): LevelId {
  return crypto.randomUUID() as LevelId;
}

/** Builds the Yjs map of a level. Its elements are not stored yet: no element type exists. */
export function levelMap(level: Omit<Level, 'elements'>): Y.Map<unknown> {
  return new Y.Map<unknown>([
    ['id', level.id],
    ['name', level.name],
    ['elevation', level.elevation],
    ['height', level.height],
  ]);
}

function invalidDocument(detail: string): Error {
  return new Error(`Invalid project document: ${detail}`);
}

function readString(map: Y.Map<unknown>, key: string): string {
  const value = map.get(key);
  if (typeof value !== 'string') throw invalidDocument(`"${key}" must be a string`);
  return value;
}

function readLength(map: Y.Map<unknown>, key: string): Mm {
  const value = map.get(key);
  if (typeof value !== 'number') throw invalidDocument(`"${key}" must be a length`);
  return mm(value);
}

function readMap(map: Y.Map<unknown>, key: string): Y.Map<unknown> {
  const value = map.get(key);
  if (!(value instanceof Y.Map)) throw invalidDocument(`"${key}" must be a map`);
  return value;
}

const NO_ELEMENTS: readonly Element[] = Object.freeze([]);

function readLevel(map: Y.Map<unknown>): Level {
  return Object.freeze({
    id: readString(map, 'id') as LevelId,
    name: readString(map, 'name'),
    elevation: readLength(map, 'elevation'),
    height: readLength(map, 'height'),
    elements: NO_ELEMENTS,
  });
}

/**
 * Implementation of {@link Project}. Internal to core: other packages only see the
 * {@link Project} interface, and reach the document through the commands.
 */
export class ProjectDocument implements Project {
  readonly doc: Y.Doc;
  readonly root: Y.Map<unknown>;
  readonly levelMaps: Y.Array<Y.Map<unknown>>;
  readonly undoManager: Y.UndoManager;
  readonly filePath: string | null = null;
  #changed = false;

  /** Wraps an initialized document. Its current state is the saved, undo-free starting point. */
  constructor(doc: Y.Doc) {
    this.doc = doc;
    this.root = doc.getMap<unknown>('project');
    this.levelMaps = doc.getArray<Y.Map<unknown>>('levels');
    this.undoManager = new Y.UndoManager([this.root, this.levelMaps], {
      trackedOrigins: new Set([COMMAND_ORIGIN]),
      // One command is one undo step, however close in time to the previous one.
      captureTimeout: 0,
    });
    doc.on('update', () => {
      this.#changed = true;
    });
  }

  get name(): string {
    return readString(this.root, 'name');
  }

  get hasUnsavedChanges(): boolean {
    return this.#changed;
  }

  get canUndo(): boolean {
    return this.undoManager.canUndo();
  }

  get canRedo(): boolean {
    return this.undoManager.canRedo();
  }

  get levels(): readonly Level[] {
    return Object.freeze(this.levelMaps.toArray().map(readLevel));
  }

  get wallDefaults(): WallDefaults {
    const defaults = readMap(this.root, 'wallDefaults');
    return Object.freeze({
      thickness: readLength(defaults, 'thickness'),
      height: readLength(defaults, 'height'),
    });
  }
}

/** Returns the implementation behind a project created by core. */
export function projectDocument(project: Project): ProjectDocument {
  if (!(project instanceof ProjectDocument)) {
    throw new TypeError('The project was not created by @cabane3d/core');
  }
  return project;
}

/**
 * Creates a new project: one empty level, named "Untitled", not linked to a file, no unsaved
 * changes and nothing to undo or redo.
 */
export function createProject(): Project {
  const doc = new Y.Doc();
  doc.transact(() => {
    const root = doc.getMap<unknown>('project');
    root.set('schemaVersion', SCHEMA_VERSION);
    root.set('name', UNTITLED);
    root.set(
      'wallDefaults',
      new Y.Map<unknown>([
        ['thickness', DEFAULT_WALL_THICKNESS],
        ['height', DEFAULT_WALL_HEIGHT],
      ]),
    );
    doc.getArray<Y.Map<unknown>>('levels').push([
      levelMap({
        id: newLevelId(),
        name: FIRST_LEVEL_NAME,
        elevation: mm(0),
        height: DEFAULT_LEVEL_HEIGHT,
      }),
    ]);
  });
  return new ProjectDocument(doc);
}
