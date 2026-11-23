// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConfirmDialog } from './confirm-dialog';
import { TooltipProvider } from './tooltip';

afterEach(cleanup);

function setup() {
  const onConfirm = vi.fn();
  const onOpenChange = vi.fn();
  render(
    <TooltipProvider>
      <ConfirmDialog
        open
        onOpenChange={onOpenChange}
        title="Delete this terrace?"
        confirmLabel="Delete"
        cancelLabel="Keep"
        closeLabel="Close"
        onConfirm={onConfirm}
      />
    </TooltipProvider>,
  );
  return { onConfirm, onOpenChange, user: userEvent.setup() };
}

describe('ConfirmDialog', () => {
  it('shows the question it receives and focuses the safe choice', () => {
    setup();
    expect(screen.getByRole('dialog', { name: 'Delete this terrace?' })).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Keep' }));
  });

  it('confirms with the action button, then closes', async () => {
    const { onConfirm, onOpenChange, user } = setup();
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('changes nothing when the user keeps the element', async () => {
    const { onConfirm, onOpenChange, user } = setup();
    await user.keyboard('{Enter}');
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
