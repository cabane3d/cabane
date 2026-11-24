import { expect } from '@playwright/test';
import { Then, When } from '../../support/fixtures';
import { levelTabs, mainWindow, startScreen, topBar } from '../../support/locators';

Then('the Start screen is displayed', async ({ appPage }) => {
  await expect(startScreen(appPage)).toBeVisible();
});

Then('the New project button is shown', async ({ appPage }) => {
  await expect(
    startScreen(appPage).getByRole('button', { name: 'New project', exact: true }),
  ).toBeVisible();
});

When('the user chooses New project', async ({ appPage }) => {
  await startScreen(appPage).getByRole('button', { name: 'New project', exact: true }).click();
});

Then('the Main window is displayed', async ({ appPage }) => {
  await expect(mainWindow(appPage)).toBeVisible();
  await expect(startScreen(appPage)).toBeHidden();
});

Then('the Project name {string} is shown in the Top bar', async ({ appPage }, name: string) => {
  await expect(topBar(appPage).getByText(name, { exact: true })).toBeVisible();
});

Then('the Level tabs contain only {string}', async ({ appPage }, name: string) => {
  const tabs = levelTabs(appPage).getByRole('tab');
  await expect(tabs).toHaveCount(1);
  await expect(tabs).toHaveAccessibleName(name);
});

Then('{string} is the selected level', async ({ appPage }, name: string) => {
  await expect(levelTabs(appPage).getByRole('tab', { name, exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );
});
