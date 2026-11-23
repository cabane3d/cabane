import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from 'lucide-react';
import { Toast as ToastPrimitive } from 'radix-ui';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../lib/cn';
import { Button } from './button';

export type ToastStatus = 'info' | 'success' | 'warning' | 'error';

const STATUS_ICON: Readonly<Record<ToastStatus, ReactNode>> = {
  info: <Info aria-hidden="true" className="text-info" />,
  success: <CircleCheck aria-hidden="true" className="text-success" />,
  warning: <TriangleAlert aria-hidden="true" className="text-warning" />,
  error: <CircleAlert aria-hidden="true" className="text-destructive" />,
};

export const ToastProvider = ToastPrimitive.Provider;

/** Where toasts appear: the bottom right corner of the window. */
export function ToastViewport({
  className,
  ...props
}: ComponentProps<typeof ToastPrimitive.Viewport>) {
  return (
    <ToastPrimitive.Viewport
      className={cn(
        // F8 focuses the viewport: keep the token focus outline, inset so the window edge does not clip it.
        'fixed right-0 bottom-0 z-(--layer-toast) flex w-drawer max-w-full flex-col gap-2 p-4 focus-visible:-outline-offset-2',
        className,
      )}
      {...props}
    />
  );
}

export interface ToastProps extends Omit<ComponentProps<typeof ToastPrimitive.Root>, 'title'> {
  /** The icon tells the status, so it never relies on color alone. */
  readonly status: ToastStatus;
  readonly title: string;
  readonly description?: string;
  /** Optional action, e.g. `Undo`. `altText` describes how to do it without the toast. */
  readonly action?: {
    readonly label: string;
    readonly altText: string;
    readonly onClick: () => void;
  };
  /** Accessible name of the close button, e.g. `Dismiss`. */
  readonly closeLabel: string;
}

/** A short message about something that just happened. */
export function Toast({
  status,
  title,
  description,
  action,
  closeLabel,
  className,
  ...props
}: ToastProps) {
  return (
    <ToastPrimitive.Root
      type={status === 'error' ? 'foreground' : 'background'}
      className={cn(
        'flex items-start gap-2 rounded-lg border border-popover-border bg-popover p-3 text-popover-foreground shadow-dialog [&_svg]:size-icon [&_svg]:shrink-0',
        className,
      )}
      {...props}
    >
      <span className="inline-flex pt-0.5">{STATUS_ICON[status]}</span>
      <div className="flex flex-1 flex-col gap-0.5">
        <ToastPrimitive.Title className="font-semibold">{title}</ToastPrimitive.Title>
        {description && (
          <ToastPrimitive.Description className="text-muted-foreground">
            {description}
          </ToastPrimitive.Description>
        )}
      </div>
      {action && (
        <ToastPrimitive.Action altText={action.altText} asChild>
          <Button size="sm" onClick={action.onClick}>
            {action.label}
          </Button>
        </ToastPrimitive.Action>
      )}
      <ToastPrimitive.Close asChild>
        <Button variant="ghost" size="icon-sm" aria-label={closeLabel}>
          <X aria-hidden="true" />
        </Button>
      </ToastPrimitive.Close>
    </ToastPrimitive.Root>
  );
}
