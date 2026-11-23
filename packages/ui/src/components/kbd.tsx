import type { ComponentProps } from 'react';
import { cn } from '../lib/cn';

/** A keyboard shortcut, as shown in tooltips and menus. */
export function Kbd({ className, ...props }: ComponentProps<'kbd'>) {
  return (
    <kbd
      className={cn('font-normal font-sans text-muted-foreground text-sm tabular-nums', className)}
      {...props}
    />
  );
}
