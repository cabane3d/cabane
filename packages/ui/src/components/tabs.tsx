import { Tabs as TabsPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';
import { cn } from '../lib/cn';

export const Tabs = TabsPrimitive.Root;
export const TabsContent = TabsPrimitive.Content;

export function TabsList({ className, ...props }: ComponentProps<typeof TabsPrimitive.List>) {
  return <TabsPrimitive.List className={cn('flex items-center gap-1', className)} {...props} />;
}

/** A pill-shaped tab. The selected one is filled with `muted`, semibold, in `foreground`. */
export function TabsTrigger({ className, ...props }: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'inline-flex h-control items-center gap-1.5 rounded-full px-3 text-base text-muted-foreground [&_svg]:size-icon',
        'enabled:hover:bg-hover enabled:hover:text-foreground data-[state=active]:bg-muted data-[state=active]:font-semibold data-[state=active]:text-foreground',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}
