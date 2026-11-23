import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import type { ComponentProps } from 'react';
import { cn } from '../lib/cn';

export const buttonVariants = cva(
  [
    'inline-flex shrink-0 select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-md border',
    'disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:size-icon [&_svg]:shrink-0',
  ],
  {
    variants: {
      variant: {
        primary: 'border-primary bg-primary font-semibold text-primary-foreground',
        secondary: 'border-input bg-background text-foreground enabled:hover:bg-hover',
        ghost: 'border-transparent bg-transparent text-foreground enabled:hover:bg-hover',
        destructive: 'border-destructive bg-background text-destructive enabled:hover:bg-hover',
      },
      size: {
        default: 'h-control px-3 text-base',
        sm: 'h-control-sm px-2 text-sm',
        icon: 'size-control',
        'icon-sm': 'size-control-sm',
      },
    },
    defaultVariants: { variant: 'secondary', size: 'default' },
  },
);

export interface ButtonProps extends ComponentProps<'button'>, VariantProps<typeof buttonVariants> {
  /** Renders the child element (e.g. a link) with the button's look instead of a `<button>`. */
  readonly asChild?: boolean;
}

/** Text button. One `primary` button at most per dialog or zone. */
export function Button({ className, variant, size, asChild = false, type, ...props }: ButtonProps) {
  const Component = asChild ? Slot.Root : 'button';
  return (
    <Component
      type={asChild ? type : (type ?? 'button')}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
