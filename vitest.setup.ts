/**
 * Setup of the Vitest environments. jsdom has no layout, so it does not implement ResizeObserver,
 * which the renderer uses to follow the size of the Plan view (Chromium always has it). Under jsdom,
 * a no-op observer stands in for it: nothing is ever resized there.
 */
if (typeof window !== 'undefined' && typeof window.ResizeObserver === 'undefined') {
  class NoLayoutResizeObserver implements ResizeObserver {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
  window.ResizeObserver = NoLayoutResizeObserver;
}
