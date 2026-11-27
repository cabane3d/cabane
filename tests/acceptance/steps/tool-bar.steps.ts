import { expect } from '@playwright/test';
import { Given, Then, When } from '../../support/fixtures';
import { mainWindow, selectTool, startScreen, toolBar, wallTool } from '../../support/locators';
import { isGivenStep, scenarioIdOf } from '../../support/scenario';

/** Upper bound of Tab presses before the focus must have entered the Tool bar (docs/api/tool-bar.md). */
const MAX_TAB_PRESSES = 20;

Given('a new project is open in the Main window', async ({ appPage }) => {
  await startScreen(appPage).getByRole('button', { name: 'New project', exact: true }).click();
  await expect(mainWindow(appPage)).toBeVisible();
});

When('the user chooses the Select tool', async ({ appPage }) => {
  await selectTool(appPage).click();
});

When('the user presses V', async ({ appPage }) => {
  await appPage.keyboard.press('v');
});

When('the user hovers the Select tool', async ({ appPage }) => {
  await selectTool(appPage).hover();
});

When('the user presses Tab until the focus enters the Tool bar', async ({ appPage }) => {
  const toolbar = toolBar(appPage);
  for (let press = 0; press < MAX_TAB_PRESSES; press++) {
    if ((await toolbar.locator(':focus').count()) > 0) return;
    await appPage.keyboard.press('Tab');
  }
  await expect(toolbar.locator(':focus')).toHaveCount(1);
});

Then('the Tool bar is displayed in the Plan view', async ({ appPage }) => {
  await expect(toolBar(appPage)).toBeVisible();
});

Then('the Tool bar starts with the Select tool', async ({ appPage }) => {
  await expect(toolBar(appPage).getByRole('button').first()).toHaveAccessibleName('Select tool');
});

Then('the Select tool is active', async ({ appPage }) => {
  await expect(selectTool(appPage)).toHaveAttribute('aria-pressed', 'true');
});

Then('the Select tool is announced as pressed', async ({ appPage }) => {
  await expect(selectTool(appPage)).toHaveAttribute('aria-pressed', 'true');
});

// Written as a Given (draw-wall: "the focus is on the Select tool"), the step focuses the button
// first. Written as a Then, it only checks the focus.
Then('the focus is on the Select tool', async ({ appPage, $bddContext }) => {
  if (isGivenStep($bddContext)) await selectTool(appPage).focus();
  await expect(selectTool(appPage)).toBeFocused();
});

Then(
  'a tooltip shows {string} and the shortcut {string}',
  async ({ appPage }, label: string, shortcut: string) => {
    const tooltip = appPage.getByRole('tooltip');
    await expect(tooltip).toContainText(label);
    await expect(tooltip.locator('kbd')).toHaveText(shortcut);
  },
);

// The screenshot is named after the scenario: TOOL-012.png, or WALL-021.png for draw-wall.
Then('the Tool bar matches its reference screenshot', async ({ appPage, $tags }) => {
  // Reference screenshots are taken in the light theme (docs/api/tool-bar.md).
  await appPage.emulateMedia({ colorScheme: 'light' });
  await expect(toolBar(appPage)).toHaveScreenshot(`${scenarioIdOf($tags)}.png`);
});

Then(
  'the Tool bar contains the Select tool and the Wall tool, in this order',
  async ({ appPage }) => {
    const buttons = toolBar(appPage).getByRole('button');
    await expect(buttons).toHaveCount(2);
    await expect(buttons.nth(0)).toHaveAccessibleName('Select tool');
    await expect(buttons.nth(1)).toHaveAccessibleName('Wall tool');
  },
);

When('the user chooses the Wall tool', async ({ appPage }) => {
  await wallTool(appPage).click();
});

When('the user hovers the Wall tool', async ({ appPage }) => {
  await wallTool(appPage).hover();
});

When('the user presses W', async ({ appPage }) => {
  await appPage.keyboard.press('w');
});

When('the user presses the Down arrow', async ({ appPage }) => {
  await appPage.keyboard.press('ArrowDown');
});

// One definition for the Given and the Then wordings: a Given (the precondition of a scenario)
// chooses the Wall tool, a Then only checks that it is active.
Then('the Wall tool is active', async ({ appPage, $bddContext }) => {
  if (isGivenStep($bddContext)) await wallTool(appPage).click();
  await expect(wallTool(appPage)).toHaveAttribute('aria-pressed', 'true');
});

Then('the Wall tool is active and announced as pressed', async ({ appPage }) => {
  await expect(wallTool(appPage)).toHaveAttribute('aria-pressed', 'true');
});

Then('the Wall tool is still active', async ({ appPage }) => {
  await expect(wallTool(appPage)).toHaveAttribute('aria-pressed', 'true');
});

Then('the Wall tool is not active', async ({ appPage }) => {
  await expect(wallTool(appPage)).toHaveAttribute('aria-pressed', 'false');
});

Then('the Select tool is not active and announced as not pressed', async ({ appPage }) => {
  await expect(selectTool(appPage)).toHaveAttribute('aria-pressed', 'false');
});

Then('the Select tool is still active', async ({ appPage }) => {
  await expect(selectTool(appPage)).toHaveAttribute('aria-pressed', 'true');
});

Then('the focus is on the Wall tool', async ({ appPage }) => {
  await expect(wallTool(appPage)).toBeFocused();
});
