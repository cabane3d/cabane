// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { ToolButton, Toolbar } from './toolbar';
import { TooltipProvider } from './tooltip';

afterEach(cleanup);

function Tools() {
  const [active, setActive] = useState('select');
  return (
    <TooltipProvider>
      <Toolbar aria-label="Tool bar">
        {['Select tool', 'Wall tool'].map((label) => (
          <ToolButton
            key={label}
            label={label}
            shortcut={label === 'Wall tool' ? 'W' : undefined}
            icon={<svg />}
            active={active === label.split(' ')[0]?.toLowerCase()}
            onClick={() => setActive(label.split(' ')[0]?.toLowerCase() ?? '')}
          />
        ))}
      </Toolbar>
    </TooltipProvider>
  );
}

describe('ToolButton', () => {
  it('exposes tools as buttons in a named toolbar, the active one pressed', () => {
    render(<Tools />);
    expect(screen.getByRole('toolbar', { name: 'Tool bar' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Select tool' }).getAttribute('aria-pressed')).toBe(
      'true',
    );
    const wall = screen.getByRole('button', { name: 'Wall tool' });
    expect(wall.getAttribute('aria-pressed')).toBe('false');
    expect(wall.getAttribute('aria-keyshortcuts')).toBe('W');
  });

  it('moves the active state to the clicked tool', async () => {
    render(<Tools />);
    await userEvent.setup().click(screen.getByRole('button', { name: 'Wall tool' }));
    expect(screen.getByRole('button', { name: 'Wall tool' }).getAttribute('aria-pressed')).toBe(
      'true',
    );
    expect(screen.getByRole('button', { name: 'Select tool' }).getAttribute('aria-pressed')).toBe(
      'false',
    );
  });
});
