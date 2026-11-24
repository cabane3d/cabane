import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { createFakePlatform } from '../../../packages/platform/src/index';
import { Given, Then } from '../../support/fixtures';
import { startScreen } from '../../support/locators';

const desktopManifest = resolve(import.meta.dirname, '../../../apps/desktop/package.json');

/** Version of the Electron application: the one declared by the desktop package. */
function desktopVersion(): string {
  // The repository's own manifest is trusted input.
  const manifest = JSON.parse(readFileSync(desktopManifest, 'utf8')) as { version: string };
  return manifest.version;
}

Given('the application is started', async ({ appPage }) => {
  await expect(appPage.locator('#root')).toBeAttached();
});

Then('the application name {string} is shown', async ({ appPage }, name: string) => {
  await expect(startScreen(appPage).getByRole('heading', { level: 1 })).toHaveText(name);
});

Then('the application version is shown', async ({ appPage }) => {
  // The version comes from platform.getAppInfo(): the fake platform on e2e, the desktop package on electron.
  const version =
    test.info().project.name === 'electron'
      ? desktopVersion()
      : (await createFakePlatform().getAppInfo()).version;
  await expect(startScreen(appPage).getByText(`Version ${version}`, { exact: true })).toBeVisible();
});
