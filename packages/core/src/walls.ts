/** Reading the walls of a project (docs/api/walls.md). */
import type { Level, Project } from './project';
import type { Wall, WallId } from './wall';

/** The walls of `level`, in creation order. */
export function wallsOf(level: Level): readonly Wall[] {
  return level.elements.filter((element) => element.kind === 'wall');
}

/** The wall `wallId`, read from the project as it is now; `undefined` if the project has none. */
export function findWall(project: Project, wallId: WallId): Wall | undefined {
  for (const level of project.levels) {
    const wall = wallsOf(level).find((candidate) => candidate.id === wallId);
    if (wall) return wall;
  }
  return undefined;
}
