import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const theme = readFileSync(new URL('../../packages/ui/src/theme.css', import.meta.url), 'utf8');
const indexHtml = readFileSync(
  new URL('../../apps/desktop/src/renderer/index.html', import.meta.url),
  'utf8',
);

/** The `@theme inline` block: the scales that components consume. */
const themeBlock = theme.slice(theme.indexOf('@theme inline'), theme.indexOf('@layer base'));

describe('theme scales (ADR-0023)', () => {
  it('expresses spacing, named sizes and text sizes in rem', () => {
    const scaleLines = themeBlock
      .split('\n')
      .filter((line) => /^\s*--(spacing-[\w.\\]+|text-[\w-]+):/.test(line))
      .filter((line) => !/initial|spacing-0:/.test(line));
    expect(scaleLines.length).toBeGreaterThan(20);
    for (const line of scaleLines) expect(line, line).toMatch(/rem;/);
  });

  it('never sets a font size on the root, so the OS text scale applies', () => {
    expect(theme).not.toMatch(/(?:^|\s)(?:html|:root)\s*\{[^}]*font-size/);
  });

  it('opts the renderer into the OS text scale', () => {
    expect(indexHtml).toMatch(/<meta name="text-scale" content="scale"\s*\/>/);
  });
});

describe('contrast preferences and forced colors (ADR-0024)', () => {
  it('overrides the separating tokens under prefers-contrast: more', () => {
    const block = theme.slice(theme.indexOf('prefers-contrast: more'));
    for (const token of ['--border', '--input', '--muted-foreground', '--popover-border']) {
      expect(block).toContain(token);
    }
  });

  it('applies the dark contrast values only to the dark theme', () => {
    const lightAndForcedDark = theme.slice(
      theme.indexOf('@media (prefers-contrast: more) {'),
      theme.indexOf('@media (prefers-contrast: more) and (prefers-color-scheme: dark)'),
    );
    // No selector that matches a light system without `data-theme`.
    expect(lightAndForcedDark).not.toContain(':not([data-theme="light"])');
    const systemDark = theme.slice(
      theme.indexOf('@media (prefers-contrast: more) and (prefers-color-scheme: dark)'),
    );
    expect(systemDark.slice(0, 200)).toContain(':root:not([data-theme="light"])');
  });

  it('keeps the focus ring visible on a selected control in forced colors', () => {
    const block = theme.slice(theme.indexOf('forced-colors: active'));
    expect(block).toContain('):focus-visible');
    expect(block).toContain('outline: 4px double Highlight');
  });

  it('outlines on/selected states in forced colors', () => {
    const block = theme.slice(theme.indexOf('forced-colors: active'));
    expect(block).toContain('[aria-pressed="true"]');
    expect(block).toContain('outline: 2px solid Highlight');
  });

  it('keeps the no-motion reset', () => {
    expect(theme).toContain('transition: none !important');
    expect(theme).toContain('animation: none !important');
  });
});
