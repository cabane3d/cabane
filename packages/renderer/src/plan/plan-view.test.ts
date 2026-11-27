import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
// Entry points of the packages, imported by relative path like the acceptance steps (workspace
// packages are not linked by name at the root). The public API is the one of docs/api/plan-view.md.
import { lengthsEqual, mm, type Point } from '../../../core/src/index';
import {
  createPlanView,
  type PlanView,
  panView,
  planToScreen,
  type ScreenPoint,
  screenToPlan,
  zoomPercent,
  zoomView,
} from '../index';

/** A view of `width` by `height` px at `mmPerPixel` mm per px, origin at the center unless given. */
function viewOf(width: number, height: number, mmPerPixel: number, origin?: ScreenPoint): PlanView {
  return {
    width,
    height,
    scale: 1 / mmPerPixel,
    origin: origin ?? { x: width / 2, y: height / 2 },
  };
}

function plan(x: number, y: number): Point {
  return { x: mm(x), y: mm(y) };
}

function expectScaleMm(view: PlanView, expectedMm: number): void {
  expect(Math.abs(1 / view.scale - expectedMm)).toBeLessThan(0.001);
}

function expectZoom(view: PlanView, expectedPercent: number): void {
  expect(Math.abs(zoomPercent(view) - expectedPercent)).toBeLessThan(0.001);
}

function expectOrigin(view: PlanView, x: number, y: number): void {
  expect(Math.abs(view.origin.x - x)).toBeLessThan(0.001);
  expect(Math.abs(view.origin.y - y)).toBeLessThan(0.001);
}

function expectSamePlanPoint(actual: Point, expected: Point): void {
  expect(lengthsEqual(actual.x, expected.x)).toBe(true);
  expect(lengthsEqual(actual.y, expected.y)).toBe(true);
}

describe('@PLAN-001 conversions between plan and screen coordinates', () => {
  it.each([
    [0, 0, 500, 300],
    [1000, 0, 600, 300],
    [0, 1000, 500, 200],
    [-2500, -500, 250, 350],
  ])(
    '@PLAN-001 converts the plan point (%d mm, %d mm) to screen (%d, %d) and back',
    (planX, planY, screenX, screenY) => {
      const view = viewOf(1000, 600, 10);
      const screen = planToScreen(view, plan(planX, planY));

      expect(Math.abs(screen.x - screenX)).toBeLessThan(0.001);
      expect(Math.abs(screen.y - screenY)).toBeLessThan(0.001);
      expectSamePlanPoint(screenToPlan(view, screen), plan(planX, planY));
    },
  );
});

describe('@PLAN-002 a new view', () => {
  it('@PLAN-002 starts at 1 px = 10 mm, zoom 100%, with the origin at the center', () => {
    const view = createPlanView(1000, 600);

    expectScaleMm(view, 10);
    expectZoom(view, 100);
    expectOrigin(view, 500, 300);
  });
});

describe('@PLAN-003 the wheel zooms toward the cursor', () => {
  it('@PLAN-003 keeps the plan point under the cursor and reaches 1 px = 7.513 mm after 3 notches', () => {
    const before = viewOf(1000, 600, 10);
    const cursor = { x: 700, y: 200 };
    const pointBefore = screenToPlan(before, cursor);

    const after = zoomView(before, 3, cursor);

    expectSamePlanPoint(screenToPlan(after, cursor), pointBefore);
    expectScaleMm(after, 7.513);
  });

  it('@PLAN-003 keeps the plan point under any cursor, for any number of notches', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -40, max: 40 }),
        fc.integer({ min: 0, max: 1000 }),
        fc.integer({ min: 0, max: 600 }),
        (notches, cursorX, cursorY) => {
          const before = viewOf(1000, 600, 10);
          const cursor = { x: cursorX, y: cursorY };
          const after = zoomView(before, notches, cursor);

          expectSamePlanPoint(screenToPlan(after, cursor), screenToPlan(before, cursor));
        },
      ),
    );
  });
});

describe('@PLAN-004 zooming out then in restores the view', () => {
  it('@PLAN-004 returns to 1 px = 10 mm with the origin at the center', () => {
    const start = viewOf(1000, 600, 10);
    const cursor = { x: 700, y: 200 };

    const zoomedOut = zoomView(start, -4, cursor);
    const restored = zoomView(zoomedOut, 4, cursor);

    expectScaleMm(restored, 10);
    expectOrigin(restored, 500, 300);
  });
});

describe('@PLAN-005 the scale stays within its limits', () => {
  it.each([
    { direction: 'in', notches: 100, expectedMm: 1, expectedZoom: 1000 },
    { direction: 'out', notches: -100, expectedMm: 100, expectedZoom: 10 },
  ])(
    '@PLAN-005 zooming $direction by 100 notches gives 1 px = $expectedMm mm, zoom $expectedZoom%',
    ({ notches, expectedMm, expectedZoom }) => {
      const view = viewOf(1000, 600, 10);

      const limited = zoomView(view, notches, { x: 700, y: 200 });

      expectScaleMm(limited, expectedMm);
      expectZoom(limited, expectedZoom);
    },
  );
});

describe('@PLAN-006 zooming at a limit does not move the plan', () => {
  it('@PLAN-006 keeps the scale and the origin when zooming in past 1 px = 1 mm', () => {
    const view = viewOf(1000, 600, 1, { x: 300, y: 100 });

    const zoomed = zoomView(view, 1, { x: 700, y: 200 });

    expectScaleMm(zoomed, 1);
    expectOrigin(zoomed, 300, 100);
  });
});

describe('@PLAN-007 moving the plan', () => {
  it('@PLAN-007 moves the origin by the pan and keeps the scale', () => {
    const view = viewOf(1000, 600, 10);

    const panned = panView(view, -100, 50);

    expectOrigin(panned, 400, 350);
    expectScaleMm(panned, 10);
  });
});
