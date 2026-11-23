import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/** tailwind-merge, told about Cabane's named sizes so `h-control` and `h-full` conflict. */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      spacing: ['icon', 'icon-lg', 'control-sm', 'control', 'bar', 'panel', 'drawer', 'dialog'],
    },
  },
});

/** Joins class names; later Tailwind classes override earlier conflicting ones. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
