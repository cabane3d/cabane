// @vitest-environment jsdom
import { type Mm, mm } from '@cabane3d/core';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NumericField } from './numeric-field';

afterEach(cleanup);

function setup(
  props: {
    value?: number;
    unit?: 'mm' | 'cm' | 'm';
    min?: number;
    max?: number;
    onEmpty?: () => void;
  } = {},
) {
  const onCommit = vi.fn<(value: Mm) => void>();
  render(
    <NumericField
      aria-label="Length"
      value={mm(props.value ?? 3500)}
      unit={props.unit ?? 'mm'}
      min={props.min === undefined ? undefined : mm(props.min)}
      max={props.max === undefined ? undefined : mm(props.max)}
      onCommit={onCommit}
      invalidMessage="Enter a length"
      outOfRangeMessage="Out of range"
      nonPositiveMessage="Must be greater than 0"
      {...(props.onEmpty ? { onEmpty: props.onEmpty } : {})}
    />,
  );
  const input = screen.getByRole<HTMLInputElement>('textbox', { name: 'Length' });
  return { input, onCommit, user: userEvent.setup() };
}

describe('NumericField', () => {
  it('shows the value in the display unit, with the unit', () => {
    setup({ value: 3500, unit: 'm' });
    const input = screen.getByRole<HTMLInputElement>('textbox', { name: 'Length' });
    expect(input.value).toBe('3.5');
    const unit = screen.getByText('m');
    expect(input.getAttribute('aria-describedby')).toBe(unit.id);
  });

  it('commits an expression with units on Enter, in millimeters', async () => {
    const { input, onCommit, user } = setup();
    await user.clear(input);
    await user.type(input, '3 m + 20 cm{Enter}');
    expect(onCommit).toHaveBeenCalledOnce();
    expect(onCommit.mock.calls[0]?.[0]).toBeCloseTo(3200, 9);
  });

  it('commits when the field loses focus', async () => {
    const { input, onCommit, user } = setup();
    await user.clear(input);
    await user.type(input, '4200 / 2');
    await user.tab();
    expect(onCommit.mock.calls[0]?.[0]).toBeCloseTo(2100, 9);
  });

  it('does not commit an unchanged value', async () => {
    const { input, onCommit, user } = setup();
    await user.clear(input);
    await user.type(input, '3.5 m{Enter}');
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('keeps an invalid entry, marks it invalid and commits nothing', async () => {
    const { input, onCommit, user } = setup();
    await user.clear(input);
    await user.type(input, '3500 +{Enter}');
    expect(onCommit).not.toHaveBeenCalled();
    expect(input.value).toBe('3500 +');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    const message = screen.getByText('Enter a length');
    expect(input.getAttribute('aria-describedby')).toContain(message.id);
  });

  it('rejects a value outside min and max', async () => {
    const { input, onCommit, user } = setup({ min: 10, max: 10_000 });
    await user.clear(input);
    await user.type(input, '20 m{Enter}');
    expect(onCommit).not.toHaveBeenCalled();
    expect(screen.getByText('Out of range')).toBeTruthy();
  });

  it('accepts the bounds themselves', async () => {
    const { input, onCommit, user } = setup({ min: 10, max: 10_000 });
    await user.clear(input);
    await user.type(input, '10 m{Enter}');
    expect(onCommit.mock.calls[0]?.[0]).toBeCloseTo(10_000, 9);
  });

  it.each(['0', '-200', '3500 - 4000', '0.001'])(
    'refuses %s: a length is never zero or negative',
    async (entry) => {
      const { input, onCommit, user } = setup();
      await user.clear(input);
      await user.type(input, `${entry}{Enter}`);
      expect(onCommit).not.toHaveBeenCalled();
      expect(input.value).toBe(entry);
      expect(input.getAttribute('aria-invalid')).toBe('true');
      expect(screen.getByText('Must be greater than 0')).toBeTruthy();
    },
  );

  it('calls onEmpty and shows the current value again when an emptied field is committed', async () => {
    const onEmpty = vi.fn();
    const { input, onCommit, user } = setup({ onEmpty });
    await user.clear(input);
    await user.type(input, '{Enter}');
    expect(onEmpty).toHaveBeenCalledOnce();
    expect(onCommit).not.toHaveBeenCalled();
    expect(input.value).toBe('3500');
    expect(input.getAttribute('aria-invalid')).toBe('false');
  });

  it('marks an emptied field invalid when there is no onEmpty', async () => {
    const { input, onCommit, user } = setup();
    await user.clear(input);
    await user.tab();
    expect(onCommit).not.toHaveBeenCalled();
    expect(input.getAttribute('aria-invalid')).toBe('true');
  });

  it('restores the current value on Escape', async () => {
    const { input, onCommit, user } = setup();
    await user.clear(input);
    await user.type(input, 'abc{Enter}{Escape}');
    expect(input.value).toBe('3500');
    expect(input.getAttribute('aria-invalid')).toBe('false');
    expect(screen.queryByText('Enter a length')).toBeNull();
    expect(onCommit).not.toHaveBeenCalled();
  });
});
