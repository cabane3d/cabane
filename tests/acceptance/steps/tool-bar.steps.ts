import { expect } from '@playwright/test';
import { Given, Then, When } from '../../support/fixtures';
import { mainWindow, selectTool, startScreen, toolBar } from '../../support/locators';

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

Then('the Tool bar contains only the Select tool', async ({ appPage }) => {
  const buttons = toolBar(appPage).getByRole('button');
  await expect(buttons).toHaveCount(1);
  await expect(buttons).toHaveAccessibleName('Select tool');
});

Then('the Select tool is active', async ({ appPage }) => {
  await expect(selectTool(appPage)).toHaveAttribute('aria-pressed', 'true');
});

Then('the Select tool is announced as pressed', async ({ appPage }) => {
  await expect(selectTool(appPage)).toHaveAttribute('aria-pressed', 'true');
});

Then('the focus is on the Select tool', async ({ appPage }) => {
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

Then('the Tool bar matches its reference screenshot', async ({ appPage }) => {
  // Reference screenshots are taken in the light theme (docs/api/tool-bar.md).
  await appPage.emulateMedia({ colorScheme: 'light' });
  await expect(toolBar(appPage)).toHaveScreenshot('TOOL-012.png');
});
