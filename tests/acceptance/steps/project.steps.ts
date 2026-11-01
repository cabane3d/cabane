import { expect } from '@playwright/test';
import { Then } from '../../support/fixtures';

// Names and roles follow docs/design/main-window.md (glossary).

Then('the project name {string} is shown in the Top bar', async ({ appPage }, name: string) => {
  await expect(appPage.getByRole('banner').getByText(name, { exact: true })).toBeVisible();
});

Then('the Level tabs contain only {string}', async ({ appPage }, name: string) => {
  const tabs = appPage.getByRole('tablist', { name: 'Level tabs' }).getByRole('tab');
  await expect(tabs).toHaveText([name]);
});

Then('{string} is the selected level', async ({ appPage }, name: string) => {
  await expect(appPage.getByRole('tab', { name, selected: true })).toBeVisible();
});
