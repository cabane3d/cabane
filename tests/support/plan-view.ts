import { expect, type Page } from '@playwright/test';
import { planView } from './locators';

/** A point of the page, in CSS pixels, from the top-left corner of the page. */
export interface PagePoint {
  readonly x: number;
  readonly y: number;
}

/** A point of the plan, in millimeters (X to the right, Y up, ADR-0017). */
export interface MmPoint {
  readonly x: number;
  readonly y: number;
}

/**
 * What the Plan view region exposes about its view (docs/api/plan-view.md): the scale in pixels per
 * millimeter, the position of the plan origin relative to the region, and the region on the page.
 */
export interface PlanViewState {
  readonly box: {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
  };
  readonly scale: number;
  readonly origin: PagePoint;
}

/** Per-scenario memory of the gestures: the cursor position and the origin before the last pan. */
export interface PlanMemory {
  cursor?: PagePoint;
  originBeforePan?: PagePoint;
  /** The shared point of the joint that the last step found on the plan (draw-wall). */
  joint?: MmPoint;
}

/** Reads the view of the Plan view region. Waits until the renderer has published its attributes. */
export async function readPlanView(page: Page): Promise<PlanViewState> {
  const region = planView(page);
  await expect(region).toHaveAttribute('data-scale', /.+/);
  const box = await region.boundingBox();
  if (!box) throw new Error('The Plan view has no bounding box: it is not displayed');
  return {
    box,
    scale: Number(await region.getAttribute('data-scale')),
    origin: {
      x: Number(await region.getAttribute('data-origin-x')),
      y: Number(await region.getAttribute('data-origin-y')),
    },
  };
}

/** The page position of a plan point, in the view as it is now (Y of the plan points up). */
export function pageOfPlanPoint(view: PlanViewState, point: MmPoint): PagePoint {
  return {
    x: view.box.x + view.origin.x + point.x * view.scale,
    y: view.box.y + view.origin.y - point.y * view.scale,
  };
}

/** The plan point under a page position, in the view as it is now. */
export function planPointOfPage(view: PlanViewState, page: PagePoint): MmPoint {
  return {
    x: (page.x - view.box.x - view.origin.x) / view.scale,
    y: (view.box.y + view.origin.y - page.y) / view.scale,
  };
}

export type PlanGesture = 'middle' | 'space';

/**
 * Moves the plan by (dx, dy) px, from the center of the Plan view: with the middle button, or with
 * the Space key held with the left button. Records the cursor and the origin before the pan.
 */
export async function movePlan(
  page: Page,
  memory: PlanMemory,
  gesture: PlanGesture,
  dx: number,
  dy: number,
): Promise<void> {
  const view = await readPlanView(page);
  memory.originBeforePan = view.origin;
  const start = {
    x: view.box.x + view.box.width / 2,
    y: view.box.y + view.box.height / 2,
  };
  const end = { x: start.x + dx, y: start.y + dy };
  await page.mouse.move(start.x, start.y);
  if (gesture === 'middle') {
    await page.mouse.down({ button: 'middle' });
    await page.mouse.move(end.x, end.y);
    await page.mouse.up({ button: 'middle' });
  } else {
    await page.keyboard.down('Space');
    await page.mouse.down();
    await page.mouse.move(end.x, end.y);
    await page.mouse.up();
    await page.keyboard.up('Space');
  }
  memory.cursor = end;
}
