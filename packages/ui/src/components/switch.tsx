import { Switch as SwitchPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';
import { cn } from '../lib/cn';

/**
 * On/off setting that applies immediately (e.g. Snap). On: `primary` track and the thumb moves
 * to the right, so the state never relies on color alone.
 */
export function Switch({ className, ...props }: ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        'group inline-flex h-icon w-control shrink-0 items-center rounded-full border border-input bg-background p-px',
        'data-[state=checked]:border-primary data-[state=checked]:bg-primary',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="block size-3 rounded-full bg-foreground data-[state=checked]:ml-auto data-[state=checked]:bg-primary-foreground" />
    </SwitchPrimitive.Root>
  );
}
