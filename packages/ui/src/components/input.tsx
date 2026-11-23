import { CircleAlert } from 'lucide-react';
import type { ComponentProps } from 'react';
import { cn } from '../lib/cn';

/** Classes of the field box, shared by `Input`, `NumericField` and `SelectTrigger`. */
export const fieldBoxClassName = cn(
  'flex h-control w-full min-w-0 items-center rounded-md border border-input bg-background px-2 text-base text-foreground',
  'placeholder:text-muted-foreground aria-invalid:border-destructive',
  'disabled:cursor-not-allowed disabled:opacity-50',
);

/** Single-line text field. Set `aria-invalid` and show a `FieldError` when its value is wrong. */
export function Input({ className, type = 'text', ...props }: ComponentProps<'input'>) {
  return <input type={type} className={cn(fieldBoxClassName, className)} {...props} />;
}

/** Error message under a field, with an icon so it never relies on color alone. */
export function FieldError({ className, children, ...props }: ComponentProps<'p'>) {
  return (
    <p className={cn('flex items-center gap-1 text-destructive text-sm', className)} {...props}>
      <CircleAlert aria-hidden="true" className="size-icon shrink-0" />
      {children}
    </p>
  );
}
