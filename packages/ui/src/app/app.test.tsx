// @vitest-environment jsdom
import { createFakePlatform } from '@cabane3d/platform';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { App } from './app';

afterEach(cleanup);

describe('App', () => {
  it('opens on the Start screen with the platform version', async () => {
    render(<App platform={createFakePlatform({ name: 'Cabane', version: '1.2.3' })} />);

    const start = screen.getByRole('main', { name: 'Start screen' });
    expect(await screen.findByText('Version 1.2.3')).toBeTruthy();
    expect(start.querySelector('h1')?.textContent).toBe('Cabane');
    expect(screen.queryByRole('main', { name: 'Main window' })).toBeNull();
  });

  it('shows a new project in the Main window when New project is chosen', async () => {
    render(<App platform={createFakePlatform()} />);

    await userEvent.click(screen.getByRole('button', { name: 'New project' }));

    expect(screen.getByRole('main', { name: 'Main window' })).toBeTruthy();
    expect(screen.queryByRole('main', { name: 'Start screen' })).toBeNull();
    expect(screen.getByRole('banner', { name: 'Top bar' }).textContent).toBe('Untitled');
    const tabs = screen.getAllByRole('tab');
    expect(tabs.map((tab) => tab.textContent)).toEqual(['Level 0']);
    expect(tabs[0]?.getAttribute('aria-selected')).toBe('true');
  });
});
