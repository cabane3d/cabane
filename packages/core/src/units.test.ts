import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { LENGTH_TOLERANCE, lengthsEqual, mm, rad } from './units';

describe('mm', () => {
  it('accepts finite values', () => {
    expect(mm(3500)).toBe(3500);
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    'rejects %s',
    (value) => {
      expect(() => mm(value)).toThrow(RangeError);
    },
  );
});

describe('rad', () => {
  it('rejects non-finite values', () => {
    expect(() => rad(Number.NaN)).toThrow(RangeError);
  });
});

describe('lengthsEqual', () => {
  it('treats values within the tolerance as equal', () => {
    expect(lengthsEqual(mm(1000), mm(1000 + LENGTH_TOLERANCE / 2))).toBe(true);
  });

  it('treats values beyond the tolerance as different', () => {
    expect(lengthsEqual(mm(1000), mm(1000 + LENGTH_TOLERANCE * 2))).toBe(false);
  });

  it('is symmetric', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -1e7, max: 1e7, noNaN: true }),
        fc.double({ min: -1e7, max: 1e7, noNaN: true }),
        (a, b) => lengthsEqual(mm(a), mm(b)) === lengthsEqual(mm(b), mm(a)),
      ),
    );
  });
});
