/**
 * The project document (ADR-0004) and its typed read layer.
 *
 * The state of a project lives in a Yjs document. This module owns its layout, creates new
 * projects and exposes them through the read-only, live {@link Project} accessors. Changes go
 * through the commands (`commands.ts`), never through the Yjs structures directly.
 *
 * Document layout, schema version 1:
 * - `project` (map): `schemaVersion`, `name`, `wallDefaults` (map: `thickness`, `height`, in mm);
 * - `levels` (array of maps, from the lowest to the highest): `id`, `name`, `elevation`, `height`,
 *   `elements` (array of maps, in creation order);
 * - an element of kind `wall` (map): `kind`, `id`, `startX`, `startY`, `endX`, `endY`,
 *   `thickness`, `height`, in mm. Its length and corners are derived, not stored.
 *
 * The elements were added to version 1 without a migration: no project file existed before them.
 */
import * as Y from 'yjs';
import { type Mm, mm } from './units';
import { type Wall, type WallId, type WallValues, wallOf } from './wall';

/** Version of the document layout. Bumped with an explicit migration (ADR-0004). */
const SCHEMA_VERSION = 1;

/** Identifier of a level, unique within its project. */
export type LevelId = string & { readonly __brand: 'LevelId' };

/** Union of element types. Later features extend it. */
export type Element = Wall;

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

export function newWallId(): WallId {
  return crypto.randomUUID() as WallId;
}

/** Builds the Yjs map of a level, with no element. */
export function levelMap(level: Omit<Level, 'elements'>): Y.Map<unknown> {
  return new Y.Map<unknown>([
    ['id', level.id],
    ['name', level.name],
    ['elevation', level.elevation],
    ['height', level.height],
    ['elements', new Y.Array<Y.Map<unknown>>()],
  ]);
}

/** Builds the Yjs map of a wall from its stored values. */
export function wallMap(wall: WallValues): Y.Map<unknown> {
  return new Y.Map<unknown>([
    ['kind', 'wall'],
    ['id', wall.id],
    ['startX', wall.start.x],
    ['startY', wall.start.y],
    ['endX', wall.end.x],
    ['endY', wall.end.y],
    ['thickness', wall.thickness],
    ['height', wall.height],
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

/** The elements of a level map, in creation order. */
export function elementMaps(level: Y.Map<unknown>): Y.Array<Y.Map<unknown>> {
  const elements = level.get('elements');
  if (!(elements instanceof Y.Array)) throw invalidDocument('"elements" must be an array');
  return elements;
}

function readElement(map: unknown): Element {
  if (!(map instanceof Y.Map)) throw invalidDocument('an element must be a map');
  const kind = map.get('kind');
  if (kind !== 'wall') throw invalidDocument(`unknown element kind ${String(kind)}`);
  return wallOf({
    id: readString(map, 'id') as WallId,
    start: { x: readLength(map, 'startX'), y: readLength(map, 'startY') },
    end: { x: readLength(map, 'endX'), y: readLength(map, 'endY') },
    thickness: readLength(map, 'thickness'),
    height: readLength(map, 'height'),
  });
}

function readLevel(map: Y.Map<unknown>): Level {
  return Object.freeze({
    id: readString(map, 'id') as LevelId,
    name: readString(map, 'name'),
    elevation: readLength(map, 'elevation'),
    height: readLength(map, 'height'),
    elements: Object.freeze(elementMaps(map).toArray().map(readElement)),
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

  /** The map of the wall defaults, changed by `setWallDefaults` only. */
  get wallDefaultsMap(): Y.Map<unknown> {
    return readMap(this.root, 'wallDefaults');
  }

  /** The map of the level `levelId`, or `undefined` when the project has no such level. */
  levelMap(levelId: LevelId): Y.Map<unknown> | undefined {
    return this.levelMaps.toArray().find((level) => level.get('id') === levelId);
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
 * Calls `listener` after every change of the project: a command, an undo or a redo. Returns the
 * function that stops listening. For the interface, which shows the project again after a change;
 * a change itself always goes through a command.
 */
export function observeProject(project: Project, listener: () => void): () => void {
  const { doc } = projectDocument(project);
  // `update` comes after the undo manager has recorded the change, so `canUndo` and `canRedo`
  // are up to date when the listener reads them.
  const onUpdate = () => listener();
  doc.on('update', onUpdate);
  return () => doc.off('update', onUpdate);
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
