// @vitest-environment jsdom
import {
  addWall,
  createProject,
  type Level,
  mm,
  type Point,
  type Project,
  wallsOf,
} from '@cabane3d/core';
import { jointsOf } from '@cabane3d/geometry';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mountPlanCanvas, type PlanCanvas } from './plan-canvas';
import { drawPlan } from './plan-drawing';
import { showPlanElements } from './plan-elements';
import type { PlanTokens } from './tokens';
import { createPlanView } from './view';

function at(x: number, y: number): Point {
  return { x: mm(x), y: mm(y) };
}

function level(project: Project): Level {
  const first = project.levels[0];
  if (!first) throw new Error('a new project has a level');
  return first;
}

/** A chain of walls through the given points, on the first level of a new project. */
function chainThrough(...points: readonly Point[]): Project {
  const project = createProject();
  points.slice(1).forEach((end, index) => {
    const start = points[index];
    if (start) addWall(project, level(project).id, { start, end });
  });
  return project;
}

/** A ResizeObserver that never reports: jsdom has no layout. */
class NoResizeObserver implements ResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

describe('mountPlanCanvas, joints', () => {
  let region: HTMLElement;
  let canvas: HTMLCanvasElement;
  let list: HTMLElement;
  let plan: PlanCanvas;

  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', NoResizeObserver);
    // Drawing needs a 2D context, which jsdom lacks: the frame never runs.
    vi.stubGlobal('requestAnimationFrame', () => 1);
    vi.stubGlobal('cancelAnimationFrame', () => {});
    region = document.createElement('section');
    canvas = document.createElement('canvas');
    list = document.createElement('ul');
    region.append(canvas, list);
    document.body.append(region);
    plan = mountPlanCanvas(region, canvas, {}, list);
  });

  afterEach(() => {
    plan.dispose();
    region.remove();
    vi.unstubAllGlobals();
  });

  function show(project: Project): void {
    plan.showScene({ level: level(project), wallThickness: project.wallDefaults.thickness });
  }

  function jointItems(): readonly HTMLElement[] {
    return [...list.querySelectorAll<HTMLElement>('[data-element="joint"]')];
  }

  it('shows the joint of two walls that meet at an outer corner', () => {
    show(chainThrough(at(0, 0), at(4000, 0), at(4000, 3000)));

    expect(jointItems().map((item) => [item.dataset.x, item.dataset.y])).toEqual([['4000', '0']]);
  });

  it('shows no joint where a third wall meets inside the corner (WALL-048 layout)', () => {
    const project = chainThrough(at(0, 0), at(4000, 0), at(4000, 3000));
    addWall(project, level(project).id, { start: at(4000, 0), end: at(7000, 0) });

    show(project);

    expect(list.querySelectorAll('[data-element="wall"]')).toHaveLength(3);
    expect(jointItems()).toEqual([]);
  });
});

describe('showPlanElements, joints', () => {
  it('writes a joint item with its shared point and its polygon after the walls', () => {
    const project = chainThrough(at(0, 0), at(4000, 0), at(4000, 3000));
    const walls = wallsOf(level(project));
    const list = document.createElement('ul');

    showPlanElements(list, walls, jointsOf(walls), [], null);

    const items = [...list.querySelectorAll<HTMLElement>('li')].map((item) => item.dataset.element);
    expect(items).toEqual(['wall', 'wall', 'joint']);
    const joint = list.querySelector<HTMLElement>('[data-element="joint"]');
    expect(joint?.dataset.x).toBe('4000');
    expect(joint?.dataset.y).toBe('0');
    const points: unknown = JSON.parse(joint?.dataset.points ?? 'null');
    expect(points).toEqual([
      [4000, 0],
      [4200, 0],
      [4200, -200],
      [4000, -200],
    ]);
    expect(joint?.textContent).toBe('Joint at (4000 mm, 0 mm)');
  });
});

/** A 2D context that records the color of each filled path and its number of points. */
function recordingContext(): {
  readonly context: CanvasRenderingContext2D;
  readonly fills: { color: string; points: number }[];
} {
  const fills: { color: string; points: number }[] = [];
  let points = 0;
  const recorder = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    lineJoin: 'miter',
    clearRect() {},
    beginPath() {
      points = 0;
    },
    lineTo() {
      points += 1;
    },
    moveTo() {},
    closePath() {},
    fill() {
      fills.push({ color: String(recorder.fillStyle), points });
    },
    stroke() {},
    arc() {},
  };
  // Only the methods the plan uses on walls and joints are recorded.
  return { context: recorder as unknown as CanvasRenderingContext2D, fills };
}

const TOKENS: PlanTokens = {
  ink: 'ink',
  paper: 'paper',
  wall: 'wall',
  guide: 'guide',
  selection: 'selection',
  strokeFine: 1,
  strokeMedium: 2,
  handleSize: 8,
  tickSize: 8,
  extensionGap: 2,
  extensionOvershoot: 2,
  dimensionFont: 'dimension font',
  labelFont: 'label font',
};

describe('drawPlan, joints', () => {
  it('fills each joint in the wall color, like the walls', () => {
    const walls = wallsOf(level(chainThrough(at(0, 0), at(4000, 0), at(4000, 3000))));
    const { context, fills } = recordingContext();

    drawPlan(context, createPlanView(1000, 600), TOKENS, {
      walls,
      joints: jointsOf(walls),
      anchors: [],
      snapped: null,
      drawing: null,
    });

    expect(fills).toEqual([
      { color: 'wall', points: 4 },
      { color: 'wall', points: 4 },
      { color: 'wall', points: 4 },
    ]);
  });
});
