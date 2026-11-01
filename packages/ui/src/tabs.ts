/**
 * Index of the tab a key moves to in a tab list (WAI-ARIA tabs pattern), wrapping around,
 * or `null` when the key does not move between tabs.
 */
export function targetTabIndex(key: string, current: number, count: number): number | null {
  if (count === 0) return null;
  switch (key) {
    case 'ArrowRight':
      return (current + 1) % count;
    case 'ArrowLeft':
      return (current - 1 + count) % count;
    case 'Home':
      return 0;
    case 'End':
      return count - 1;
    default:
      return null;
  }
}
