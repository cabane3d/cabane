import type { Point } from '@cabane3d/core';
import type { Ref } from 'react';

export interface StatusBarProps {
  /** The zoom of the Plan view, as a rounded percentage; `null` until the Plan view is measured. */
  readonly zoom: number | null;
  /**
   * The element of the cursor coordinates. It changes at every pointer move, so it is written
   * straight to the DOM with {@link showCursor}, never through React state.
   */
  readonly cursorRef: Ref<HTMLSpanElement>;
}

/** The plan coordinates of the cursor, in the display unit (millimeters for now), rounded. */
export function formatCursor(point: Point): string {
  // `${-0}` is "0", so a coordinate rounded from just below zero shows as 0.
  return `x ${Math.round(point.x)} mm · y ${Math.round(point.y)} mm`;
}

/** Shows the plan point under the cursor in the Status bar, or hides it when `point` is null. */
export function showCursor(element: HTMLElement, point: Point | null): void {
  element.hidden = point === null;
  element.textContent = point ? formatCursor(point) : '';
}

/** The Status bar, at the bottom of the Main window (docs/design/main-window.md). */
export function StatusBar({ zoom, cursorRef }: StatusBarProps) {
  return (
    // A <footer> inside <main> has no landmark role of its own: it is given explicitly, with the
    // glossary name.
    <footer
      role="contentinfo"
      aria-label="Status bar"
      className="flex min-h-control shrink-0 items-center gap-4 border-t bg-background px-3 text-muted-foreground text-sm tabular-nums"
    >
      <span ref={cursorRef} hidden />
      <div className="flex-1" />
      {zoom !== null && <span>{`Zoom ${zoom}%`}</span>}
    </footer>
  );
}
