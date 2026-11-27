// @vitest-environment jsdom
import { type Mm, mm } from '@cabane3d/core';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NumericField } from './numeric-field';

afterEach(cleanup);

function setup() {
  const onCommit = vi.fn<(value: Mm) => void>();
  render(
    <NumericField
      aria-label="Length"
      value={mm(3500)}
      unit="mm"
      onCommit={onCommit}
      invalidMessage="Enter a length"
    />,
  );
  return { input: screen.getByRole<HTMLInputElement>('textbox', { name: 'Length' }), onCommit };
}

// An Enter that confirms an IME conversion must not commit the field (ADR-0024 audit, IME rule).
describe('NumericField with an input method editor', () => {
  it('does not commit on the Enter that confirms a composition', () => {
    const { input, onCommit } = setup();
    fireEvent.change(input, { target: { value: '4200' } });
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true });
    expect(onCommit).not.toHaveBeenCalled();
    expect(input.value).toBe('4200');
  });

  it('does not commit on an Enter reported as keyCode 229', () => {
    const { input, onCommit } = setup();
    fireEvent.change(input, { target: { value: '4200' } });
    fireEvent.keyDown(input, { key: 'Enter', keyCode: 229 });
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('commits on a plain Enter', () => {
    const { input, onCommit } = setup();
    fireEvent.change(input, { target: { value: '4200' } });
    fireEvent.keyDown(input, { key: 'Enter', keyCode: 13 });
    expect(onCommit).toHaveBeenCalledWith(mm(4200));
  });
});
