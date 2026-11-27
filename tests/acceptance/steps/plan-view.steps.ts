import { expect } from '@playwright/test';
import { Then, When } from '../../support/fixtures';
import { planView, statusBar } from '../../support/locators';
import {
  movePlan,
  type PlanGesture,
  pageOfPlanPoint,
  planPointOfPage,
  readPlanView,
} from '../../support/plan-view';

/** Pixels of one wheel notch, as Playwright sends it: the sign of deltaY decides the direction. */
const WHEEL_NOTCH_PX = 100;

/** Maps the gesture wording of the spec to the gesture of `movePlan`. */
function gestureOf(wording: string): PlanGesture {
  return wording === 'the middle button' ? 'middle' : 'space';
}

Then('the Plan view is displayed', async ({ appPage }) => {
  await expect(planView(appPage)).toBeVisible();
});

Then('the Status bar is displayed', async ({ appPage }) => {
  await expect(statusBar(appPage)).toBeVisible();
});

Then(/^the Status bar (?:still )?shows a zoom of (\d+)%$/, async ({ appPage }, percent: string) => {
  await expect(statusBar(appPage).getByText(`Zoom ${percent}%`, { exact: true })).toBeVisible();
});

Then('the Status bar shows {string}', async ({ appPage }, text: string) => {
  await expect(statusBar(appPage).getByText(text, { exact: true })).toBeVisible();
});

// One definition for the Given and the When wording: Playwright-bdd matches steps whatever the keyword.
When(
  /^(?:the cursor is at|the user moves the cursor to) the plan point \((-?\d+) mm, (-?\d+) mm\)$/,
  async ({ appPage, planMemory }, x: string, y: string) => {
    const view = await readPlanView(appPage);
    const page = pageOfPlanPoint(view, { x: Number(x), y: Number(y) });
    await appPage.mouse.move(page.x, page.y);
    planMemory.cursor = page;
  },
);

When(
  /^the user turns the wheel (up|down) by (\d+) notches?$/,
  async ({ appPage }, direction: string, notches: string) => {
    const deltaY = direction === 'up' ? -WHEEL_NOTCH_PX : WHEEL_NOTCH_PX;
    for (let notch = 0; notch < Number(notches); notch++) {
      await appPage.mouse.wheel(0, deltaY);
    }
  },
);

Then(
  /^the plan point under the cursor is still \((-?\d+) mm, (-?\d+) mm\)$/,
  async ({ appPage, planMemory }, x: string, y: string) => {
    const cursor = planMemory.cursor;
    if (!cursor) throw new Error('No cursor position was recorded in this scenario');
    const view = await readPlanView(appPage);
    const point = planPointOfPage(view, cursor);
    // Within one pixel on each axis: 1 / scale millimeters.
    const tolerance = 1 / view.scale;
    expect(Math.abs(point.x - Number(x))).toBeLessThanOrEqual(tolerance);
    expect(Math.abs(point.y - Number(y))).toBeLessThanOrEqual(tolerance);
  },
);

// The Given ("moved") and the When ("moves") wording share one definition.
When(
  /^the user (?:moves|moved) the plan with (the middle button|the Space key and the left button) by \((-?\d+), (-?\d+)\) px$/,
  async ({ appPage, planMemory }, gesture: string, dx: string, dy: string) => {
    await movePlan(appPage, planMemory, gestureOf(gesture), Number(dx), Number(dy));
  },
);

Then(
  /^the plan origin has moved by \((-?\d+), (-?\d+)\) px on screen$/,
  async ({ appPage, planMemory }, dx: string, dy: string) => {
    const before = planMemory.originBeforePan;
    if (!before) throw new Error('No pan was recorded in this scenario');
    await expect
      .poll(async () => (await readPlanView(appPage)).origin.x - before.x)
      .toBeCloseTo(Number(dx), 3);
    await expect
      .poll(async () => (await readPlanView(appPage)).origin.y - before.y)
      .toBeCloseTo(Number(dy), 3);
  },
);
