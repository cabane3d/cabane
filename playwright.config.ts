import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

/**
 * Gherkin specs (specs/**\/*.feature) are compiled into Playwright tests by playwright-bdd.
 * Each project runs the scenarios carrying its level tag (ADR-0011, ADR-0013).
 */
function bddProject(tag: '@e2e' | '@electron' | '@visual') {
  return defineBddConfig({
    features: 'specs/**/*.feature',
    steps: ['tests/acceptance/steps/**/*.ts', 'tests/support/fixtures.ts'],
    tags: tag,
    outputDir: `.features-gen/${tag.slice(1)}`,
  });
}

const isCI = !!process.env.CI;

export default defineConfig({
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'e2e',
      testDir: bddProject('@e2e'),
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:5199' },
    },
    {
      name: 'visual',
      testDir: bddProject('@visual'),
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:5199' },
    },
    {
      name: 'electron',
      testDir: bddProject('@electron'),
    },
  ],
  webServer: {
    command: 'pnpm dev:web',
    url: 'http://localhost:5199',
    reuseExistingServer: !isCI,
    timeout: 60_000,
  },
});
