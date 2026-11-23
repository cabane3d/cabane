/**
 * Classes shared by floating layers and the items of menus and selects (ADR-0021): a raised
 * `popover` surface with a light border, a soft shadow and `lg` corners; 28 px rounded items
 * with a `hover` highlight. With the keyboard the highlighted item also gets the focus outline,
 * inset so the next item does not hide it.
 */
export const floatingLayerClassName =
  'rounded-lg border border-popover-border bg-popover p-1 text-base text-popover-foreground shadow-popover';

export const menuItemClassName = [
  'relative flex h-control cursor-default select-none items-center gap-2 rounded-md px-2 text-base',
  'focus:outline-none focus-visible:outline-2 focus-visible:-outline-offset-2',
  'data-highlighted:bg-hover data-disabled:opacity-50 [&_svg]:size-icon [&_svg]:shrink-0',
].join(' ');
