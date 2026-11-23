/**
 * Display boundary for lengths (ADR-0017, ADR-0021): parsing what the user types in a length
 * field, and formatting a model length for display. The model only ever sees millimeters.
 *
 * Accepted input: numbers with an optional unit (`3500`, `3.5 m`, `350cm`), a decimal point or
 * comma (`3,5 m`), and arithmetic with `+ - * /` and parentheses (`3500 + 200`, `4200 / 2`,
 * `(3 m - 20 cm) / 2`). A number without a unit is in the field's display unit, unless it is a
 * multiplier or a divisor (`2 * 1200`, `4200 / 2`).
 */
import { type Mm, mm } from './units';

export type LengthUnit = 'mm' | 'cm' | 'm';

const MM_PER_UNIT: Readonly<Record<LengthUnit, number>> = { mm: 1, cm: 10, m: 1000 };

/** Decimals shown per unit, so every unit displays lengths to 0.1 mm. */
const DISPLAY_DECIMALS: Readonly<Record<LengthUnit, number>> = { mm: 1, cm: 2, m: 4 };

export type LengthParseError =
  /** Nothing was typed. */
  | 'empty'
  /** Not a valid expression (`3500 +`, `3..5`, `abc`). */
  | 'syntax'
  /** A unit other than mm, cm or m. */
  | 'unknown-unit'
  /** The expression is not a length (`2 m * 3 m`, `4 m / 2 m`, `2 / 1 m`). */
  | 'not-a-length'
  | 'division-by-zero';

export type LengthParseResult =
  | { readonly ok: true; readonly value: Mm }
  | { readonly ok: false; readonly error: LengthParseError };

/** Longest input accepted, to keep parsing trivially cheap. */
const MAX_INPUT_LENGTH = 200;

const OPERATORS = ['+', '-', '*', '/', '(', ')'] as const;
type Operator = (typeof OPERATORS)[number];

function isOperator(text: string): text is Operator {
  return (OPERATORS as readonly string[]).includes(text);
}

type Token =
  | { readonly kind: 'number'; readonly value: number }
  | { readonly kind: 'unit'; readonly unit: string }
  | { readonly kind: 'op'; readonly op: Operator };

/** A partial result: a length in mm, or a bare number whose meaning depends on its use. */
type Value =
  | { readonly kind: 'length'; readonly mm: number }
  | { readonly kind: 'bare'; readonly n: number };

class ParseError extends Error {
  constructor(readonly code: LengthParseError) {
    super(code);
  }
}

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  const pattern = /\s+|(\d+(?:[.,]\d+)?|[.,]\d+)|([a-zA-Z]+)|([-+*/()])|(.)/gy;
  for (const match of input.matchAll(pattern)) {
    const [, number, unit, op, other] = match;
    if (number !== undefined)
      tokens.push({ kind: 'number', value: Number(number.replace(',', '.')) });
    else if (unit !== undefined) tokens.push({ kind: 'unit', unit: unit.toLowerCase() });
    else if (op !== undefined && isOperator(op)) tokens.push({ kind: 'op', op });
    else if (other !== undefined) throw new ParseError('syntax');
  }
  return tokens;
}

function isUnit(unit: string): unit is LengthUnit {
  return Object.hasOwn(MM_PER_UNIT, unit);
}

/** Recursive descent parser over the tokens, evaluating as it goes. */
function evaluate(tokens: readonly Token[], defaultUnit: LengthUnit): Value {
  let position = 0;
  const peek = (): Token | undefined => tokens[position];
  const isOp = (token: Token | undefined, op: string): boolean =>
    token?.kind === 'op' && token.op === op;

  const asLength = (value: Value): number =>
    value.kind === 'length' ? value.mm : value.n * MM_PER_UNIT[defaultUnit];

  function expression(): Value {
    let left = term();
    for (let token = peek(); isOp(token, '+') || isOp(token, '-'); token = peek()) {
      position++;
      const right = term();
      const sign = isOp(token, '+') ? 1 : -1;
      left =
        left.kind === 'bare' && right.kind === 'bare'
          ? { kind: 'bare', n: left.n + sign * right.n }
          : { kind: 'length', mm: asLength(left) + sign * asLength(right) };
    }
    return left;
  }

  function term(): Value {
    let left = factor();
    for (let token = peek(); isOp(token, '*') || isOp(token, '/'); token = peek()) {
      position++;
      const right = factor();
      if (isOp(token, '*')) {
        if (left.kind === 'length') {
          if (right.kind === 'length') throw new ParseError('not-a-length');
          left = { kind: 'length', mm: left.mm * right.n };
        } else {
          left =
            right.kind === 'length'
              ? { kind: 'length', mm: left.n * right.mm }
              : { kind: 'bare', n: left.n * right.n };
        }
      } else {
        if (right.kind === 'length') throw new ParseError('not-a-length');
        if (right.n === 0) throw new ParseError('division-by-zero');
        left =
          left.kind === 'length'
            ? { kind: 'length', mm: left.mm / right.n }
            : { kind: 'bare', n: left.n / right.n };
      }
    }
    return left;
  }

  function factor(): Value {
    const token = peek();
    if (isOp(token, '-') || isOp(token, '+')) {
      position++;
      const value = factor();
      if (isOp(token, '+')) return value;
      return value.kind === 'length'
        ? { kind: 'length', mm: -value.mm }
        : { kind: 'bare', n: -value.n };
    }
    if (isOp(token, '(')) {
      position++;
      const value = expression();
      if (!isOp(peek(), ')')) throw new ParseError('syntax');
      position++;
      return value;
    }
    if (token?.kind === 'number') {
      position++;
      const next = peek();
      if (next?.kind !== 'unit') return { kind: 'bare', n: token.value };
      position++;
      if (!isUnit(next.unit)) throw new ParseError('unknown-unit');
      return { kind: 'length', mm: token.value * MM_PER_UNIT[next.unit] };
    }
    throw new ParseError('syntax');
  }

  const result = expression();
  if (position !== tokens.length) throw new ParseError('syntax');
  return result.kind === 'length' ? result : { kind: 'length', mm: asLength(result) };
}

/**
 * Parses a length typed by the user. `defaultUnit` is the field's display unit, used for
 * numbers typed without a unit.
 */
export function parseLength(input: string, defaultUnit: LengthUnit = 'mm'): LengthParseResult {
  const trimmed = input.trim();
  if (trimmed === '') return { ok: false, error: 'empty' };
  if (trimmed.length > MAX_INPUT_LENGTH) return { ok: false, error: 'syntax' };
  try {
    const result = evaluate(tokenize(trimmed), defaultUnit);
    const value = result.kind === 'length' ? result.mm : Number.NaN;
    if (!Number.isFinite(value)) return { ok: false, error: 'syntax' };
    return { ok: true, value: mm(value + 0) };
  } catch (error) {
    if (error instanceof ParseError) return { ok: false, error: error.code };
    throw error;
  }
}

/**
 * Formats a model length in a display unit, without the unit symbol (fields show it apart):
 * `formatLength(mm(3500), 'm')` is `"3.5"`. Precision is 0.1 mm in every unit, trailing zeros
 * are dropped, and the decimal separator is a point.
 */
export function formatLength(value: Mm, unit: LengthUnit): string {
  const decimals = DISPLAY_DECIMALS[unit];
  const rounded = Number((value / MM_PER_UNIT[unit]).toFixed(decimals));
  // `+ 0` turns -0 into 0, so a tiny negative value never displays as "-0".
  return String(rounded + 0);
}
