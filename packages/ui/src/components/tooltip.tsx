import { Tooltip as TooltipPrimitive } from 'radix-ui';
import type { ReactElement, ReactNode } from 'react';
import { Kbd } from './kbd';

/** Delay before a tooltip opens, in milliseconds. */
const TOOLTIP_DELAY = 400;

export function TooltipProvider({ children }: { readonly children: ReactNode }) {
  return (
    <TooltipPrimitive.Provider delayDuration={TOOLTIP_DELAY}>{children}</TooltipPrimitive.Provider>
  );
}

export interface TooltipProps {
  /** The text shown; for icon-only buttons, the same text as their accessible name. */
  readonly label: ReactNode;
  /** Keyboard shortcut shown after the label, e.g. `W` or `Ctrl+Z`. */
  readonly shortcut?: string | undefined;
  readonly side?: 'top' | 'right' | 'bottom' | 'left' | undefined;
  /** The element that shows the tooltip on hover and focus. It must accept a ref. */
  readonly children: ReactElement;
}

/**
 * Short label shown on hover and keyboard focus, in an inverted bubble (dark in the light
 * theme, light in the dark theme). Needs a `TooltipProvider` above it.
 */
export function Tooltip({ label, shortcut, side = 'bottom', children }: TooltipProps) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          sideOffset={4}
          className="z-(--layer-tooltip) flex max-w-panel items-center gap-2 rounded-md bg-foreground px-2 py-1 text-background text-sm shadow-popover"
        >
          {label}
          {shortcut && <Kbd className="text-background/70">{shortcut}</Kbd>}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
