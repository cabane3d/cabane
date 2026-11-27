import { X } from 'lucide-react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';
import { cn } from '../lib/cn';
import { IconButton } from './icon-button';

/**
 * Non-modal panel over a zone of the window, e.g. the Catalog over the plan view. The rest of
 * the window stays usable; Escape and the close button close it. Not portaled: put it in a
 * positioned container (`relative`); it floats 8 px inside that container's left edge.
 */
export function Drawer(props: Omit<ComponentProps<typeof DialogPrimitive.Root>, 'modal'>) {
  return <DialogPrimitive.Root modal={false} {...props} />;
}

export const DrawerTrigger = DialogPrimitive.Trigger;

export interface DrawerContentProps extends ComponentProps<typeof DialogPrimitive.Content> {
  readonly title: string;
  /** Accessible name of the close button, e.g. `Close catalog`. */
  readonly closeLabel: string;
}

export function DrawerContent({
  title,
  closeLabel,
  className,
  children,
  onInteractOutside,
  ...props
}: DrawerContentProps) {
  return (
    <DialogPrimitive.Content
      aria-describedby={undefined}
      // Working in the rest of the window (e.g. dropping furniture on the plan) keeps it open.
      onInteractOutside={(event) => {
        onInteractOutside?.(event);
        event.preventDefault();
      }}
      className={cn(
        'absolute inset-y-2 left-2 z-(--layer-drawer) flex w-drawer max-w-full flex-col overflow-hidden',
        'rounded-xl border border-popover-border bg-popover text-popover-foreground shadow-dialog',
        className,
      )}
      {...props}
    >
      <div className="flex min-h-bar shrink-0 items-center gap-2 border-b pr-1.5 pl-3">
        <DialogPrimitive.Title className="flex-1 font-semibold text-lg">
          {title}
        </DialogPrimitive.Title>
        <DialogPrimitive.Close asChild>
          <IconButton label={closeLabel} icon={<X />} size="sm" />
        </DialogPrimitive.Close>
      </div>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </DialogPrimitive.Content>
  );
}
