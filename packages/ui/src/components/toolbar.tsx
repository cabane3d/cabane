import { Toolbar as ToolbarPrimitive } from 'radix-ui';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../lib/cn';
import { Tooltip } from './tooltip';

export interface ToolbarProps extends ComponentProps<typeof ToolbarPrimitive.Root> {
  /** Accessible name, e.g. `Tool bar`. */
  readonly 'aria-label': string;
}

/** A row or column of controls; arrow keys move between them. */
export function Toolbar({ className, orientation = 'vertical', ...props }: ToolbarProps) {
  return (
    <ToolbarPrimitive.Root
      orientation={orientation}
      className={cn(
        'flex gap-1',
        orientation === 'vertical' ? 'flex-col' : 'flex-row items-center',
        className,
      )}
      {...props}
    />
  );
}

/** A line between groups of tools, across the tool bar. */
export function ToolbarSeparator({
  className,
  ...props
}: ComponentProps<typeof ToolbarPrimitive.Separator>) {
  return (
    <ToolbarPrimitive.Separator
      className={cn(
        'shrink-0 bg-border data-[orientation=horizontal]:my-1 data-[orientation=horizontal]:h-px data-[orientation=vertical]:mx-1 data-[orientation=vertical]:w-px',
        className,
      )}
      {...props}
    />
  );
}

export interface ToolButtonProps
  extends Omit<ComponentProps<typeof ToolbarPrimitive.Button>, 'children' | 'aria-pressed'> {
  /** Accessible name, also shown in the tooltip, e.g. `Wall tool`. */
  readonly label: string;
  readonly shortcut?: string;
  readonly icon: ReactNode;
  /** Whether this tool is the active one. */
  readonly active: boolean;
}

/**
 * A tool of the tool bar. The active tool is a filled `primary` tile with a dark icon: the
 * filled shape stands out from the bar, so the state never relies on hue alone.
 */
export function ToolButton({
  label,
  shortcut,
  icon,
  active,
  className,
  ...props
}: ToolButtonProps) {
  return (
    <Tooltip label={label} shortcut={shortcut} side="right">
      <ToolbarPrimitive.Button
        aria-label={label}
        aria-keyshortcuts={shortcut}
        aria-pressed={active}
        className={cn(
          'inline-flex size-bar shrink-0 items-center justify-center rounded-md text-foreground enabled:hover:bg-hover [&_svg]:size-icon-lg',
          'aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:enabled:hover:bg-primary',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      >
        {icon}
      </ToolbarPrimitive.Button>
    </Tooltip>
  );
}
