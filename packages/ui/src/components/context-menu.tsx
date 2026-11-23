import { ContextMenu as MenuPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';
import { cn } from '../lib/cn';
import { Kbd } from './kbd';
import { floatingLayerClassName, menuItemClassName } from './menu-styles';

/** Menu opened by a right click (or the Menu key) on its trigger, e.g. the plan or a list. */
export const ContextMenu = MenuPrimitive.Root;
export const ContextMenuTrigger = MenuPrimitive.Trigger;

export function ContextMenuContent({
  className,
  ...props
}: ComponentProps<typeof MenuPrimitive.Content>) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Content
        className={cn(floatingLayerClassName, 'z-(--layer-popover) min-w-panel', className)}
        {...props}
      />
    </MenuPrimitive.Portal>
  );
}

export interface ContextMenuItemProps extends ComponentProps<typeof MenuPrimitive.Item> {
  /** Keyboard shortcut shown at the right of the item, e.g. `Delete`. */
  readonly shortcut?: string;
  readonly destructive?: boolean;
}

export function ContextMenuItem({
  className,
  shortcut,
  destructive = false,
  children,
  ...props
}: ContextMenuItemProps) {
  return (
    <MenuPrimitive.Item
      className={cn(menuItemClassName, destructive && 'text-destructive', className)}
      {...props}
    >
      {children}
      {shortcut && <Kbd className="ml-auto pl-4">{shortcut}</Kbd>}
    </MenuPrimitive.Item>
  );
}

export function ContextMenuSeparator({
  className,
  ...props
}: ComponentProps<typeof MenuPrimitive.Separator>) {
  return (
    <MenuPrimitive.Separator className={cn('-mx-1 my-1 h-px bg-border', className)} {...props} />
  );
}
