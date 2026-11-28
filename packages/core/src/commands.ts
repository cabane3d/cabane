/**
 * Commands: the only way to change a project document (ADR-0004).
 *
 * A command validates its arguments first, then applies its change in a single Yjs transaction,
 * which makes it a single undo step. A refused command throws a {@link CommandError} and changes
 * nothing.
 */
import {
  COMMAND_ORIGIN,
  elementMaps,
  type LevelId,
  newWallId,
  type Project,
  projectDocument,
  wallMap,
} from './project';
import { LENGTH_TOLERANCE, type Mm, type Point } from './units';
import { distanceBetween, type WallId } from './wall';

export type CommandErrorCode =
  | 'last-level'
  | 'unknown-level'
  | 'no-length'
  | 'unknown-wall'
  | 'non-positive-thickness'
  | 'non-positive-height'
  | 'non-positive-length';

/** Thrown by a command that refuses its arguments. The project is left unchanged. */
export class CommandError extends Error {
  override readonly name = 'CommandError';
  readonly code: CommandErrorCode;

  constructor(code: CommandErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

/** Deletes a level. A project always keeps at least one level. */
export function deleteLevel(project: Project, levelId: LevelId): void {
  const document = projectDocument(project);
  const levels = document.levelMaps;
  const index = levels.toArray().findIndex((level) => level.get('id') === levelId);
  if (index < 0) {
    throw new CommandError('unknown-level', `The project has no level ${levelId}`);
  }
  if (levels.length <= 1) {
    throw new CommandError('last-level', 'A project needs at least one level');
  }
  document.doc.transact(() => {
    levels.delete(index, 1);
  }, COMMAND_ORIGIN);
}

/**
 * Adds a wall from `start` to `end` on the level `levelId`, with the wall defaults of the project
 * at the time of the call. The points are stored as given. Returns the id of the new wall.
 */
export function addWall(
  project: Project,
  levelId: LevelId,
  wall: { readonly start: Point; readonly end: Point },
): WallId {
  const document = projectDocument(project);
  const level = document.levelMap(levelId);
  if (!level) {
    throw new CommandError('unknown-level', `The project has no level ${levelId}`);
  }
  if (!(distanceBetween(wall.start, wall.end) >= LENGTH_TOLERANCE)) {
    throw new CommandError('no-length', 'A wall needs two distinct points');
  }
  const { thickness, height } = document.wallDefaults;
  const id = newWallId();
  document.doc.transact(() => {
    elementMaps(level).push([wallMap({ id, start: wall.start, end: wall.end, thickness, height })]);
  }, COMMAND_ORIGIN);
  return id;
}

/**
 * Changes the defaults of the walls added afterwards, in one undo step. Existing walls keep their
 * own thickness and height.
 */
export function setWallDefaults(
  project: Project,
  defaults: { readonly thickness?: Mm; readonly height?: Mm },
): void {
  const document = projectDocument(project);
  const { thickness, height } = defaults;
  // `!(x > 0)` also refuses NaN.
  if (thickness !== undefined && !(thickness > 0)) {
    throw new CommandError('non-positive-thickness', 'A wall thickness must be positive');
  }
  if (height !== undefined && !(height > 0)) {
    throw new CommandError('non-positive-height', 'A wall height must be positive');
  }
  if (thickness === undefined && height === undefined) return;
  const map = document.wallDefaultsMap;
  document.doc.transact(() => {
    if (thickness !== undefined) map.set('thickness', thickness);
    if (height !== undefined) map.set('height', height);
  }, COMMAND_ORIGIN);
}

/** Undoes the last change of the project, one command at a time. Nothing to undo: does nothing. */
export function undo(project: Project): void {
  projectDocument(project).undoManager.undo();
}

/** Redoes the last undone change, one command at a time. Nothing to redo: does nothing. */
export function redo(project: Project): void {
  projectDocument(project).undoManager.redo();
}
