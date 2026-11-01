import { expect } from '@playwright/test';
import { Given, Then } from '../../support/fixtures';

Given('the application is started', async ({ appPage }) => {
  await expect(appPage.locator('#root')).toBeAttached();
});

Then('the workspace is displayed', async ({ appPage }) => {
  await expect(appPage.getByRole('main', { name: 'Workspace' })).toBeVisible();
});

Then('the application name {string} is shown', async ({ appPage }, name: string) => {
  await expect(appPage.getByRole('heading', { level: 1 })).toHaveText(name);
});

Then('the application version is shown', async ({ appPage }) => {
  await expect(appPage.getByText(/^Version \d+\.\d+\.\d+/)).toBeVisible();
});
