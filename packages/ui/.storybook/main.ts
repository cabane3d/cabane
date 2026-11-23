import type { StorybookConfig } from '@storybook/react-vite';

/** Storybook, the component catalog (ADR-0021, docs/design/components.md). */
const config: StorybookConfig = {
  stories: ['../src/**/*.stories.tsx'],
  addons: ['@storybook/addon-a11y', '@storybook/addon-themes'],
  framework: { name: '@storybook/react-vite', options: {} },
  // Cabane makes no network calls (ADR-0002): no telemetry, no "what's new" fetches.
  core: { disableTelemetry: true, disableWhatsNewNotifications: true },
};

export default config;
