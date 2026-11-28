import type { Point, WallId } from '@cabane3d/core';
import {
  mountPlanCanvas,
  type PlanCanvas,
  type PlanScene,
  type PlanView,
} from '@cabane3d/renderer';
import { type ReactNode, useLayoutEffect, useRef } from 'react';

export interface PlanViewSectionProps {
  /** The plan point under the cursor, or `null` when it leaves. Called at every pointer move. */
  readonly onCursorMove: (point: Point | null) => void;
  /** The view after every zoom, pan or resize, and once when mounted. */
  readonly onViewChange: (view: PlanView) => void;
  /** What the plan shows of the project: pass a new value after every change of the project. */
  readonly scene: PlanScene;
  /** Whether the Wall tool is the active tool. */
  readonly wallTool: boolean;
  /**
   * The user drew a wall with the Wall tool: create it with a core command and return its id, or
   * `null` when the command refused it.
   */
  readonly onDrawWall: (wall: { readonly start: Point; readonly end: Point }) => WallId | null;
  /** What floats over the plan: the Tool bar, the Level tabs. */
  readonly children?: ReactNode;
}

/**
 * The Plan view region (docs/design/main-window.md). React renders the region, its canvas and the
 * empty `Plan elements` list once; the renderer draws the plan, fills the list and handles the
 * gestures, outside React (ADR-0005). Pass stable `onCursorMove` and `onViewChange` callbacks:
 * the renderer is mounted again when they change.
 */
export function PlanViewSection({
  onCursorMove,
  onViewChange,
  scene,
  wallTool,
  onDrawWall,
  children,
}: PlanViewSectionProps) {
  const regionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const elementsRef = useRef<HTMLUListElement>(null);
  const planRef = useRef<PlanCanvas | null>(null);
  // The latest values, read when the renderer is mounted and by its events.
  const latest = useRef({ scene, wallTool, onDrawWall });
  // Declared first, so it runs before the other effects of the same render.
  useLayoutEffect(() => {
    latest.current = { scene, wallTool, onDrawWall };
  });

  // A layout effect, so the view is measured and published before the first paint.
  useLayoutEffect(() => {
    const region = regionRef.current;
    const canvas = canvasRef.current;
    if (!region || !canvas) return;
    const plan = mountPlanCanvas(
      region,
      canvas,
      {
        onCursorMove,
        onViewChange,
        onDrawWall: (wall) => latest.current.onDrawWall(wall),
      },
      elementsRef.current,
    );
    plan.showScene(latest.current.scene);
    plan.setWallTool(latest.current.wallTool);
    planRef.current = plan;
    return () => {
      planRef.current = null;
      plan.dispose();
    };
  }, [onCursorMove, onViewChange]);

  useLayoutEffect(() => {
    planRef.current?.showScene(scene);
  }, [scene]);

  useLayoutEffect(() => {
    planRef.current?.setWallTool(wallTool);
  }, [wallTool]);

  return (
    <section
      ref={regionRef}
      aria-label="Plan view"
      className="relative min-h-0 flex-1 overflow-hidden bg-plan-paper"
    >
      <canvas ref={canvasRef} className="absolute inset-0 block size-full" />
      {/* Filled by the renderer: React never renders its items. */}
      <ul ref={elementsRef} aria-label="Plan elements" className="sr-only" />
      {children}
    </section>
  );
}
