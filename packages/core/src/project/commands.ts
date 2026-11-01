import { getRoot, readRecords, readString, type YRecord } from './document';
import { CommandOrigin, type Project, projectInternals } from './project';

/**
 * Outcome of a command (ADR-0004). A rejected command leaves the document untouched and
 * says why, so the UI and the AI can react without catching exceptions.
 */
export type CommandResult<Reason extends string> =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: Reason };

/** Applies `change` to the project's document as one transaction, hence one undo step. */
function runCommand(project: Project, command: string, change: (root: YRecord) => void): void {
  const { doc } = project[projectInternals];
  doc.transact(() => change(getRoot(doc)), new CommandOrigin(command));
}

/** Deletes a level and everything on it. The last level of a project cannot be deleted. */
export function deleteLevel(
  project: Project,
  levelId: string,
): CommandResult<'unknown-level' | 'last-level'> {
  const root = getRoot(project[projectInternals].doc);
  const levels = readRecords(root, 'levels');
  const index = levels.toArray().findIndex((level) => readString(level, 'id') === levelId);
  if (index === -1) return { ok: false, reason: 'unknown-level' };
  if (levels.length <= 1) return { ok: false, reason: 'last-level' };

  runCommand(project, 'deleteLevel', (current) => {
    readRecords(current, 'levels').delete(index, 1);
  });
  return { ok: true };
}
