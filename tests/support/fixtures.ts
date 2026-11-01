import { resolve } from 'node:path';
import { _electron as electron, type Page } from '@playwright/test';
import { test as base, createBdd } from 'playwright-bdd';

const desktopMain = resolve(import.meta.dirname, '../../apps/desktop/out/main/index.js');

interface Fixtures {
  /**
   * The application window, whatever the project:
   * - `e2e` / `visual`: the browser-only renderer on the fake platform (ADR-0010);
   * - `electron`: the built desktop app (`pnpm --filter @cabane3d/desktop build` first).
   * Step definitions use this fixture instead of `page`, so one scenario can run at several levels.
   */
  appPage: Page;
}

export const test = base.extend<Fixtures>({
  appPage: async ({ page }, use, testInfo) => {
    if (testInfo.project.name !== 'electron') {
      await page.goto('/');
      await use(page);
      return;
    }
    const app = await electron.launch({ args: [desktopMain] });
    try {
      await use(await app.firstWindow());
    } finally {
      await app.close();
    }
  },
});

export const { Given, When, Then } = createBdd(test);
