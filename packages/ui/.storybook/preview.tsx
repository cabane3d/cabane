import { withThemeByDataAttribute } from '@storybook/addon-themes';
import type { Preview } from '@storybook/react-vite';
import { TooltipProvider } from '../src/components/tooltip';
import './storybook.css';

const preview: Preview = {
  parameters: {
    layout: 'padded',
    // The page background comes from the theme tokens, not from Storybook.
    backgrounds: { disable: true },
    a11y: { test: 'error' },
  },
  decorators: [
    // The toolbar's theme switch sets `data-theme` on <html>, like the app does (ADR-0019).
    withThemeByDataAttribute({
      themes: { light: 'light', dark: 'dark' },
      defaultTheme: 'light',
      attributeName: 'data-theme',
    }),
    (Story) => (
      <TooltipProvider>
        <Story />
      </TooltipProvider>
    ),
  ],
};

export default preview;
