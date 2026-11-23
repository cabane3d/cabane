import { RadioGroup as RadioGroupPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';
import { cn } from '../lib/cn';

export interface SegmentedControlProps extends ComponentProps<typeof RadioGroupPrimitive.Root> {
  /** Accessible name, e.g. `View switcher`. */
  readonly 'aria-label': string;
}

/** A choice between a few exclusive options shown side by side (`radiogroup`), e.g. 2D | 3D. */
export function SegmentedControl({ className, ...props }: SegmentedControlProps) {
  return (
    <RadioGroupPrimitive.Root
      orientation="horizontal"
      className={cn('inline-flex gap-0.5 rounded-full bg-muted p-0.5', className)}
      {...props}
    />
  );
}

/** One option. The selected one is filled with `primary` and semibold. */
export function SegmentedControlItem({
  className,
  ...props
}: ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      className={cn(
        'inline-flex h-control-sm min-w-control items-center justify-center gap-1.5 rounded-full px-3 text-base text-foreground [&_svg]:size-icon',
        'enabled:hover:bg-background data-[state=checked]:bg-primary data-[state=checked]:shadow-popover data-[state=checked]:font-semibold data-[state=checked]:text-primary-foreground',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}
