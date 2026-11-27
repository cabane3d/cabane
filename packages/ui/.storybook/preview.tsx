import { withThemeByDataAttribute } from '@storybook/addon-themes';
import type { Preview } from '@storybook/react-vite';
import { useEffect } from 'react';
import { TooltipProvider } from '../src/components/tooltip';
import './storybook.css';

/** Root font size, in percent, of each "Text scale" toolbar item (ADR-0023). */
const TEXT_SCALES: Readonly<Record<string, number>> = { '100': 100, '150': 150, '200': 200 };

const preview: Preview = {
  globalTypes: {
    textScale: {
      description: 'Operating system text scale (root font size)',
      toolbar: {
        title: 'Text scale',
        icon: 'zoom',
        dynamicTitle: true,
        items: [
          { value: '100', title: 'Text 100%' },
          { value: '150', title: 'Text 150%' },
          { value: '200', title: 'Text 200%' },
        ],
      },
    },
  },
  initialGlobals: { textScale: '100' },
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
    // Scales the root font size, which is what the OS text scale does to `rem` (ADR-0023).
    (Story, context) => {
      const percent = TEXT_SCALES[String(context.globals.textScale)] ?? 100;
      useEffect(() => {
        const root = document.documentElement;
        root.style.fontSize = percent === 100 ? '' : `${percent}%`;
        return () => {
          root.style.fontSize = '';
        };
      }, [percent]);
      return <Story />;
    },
    (Story) => (
      <TooltipProvider>
        <Story />
      </TooltipProvider>
    ),
  ],
};

export default preview;
