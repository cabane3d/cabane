/**
 * Units of the document model (ADR-0017).
 *
 * Lengths are millimeters, stored as plain numbers but branded so the compiler
 * rejects accidental mixing with other numbers (meters, pixels, centimeters…).
 * Angles are radians.
 */

declare const mmBrand: unique symbol;
declare const radBrand: unique symbol;

/** A length in millimeters. */
export type Mm = number & { readonly [mmBrand]: true };

/** An angle in radians. */
export type Rad = number & { readonly [radBrand]: true };

/** Tolerance used for every geometric length comparison, in millimeters. */
export const LENGTH_TOLERANCE = 0.01 as Mm;

export function mm(value: number): Mm {
  if (!Number.isFinite(value)) {
    throw new RangeError(`Invalid length: ${value}`);
  }
  return value as Mm;
}

export function rad(value: number): Rad {
  if (!Number.isFinite(value)) {
    throw new RangeError(`Invalid angle: ${value}`);
  }
  return value as Rad;
}

/** Compares two lengths within {@link LENGTH_TOLERANCE}. Never compare lengths with `===`. */
export function lengthsEqual(a: Mm, b: Mm, tolerance: Mm = LENGTH_TOLERANCE): boolean {
  return Math.abs(a - b) <= tolerance;
}
