import { describe, expect, it } from 'vitest';
import { targetTabIndex } from './tabs';

describe('targetTabIndex', () => {
  it('moves to the next and previous tabs, wrapping around', () => {
    expect(targetTabIndex('ArrowRight', 0, 3)).toBe(1);
    expect(targetTabIndex('ArrowRight', 2, 3)).toBe(0);
    expect(targetTabIndex('ArrowLeft', 1, 3)).toBe(0);
    expect(targetTabIndex('ArrowLeft', 0, 3)).toBe(2);
  });

  it('moves to the first and last tabs', () => {
    expect(targetTabIndex('Home', 2, 3)).toBe(0);
    expect(targetTabIndex('End', 0, 3)).toBe(2);
  });

  it('ignores other keys and empty tab lists', () => {
    expect(targetTabIndex('Enter', 1, 3)).toBeNull();
    expect(targetTabIndex('ArrowRight', 0, 0)).toBeNull();
  });
});
