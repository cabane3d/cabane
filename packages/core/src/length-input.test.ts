import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { formatLength, type LengthUnit, parseLength } from './length-input';
import { lengthsEqual, mm } from './units';

function lengthOf(input: string, unit: LengthUnit = 'mm'): number {
  const result = parseLength(input, unit);
  if (!result.ok) throw new Error(`"${input}" did not parse: ${result.error}`);
  return result.value;
}

function errorOf(input: string, unit: LengthUnit = 'mm'): string {
  const result = parseLength(input, unit);
  if (result.ok) throw new Error(`"${input}" parsed as ${result.value}`);
  return result.error;
}

describe('parseLength', () => {
  it.each([
    ['3500', 'mm', 3500],
    ['3500 mm', 'mm', 3500],
    ['350 cm', 'mm', 3500],
    ['350cm', 'mm', 3500],
    ['3.5 m', 'mm', 3500],
    ['3,5 m', 'mm', 3500],
    ['3.5 M', 'mm', 3500],
    ['.5 m', 'mm', 500],
    ['  12.5  ', 'mm', 12.5],
    ['3.5', 'm', 3500],
    ['350', 'cm', 3500],
    ['-200', 'mm', -200],
  ] as const)('reads %j in %s as %d mm', (input, unit, expected) => {
    expect(lengthOf(input, unit)).toBeCloseTo(expected, 9);
  });

  it.each([
    ['3500 + 200', 3700],
    ['3500 - 200', 3300],
    ['4200 / 2', 2100],
    ['2 * 1200', 2400],
    ['1200 * 2', 2400],
    ['3 m + 20 cm', 3200],
    ['3 m + 200', 3200],
    ['(3 m - 20 cm) / 2', 1400],
    ['2 * (1 m + 50)', 2100],
    ['-(1 m)', -1000],
    ['1 m * -2', -2000],
    ['1000 + 2 * 3', 1006],
  ] as const)('evaluates %j as %d mm', (input, expected) => {
    expect(lengthOf(input)).toBeCloseTo(expected, 9);
  });

  it('reads numbers without a unit in the display unit when added to a length', () => {
    expect(lengthOf('1 + 50 cm', 'm')).toBeCloseTo(1500, 9);
  });

  it.each([
    ['', 'empty'],
    ['   ', 'empty'],
    ['3500 +', 'syntax'],
    ['3..5', 'syntax'],
    ['(3500', 'syntax'],
    ['3500)', 'syntax'],
    ['abc', 'syntax'],
    ['3 m 20 cm', 'syntax'],
    ['3500 = 2', 'syntax'],
    ['3 ft', 'unknown-unit'],
    ['2 m * 3 m', 'not-a-length'],
    ['4 m / 2 m', 'not-a-length'],
    ['2 / 1 m', 'not-a-length'],
    ['3500 / 0', 'division-by-zero'],
    ['3500 / (1 - 1)', 'division-by-zero'],
    ['1'.repeat(201), 'syntax'],
  ] as const)('rejects %j with %s', (input, error) => {
    expect(errorOf(input)).toBe(error);
  });
});

describe('formatLength', () => {
  it.each([
    [3500, 'mm', '3500'],
    [3500, 'cm', '350'],
    [3500, 'm', '3.5'],
    [1234.56, 'mm', '1234.6'],
    [1234.56, 'm', '1.2346'],
    [0.01, 'mm', '0'],
    [-0.01, 'mm', '0'],
    [-200, 'cm', '-20'],
  ] as const)('formats %d mm in %s as %j', (value, unit, expected) => {
    expect(formatLength(mm(value), unit)).toBe(expected);
  });

  it('round-trips through parseLength to 0.1 mm in every unit', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -1e7, max: 1e7, noNaN: true }),
        fc.constantFrom<LengthUnit>('mm', 'cm', 'm'),
        (value, unit) => {
          const parsed = parseLength(formatLength(mm(value), unit), unit);
          expect(parsed.ok).toBe(true);
          if (parsed.ok) expect(lengthsEqual(parsed.value, mm(value), mm(0.05))).toBe(true);
        },
      ),
    );
  });

  it('never throws, whatever the input', () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 60 }), (input) => {
        parseLength(input);
      }),
    );
  });
});
