import {
  formatLength,
  type LengthUnit,
  lengthsEqual,
  type Mm,
  mm,
  parseLength,
} from '@cabane3d/core';
import { type ComponentProps, type KeyboardEvent, useId, useState } from 'react';
import { cn } from '../lib/cn';
import { FieldError, fieldBoxClassName } from './input';

export interface NumericFieldProps
  extends Omit<
    ComponentProps<'input'>,
    'value' | 'defaultValue' | 'onChange' | 'type' | 'min' | 'max'
  > {
  /** Current length, from the model. */
  readonly value: Mm;
  /** Display unit: the value is shown in it and numbers typed without a unit are read in it. */
  readonly unit: LengthUnit;
  /** Called with the new length when the user commits a valid entry that changes the value. */
  readonly onCommit: (value: Mm) => void;
  readonly min?: Mm;
  readonly max?: Mm;
  /** Message shown when the entry cannot be read as a length. */
  readonly invalidMessage: string;
  /** Message shown when the entry is outside `min`..`max`; defaults to `invalidMessage`. */
  readonly outOfRangeMessage?: string;
  /** Message shown when the entry is zero or negative; defaults to `invalidMessage`. */
  readonly nonPositiveMessage?: string;
  /**
   * Called when the user commits an empty field. The field shows the current value again; the
   * caller asks whether to delete the element (yes: delete it; no: nothing more to do). Without
   * it, an empty entry is invalid like any other.
   */
  readonly onEmpty?: () => void;
}

/**
 * Length field. Accepts units (`3.5 m`, `350 cm`) and expressions (`3500 + 200`).
 * Enter or leaving the field commits; Escape restores the current value. An invalid entry, or a
 * length that is zero or negative, stays in the field, marked invalid with a message, and nothing
 * is committed. Committing an empty field calls `onEmpty` when it is given.
 */
export function NumericField({
  value,
  unit,
  onCommit,
  min,
  max,
  invalidMessage,
  outOfRangeMessage = invalidMessage,
  nonPositiveMessage = invalidMessage,
  onEmpty,
  className,
  disabled,
  onBlur,
  onFocus,
  onKeyDown,
  ...props
}: NumericFieldProps) {
  /** What the user is typing, or null when the field shows the current value. */
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const errorId = useId();
  const unitId = useId();

  function reset() {
    setDraft(null);
    setError(null);
  }

  function commit() {
    if (draft === null) return;
    if (onEmpty && draft.trim() === '') {
      reset();
      onEmpty();
      return;
    }
    const result = parseLength(draft, unit);
    if (!result.ok) {
      setError(invalidMessage);
      return;
    }
    const entered = result.value;
    if (entered < 0 || lengthsEqual(entered, mm(0))) {
      setError(nonPositiveMessage);
      return;
    }
    const belowMin = min !== undefined && entered < min && !lengthsEqual(entered, min);
    const aboveMax = max !== undefined && entered > max && !lengthsEqual(entered, max);
    if (belowMin || aboveMax) {
      setError(outOfRangeMessage);
      return;
    }
    reset();
    if (!lengthsEqual(entered, value)) onCommit(entered);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    if (event.key === 'Enter') {
      event.preventDefault();
      commit();
    } else if (event.key === 'Escape' && draft !== null) {
      event.preventDefault();
      reset();
    }
  }

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div
        className={cn(
          fieldBoxClassName,
          'gap-1 focus-within:outline-2 focus-within:outline-ring focus-within:outline-offset-2',
          error && 'border-destructive',
          disabled && 'cursor-not-allowed opacity-50',
        )}
      >
        <input
          type="text"
          inputMode="decimal"
          autoComplete="off"
          spellCheck={false}
          disabled={disabled}
          value={draft ?? formatLength(value, unit)}
          aria-invalid={error !== null}
          aria-describedby={error ? `${unitId} ${errorId}` : unitId}
          className="w-full min-w-0 flex-1 bg-transparent text-right tabular-nums outline-none disabled:cursor-not-allowed"
          onChange={(event) => {
            setDraft(event.target.value);
            setError(null);
          }}
          onFocus={(event) => {
            onFocus?.(event);
            event.target.select();
          }}
          onBlur={(event) => {
            onBlur?.(event);
            commit();
          }}
          onKeyDown={handleKeyDown}
          {...props}
        />
        <span id={unitId} className="select-none text-muted-foreground">
          {unit}
        </span>
      </div>
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  );
}
