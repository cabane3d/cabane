import type { ReactNode } from 'react';
import { Button, type ButtonProps } from './button';
import { Tooltip } from './tooltip';

export interface IconButtonProps extends Omit<ButtonProps, 'size' | 'children' | 'asChild'> {
  /** Accessible name, also shown in the tooltip. */
  readonly label: string;
  /** Keyboard shortcut shown in the tooltip, e.g. `Ctrl+Z`. */
  readonly shortcut?: string;
  readonly icon: ReactNode;
  readonly size?: 'default' | 'sm';
  readonly tooltipSide?: 'top' | 'right' | 'bottom' | 'left';
}

/** Square button with only an icon; its name is given to assistive technologies and in a tooltip. */
export function IconButton({
  label,
  shortcut,
  icon,
  size = 'default',
  variant = 'ghost',
  tooltipSide,
  ...props
}: IconButtonProps) {
  return (
    <Tooltip label={label} shortcut={shortcut} side={tooltipSide}>
      <Button
        aria-label={label}
        aria-keyshortcuts={shortcut}
        variant={variant}
        size={size === 'sm' ? 'icon-sm' : 'icon'}
        {...props}
      >
        {icon}
      </Button>
    </Tooltip>
  );
}
