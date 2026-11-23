// @vitest-environment jsdom
import { type Mm, mm } from '@cabane3d/core';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { ConfirmDialog } from './confirm-dialog';
import { NumericField } from './numeric-field';
import { TooltipProvider } from './tooltip';

afterEach(cleanup);

/**
 * A wall's length field wired to its deletion question, the way a Properties panel composes
 * NumericField and ConfirmDialog. The wall is local state here: the document has no walls yet.
 */
function WallLength() {
  const [length, setLength] = useState<Mm>(mm(3500));
  const [exists, setExists] = useState(true);
  const [confirming, setConfirming] = useState(false);
  if (!exists) return <p>No wall</p>;
  return (
    <TooltipProvider>
      <NumericField
        aria-label="Length"
        value={length}
        unit="mm"
        onCommit={setLength}
        onEmpty={() => setConfirming(true)}
        invalidMessage="Enter a length"
        nonPositiveMessage="Must be greater than 0"
      />
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title="Delete this wall?"
        confirmLabel="Delete"
        cancelLabel="Keep"
        closeLabel="Close"
        onConfirm={() => setExists(false)}
      />
    </TooltipProvider>
  );
}

async function emptyTheLength() {
  render(<WallLength />);
  const user = userEvent.setup();
  const input = screen.getByRole<HTMLInputElement>('textbox', { name: 'Length' });
  await user.clear(input);
  await user.type(input, '{Enter}');
  return { user, input };
}

describe('Emptying a length field', () => {
  it('@UI-005: asks whether to delete the wall and shows 3500 mm again', async () => {
    const { input } = await emptyTheLength();
    expect(screen.getByRole('dialog', { name: 'Delete this wall?' })).toBeTruthy();
    expect(input.value).toBe('3500');
  });

  it('@UI-006: Delete removes the wall', async () => {
    const { user } = await emptyTheLength();
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(screen.queryByRole('textbox', { name: 'Length' })).toBeNull();
    expect(screen.getByText('No wall')).toBeTruthy();
  });

  it('@UI-007: Keep leaves the wall and its 3500 mm length', async () => {
    const { user } = await emptyTheLength();
    await user.click(screen.getByRole('button', { name: 'Keep' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    const input = screen.getByRole<HTMLInputElement>('textbox', { name: 'Length' });
    expect(input.value).toBe('3500');
  });
});
