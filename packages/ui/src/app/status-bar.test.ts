// @vitest-environment jsdom
import { mm } from '@cabane3d/core';
import { describe, expect, it } from 'vitest';
import { formatCursor, showCursor } from './status-bar';

describe('formatCursor', () => {
  it('rounds the plan coordinates to whole millimeters', () => {
    expect(formatCursor({ x: mm(1249.6), y: mm(830.4) })).toBe('x 1250 mm · y 830 mm');
  });

  it('shows a coordinate rounded from just below zero as 0', () => {
    expect(formatCursor({ x: mm(-0.2), y: mm(-1500.2) })).toBe('x 0 mm · y -1500 mm');
  });
});

describe('showCursor', () => {
  it('writes the coordinates, then hides them when the cursor leaves', () => {
    const element = document.createElement('span');

    showCursor(element, { x: mm(10), y: mm(20) });
    expect(element.hidden).toBe(false);
    expect(element.textContent).toBe('x 10 mm · y 20 mm');

    showCursor(element, null);
    expect(element.hidden).toBe(true);
    expect(element.textContent).toBe('');
  });
});
