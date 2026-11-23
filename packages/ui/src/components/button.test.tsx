// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { cn } from '../lib/cn';
import { Button } from './button';
import { IconButton } from './icon-button';
import { TooltipProvider } from './tooltip';

afterEach(cleanup);

describe('Button', () => {
  it('does not submit forms unless asked to', () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' }).getAttribute('type')).toBe('button');
  });

  it('keeps an explicit type', () => {
    render(<Button type="submit">Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' }).getAttribute('type')).toBe('submit');
  });
});

describe('IconButton', () => {
  it('names the button with its label and shortcut', () => {
    render(
      <TooltipProvider>
        <IconButton label="Undo" shortcut="Ctrl+Z" icon={<svg />} />
      </TooltipProvider>,
    );
    const button = screen.getByRole('button', { name: 'Undo' });
    expect(button.getAttribute('aria-keyshortcuts')).toBe('Ctrl+Z');
  });
});

describe('cn', () => {
  it('lets a later named size override an earlier one', () => {
    expect(cn('h-control w-full', 'h-control-sm')).toBe('w-full h-control-sm');
  });

  it('keeps a text size and a text color together', () => {
    expect(cn('text-base text-foreground', 'text-accent-text')).toBe('text-base text-accent-text');
  });
});
