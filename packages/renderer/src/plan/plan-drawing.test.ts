import { mm } from '@cabane3d/core';
import { describe, expect, it } from 'vitest';
import { liveLengthLabel } from './plan-drawing';

describe('liveLengthLabel', () => {
  it.each([
    [3500, '3500 mm'],
    [2000, '2000 mm'],
    [0, '0 mm'],
  ])('shows %d mm with its unit', (length, expected) => {
    expect(liveLengthLabel(mm(length))).toBe(expected);
  });

  it('rounds the value to the millimeter', () => {
    expect(liveLengthLabel(mm(2034.4))).toBe('2034 mm');
    expect(liveLengthLabel(mm(2034.6))).toBe('2035 mm');
    expect(liveLengthLabel(mm(0.3))).toBe('0 mm');
  });
});
