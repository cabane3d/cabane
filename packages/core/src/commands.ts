/**
 * Commands: the only way to change a project document (ADR-0004).
 *
 * A command validates its arguments first, then applies its change in a single Yjs transaction,
 * which makes it a single undo step. A refused command throws a {@link CommandError} and changes
 * nothing.
 */
import { COMMAND_ORIGIN, type LevelId, type Project, projectDocument } from './project';

export type CommandErrorCode = 'last-level' | 'unknown-level';

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
