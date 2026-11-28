import { expect } from '@playwright/test';
import { Given, Then, When } from '../../support/fixtures';
import { planElements, planView, redoButton, undoButton } from '../../support/locators';
import type { MmPoint } from '../../support/plan-view';
import { scenarioIdOf } from '../../support/scenario';
import {
  anchorItems,
  clickPlan,
  doubleClickPlan,
  drawWall,
  expectAnchorSnapped,
  expectAnchorsAt,
  expectDrawingLength,
  expectJointAt,
  expectJointCovers,
  expectNoJoint,
  expectWallEnds,
  mmPoint,
  movePointer,
  READ_TOLERANCE_MM,
  rightClickPlan,
  wallItems,
} from '../../support/walls';

// Steps of specs/walls/draw-wall.feature that are not already defined for the Tool bar
// (tool-bar.steps.ts) or the Plan view (plan-view.steps.ts). A wording used as a Given and as a
// When or a Then is defined once: playwright-bdd matches steps whatever their keyword.

/** The plan point of a step, written "(1000 mm, -2000 mm)". */
const POINT = String.raw`\((-?\d+) mm, (-?\d+) mm\)`;

// ---- Gestures on the plan (docs/api/walls.md) ----

When(
  new RegExp(`^the user (?:clicks|clicked) the plan at ${POINT}$`),
  async ({ appPage }, x: string, y: string) => {
    await clickPlan(appPage, mmPoint(x, y));
  },
);

When(
  new RegExp(`^the user (?:clicks|clicked) the plan near ${POINT}, a few pixels off$`),
  async ({ appPage }, x: string, y: string) => {
    await clickPlan(appPage, mmPoint(x, y), true);
  },
);

When(
  new RegExp(`^the user double-clicks the plan at ${POINT}$`),
  async ({ appPage }, x: string, y: string) => {
    await doubleClickPlan(appPage, mmPoint(x, y));
  },
);

When(
  new RegExp(`^the user right-clicks the plan at ${POINT}$`),
  async ({ appPage }, x: string, y: string) => {
    await rightClickPlan(appPage, mmPoint(x, y));
  },
);

When(
  new RegExp(`^the user moves the cursor (to|near) ${POINT}(?:, a few pixels off)?$`),
  async ({ appPage }, verb: string, x: string, y: string) => {
    await movePointer(appPage, mmPoint(x, y), verb === 'near');
  },
);

// Given: the wall is drawn with the Wall tool, then the Select tool is chosen again.
Given(
  new RegExp(`^a wall is drawn from ${POINT} to ${POINT}$`),
  async ({ appPage }, startX: string, startY: string, endX: string, endY: string) => {
    await drawWall(appPage, mmPoint(startX, startY), mmPoint(endX, endY));
  },
);

When('the user presses Escape', async ({ appPage }) => {
  await appPage.keyboard.press('Escape');
});

When('the user presses Ctrl+Z', async ({ appPage }) => {
  await appPage.keyboard.press('Control+z');
});

When('the user presses Ctrl+Shift+Z', async ({ appPage }) => {
  await appPage.keyboard.press('Control+Shift+z');
});

When(
  /^the user (?:chooses|chose) the (Undo|Redo) button of the Top bar$/,
  async ({ appPage }, name: string) => {
    const button = name === 'Undo' ? undoButton(appPage) : redoButton(appPage);
    await button.click();
  },
);

// ---- Undo and Redo ----

Then('the Undo button of the Top bar is disabled', async ({ appPage }) => {
  await expect(undoButton(appPage)).toBeDisabled();
});

Then('the Redo button of the Top bar is disabled', async ({ appPage }) => {
  await expect(redoButton(appPage)).toBeDisabled();
});

// ---- Walls of the project and of the plan (docs/api/walls.md) ----

// Level 0 is the only level: the project and the plan show the same walls.
Then(/^the project has (\d+) walls? on "Level 0"$/, async ({ appPage }, count: string) => {
  await expect(wallItems(appPage)).toHaveCount(Number(count));
});

// A count of zero means something only when the list describing the plan is shown.
Then(/^the project has no wall(?: yet)?$/, async ({ appPage }) => {
  await expect(planElements(appPage)).toHaveCount(1);
  await expect(wallItems(appPage)).toHaveCount(0);
});

Then(/^the plan shows (\d+) walls?$/, async ({ appPage }, count: string) => {
  await expect(wallItems(appPage)).toHaveCount(Number(count));
});

Then(
  new RegExp(`^that wall starts at ${POINT} and ends at ${POINT}$`),
  async ({ appPage }, startX: string, startY: string, endX: string, endY: string) => {
    await expectWallEnds(
      wallItems(appPage).nth(0),
      { start: mmPoint(startX, startY), end: mmPoint(endX, endY) },
      READ_TOLERANCE_MM,
    );
  },
);

const WALL_ORDINALS: Readonly<Record<string, number>> = { first: 0, second: 1, third: 2 };

Then(
  new RegExp(`^the (first|second|third) wall starts at ${POINT} and ends at ${POINT}$`),
  async (
    { appPage },
    ordinal: string,
    startX: string,
    startY: string,
    endX: string,
    endY: string,
  ) => {
    await expectWallEnds(
      wallItems(appPage).nth(WALL_ORDINALS[ordinal] ?? -1),
      { start: mmPoint(startX, startY), end: mmPoint(endX, endY) },
      READ_TOLERANCE_MM,
    );
  },
);

Then(
  new RegExp(`^the (first|second|third) wall starts at ${POINT}$`),
  async ({ appPage }, ordinal: string, x: string, y: string) => {
    await expectWallEnds(
      wallItems(appPage).nth(WALL_ORDINALS[ordinal] ?? -1),
      { start: mmPoint(x, y) },
      READ_TOLERANCE_MM,
    );
  },
);

Then(
  new RegExp(`^the second wall starts at exactly ${POINT}$`),
  async ({ appPage }, x: string, y: string) => {
    // Exact: the wall starts on the anchor, with the very same coordinates.
    await expectWallEnds(wallItems(appPage).nth(1), { start: mmPoint(x, y) }, 0);
  },
);

Then(new RegExp(`^the third wall ends at ${POINT}$`), async ({ appPage }, x: string, y: string) => {
  await expectWallEnds(wallItems(appPage).nth(2), { end: mmPoint(x, y) }, READ_TOLERANCE_MM);
});

// ---- The wall being drawn (docs/api/walls.md) ----

Then(
  /^the plan shows a wall being drawn with a length of (\d+) mm$/,
  async ({ appPage }, length: string) => {
    await expectDrawingLength(appPage, Number(length));
  },
);

Then('the plan shows no wall being drawn', async ({ appPage }) => {
  await expect(planView(appPage)).toHaveAttribute('data-drawing', 'false');
});

// ---- Anchors (docs/api/walls.md) ----

Then(
  new RegExp(`^the plan shows an anchor at ${POINT} and at ${POINT}$`),
  async ({ appPage }, ax: string, ay: string, bx: string, by: string) => {
    await expectAnchorsAt(appPage, [mmPoint(ax, ay), mmPoint(bx, by)]);
  },
);

Then('the plan shows no anchor', async ({ appPage }) => {
  await expect(anchorItems(appPage)).toHaveCount(0);
});

Then(
  new RegExp(`^the plan marks the anchor at ${POINT} as snapped$`),
  async ({ appPage }, x: string, y: string) => {
    await expectAnchorSnapped(appPage, mmPoint(x, y));
  },
);

// ---- Joints (docs/api/walls.md) ----

/** The points of a step written "(4500, 1000) (4700, 1000)", without units (the joint points). */
function pointsOf(text: string): MmPoint[] {
  return [...text.matchAll(/\((-?[\d.]+), (-?[\d.]+)\)/g)].map((match) =>
    mmPoint(match[1] ?? '', match[2] ?? ''),
  );
}

Then(
  new RegExp(`^the plan shows a joint at ${POINT}$`),
  async ({ appPage, planMemory }, x: string, y: string) => {
    const point = mmPoint(x, y);
    await expectJointAt(appPage, point);
    // The next step of the scenario reads the points of this joint.
    planMemory.joint = point;
  },
);

// "No joint" means something only when the plan shows the walls of the scenario: an empty plan
// would have no joint too. The scenarios that use this step keep one or two walls on the plan.
Then('the plan shows no joint', async ({ appPage }) => {
  await expect(wallItems(appPage)).not.toHaveCount(0);
  await expectNoJoint(appPage);
});

Then(/^that joint covers the points (.+)$/, async ({ appPage, planMemory }, points: string) => {
  const joint = planMemory.joint;
  if (!joint) throw new Error('The scenario shows no joint before this step');
  await expectJointCovers(appPage, joint, pointsOf(points));
});

// ---- Reference screenshot of the plan (docs/api/walls.md) ----

// Named after the scenario: WALL-039.png.
Then('the plan matches its reference screenshot', async ({ appPage, $tags }) => {
  // Reference screenshots are taken in the light theme (docs/api/tool-bar.md).
  await appPage.emulateMedia({ colorScheme: 'light' });
  await expect(planView(appPage)).toHaveScreenshot(`${scenarioIdOf($tags)}.png`);
});
