import type { Point } from '@cabane3d/core';
import { mountPlanCanvas, type PlanView } from '@cabane3d/renderer';
import { type ReactNode, useLayoutEffect, useRef } from 'react';

export interface PlanViewSectionProps {
  /** The plan point under the cursor, or `null` when it leaves. Called at every pointer move. */
  readonly onCursorMove: (point: Point | null) => void;
  /** The view after every zoom, pan or resize, and once when mounted. */
  readonly onViewChange: (view: PlanView) => void;
  /** What floats over the plan: the Tool bar, the Level tabs. */
  readonly children?: ReactNode;
}

/**
 * The Plan view region (docs/design/main-window.md). React renders the region and its canvas once;
 * the renderer draws the plan and handles the navigation gestures, outside React (ADR-0005).
 * Pass stable callbacks: the renderer is mounted again when they change.
 */
export function PlanViewSection({ onCursorMove, onViewChange, children }: PlanViewSectionProps) {
  const regionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // A layout effect, so the view is measured and published before the first paint.
  useLayoutEffect(() => {
    const region = regionRef.current;
    const canvas = canvasRef.current;
    if (!region || !canvas) return;
    const plan = mountPlanCanvas(region, canvas, { onCursorMove, onViewChange });
    return () => plan.dispose();
  }, [onCursorMove, onViewChange]);

  return (
    <section
      ref={regionRef}
      aria-label="Plan view"
      className="relative min-h-0 flex-1 overflow-hidden bg-plan-paper"
    >
      <canvas ref={canvasRef} className="absolute inset-0 block size-full" />
      {children}
    </section>
  );
}
