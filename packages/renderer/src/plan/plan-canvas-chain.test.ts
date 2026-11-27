// @vitest-environment jsdom
import {
  addWall,
  CommandError,
  createProject,
  type Level,
  type Project,
  redo,
  undo,
  wallsOf,
} from '@cabane3d/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mountPlanCanvas, type PlanCanvas } from './plan-canvas';

/**
 * The chain behaviours of the Wall tool that no scenario covers (maintainer's decisions,
 * docs/api/walls.md): with a real project, and the plan shown again after every change.
 */

const WIDTH = 1000;
const HEIGHT = 600;

class NoResizeObserver implements ResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

let region: HTMLElement;
let canvas: HTMLCanvasElement;
let plan: PlanCanvas;
let project: Project;

function level(): Level {
  const first = project.levels[0];
  if (!first) throw new Error('a new project has a level');
  return first;
}

function show(): void {
  plan.showScene({ level: level(), wallThickness: project.wallDefaults.thickness });
}

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', NoResizeObserver);
  // Drawing needs a 2D context, which jsdom lacks: the frame never runs.
  vi.stubGlobal('requestAnimationFrame', () => 1);
  vi.stubGlobal('cancelAnimationFrame', () => {});
  region = document.createElement('section');
  canvas = document.createElement('canvas');
  vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    width: WIDTH,
    height: HEIGHT,
    right: WIDTH,
    bottom: HEIGHT,
    toJSON: () => ({}),
  });
  region.append(canvas);
  document.body.append(region);
  project = createProject();
  plan = mountPlanCanvas(region, canvas, {
    onDrawWall: (wall) => {
      try {
        const id = addWall(project, level().id, wall);
        show();
        return id;
      } catch (error) {
        if (error instanceof CommandError) return null;
        throw error;
      }
    },
  });
  show();
  plan.setWallTool(true);
});

afterEach(() => {
  plan.dispose();
  region.remove();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/** A left click at the plan point (x, y) mm: the initial view is 1 px = 10 mm, origin centered. */
function click(x: number, y: number): void {
  canvas.dispatchEvent(
    new PointerEvent('pointerdown', {
      pointerId: 1,
      button: 0,
      clientX: WIDTH / 2 + x / 10,
      clientY: HEIGHT / 2 - y / 10,
      bubbles: true,
      cancelable: true,
    }),
  );
}

function wallEnds(): { start: [number, number]; end: [number, number] }[] {
  return wallsOf(level()).map((wall) => ({
    start: [wall.start.x, wall.start.y],
    end: [wall.end.x, wall.end.y],
  }));
}

describe('mountPlanCanvas, the chain of the Wall tool', () => {
  it('ends the chain on Escape without preventing its default action', () => {
    click(0, 0);
    click(1000, 0);

    const keydown = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    document.body.dispatchEvent(keydown);
    click(1000, 1000);

    expect(keydown.defaultPrevented).toBe(false);
    expect(wallEnds()).toHaveLength(1);
  });

  it('keeps the chain on an Escape typed in a text field', () => {
    const input = document.createElement('input');
    region.append(input);
    click(0, 0);

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    click(1000, 0);

    expect(wallEnds()).toEqual([{ start: [0, 0], end: [1000, 0] }]);
  });

  it('ignores a click back on the start of a chain of a single wall, and goes on', () => {
    click(0, 0);
    click(1000, 0);

    click(0, 0);
    expect(wallEnds()).toHaveLength(1);

    click(1000, 1000);
    expect(wallEnds()).toEqual([
      { start: [0, 0], end: [1000, 0] },
      { start: [1000, 0], end: [1000, 1000] },
    ]);
  });

  it('closes a longer chain on its first point', () => {
    click(0, 0);
    click(1000, 0);
    click(1000, 1000);

    click(0, 0);
    click(-1000, 0);

    expect(wallEnds()).toEqual([
      { start: [0, 0], end: [1000, 0] },
      { start: [1000, 0], end: [1000, 1000] },
      { start: [1000, 1000], end: [0, 0] },
    ]);
  });

  it('resumes from the end of a wall redone during the chain', () => {
    click(0, 0);
    click(1000, 0);
    click(1000, 1000);

    undo(project);
    show();
    redo(project);
    show();
    click(0, 1000);

    expect(wallEnds()).toEqual([
      { start: [0, 0], end: [1000, 0] },
      { start: [1000, 0], end: [1000, 1000] },
      { start: [1000, 1000], end: [0, 1000] },
    ]);
  });
});
