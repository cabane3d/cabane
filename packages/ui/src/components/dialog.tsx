import { X } from 'lucide-react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';
import { cn } from '../lib/cn';
import { IconButton } from './icon-button';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export interface DialogContentProps extends ComponentProps<typeof DialogPrimitive.Content> {
  readonly title: string;
  /** One sentence under the title; also the dialog's accessible description. */
  readonly description?: string;
  /** Accessible name of the close button, e.g. `Close`. */
  readonly closeLabel: string;
}

/**
 * Modal dialog, centered, `dialog` wide, raised by its shadow; no veil behind it (ADR-0021).
 * Escape and the close button close it.
 */
export function DialogContent({
  title,
  description,
  closeLabel,
  className,
  children,
  ...props
}: DialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-(--layer-dialog)" />
      <DialogPrimitive.Content
        // Without a description, tell Radix there is none on purpose.
        {...(description ? {} : { 'aria-describedby': undefined })}
        className={cn(
          'fixed top-1/2 left-1/2 z-(--layer-dialog) flex w-dialog max-w-full -translate-x-1/2 -translate-y-1/2 flex-col gap-4',
          'rounded-xl border border-popover-border bg-popover p-6 text-popover-foreground shadow-dialog',
          className,
        )}
        {...props}
      >
        <div className="flex items-start gap-2">
          <div className="flex flex-1 flex-col gap-1">
            <DialogPrimitive.Title className="font-semibold text-lg">{title}</DialogPrimitive.Title>
            {description && (
              <DialogPrimitive.Description className="text-muted-foreground">
                {description}
              </DialogPrimitive.Description>
            )}
          </div>
          <DialogPrimitive.Close asChild>
            <IconButton label={closeLabel} icon={<X />} size="sm" />
          </DialogPrimitive.Close>
        </div>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

/** Actions at the bottom right of a dialog; the primary action comes last. */
export function DialogFooter({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex justify-end gap-2', className)} {...props} />;
}
