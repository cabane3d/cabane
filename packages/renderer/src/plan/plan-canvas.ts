import { type Level, type Mm, type Point, type WallId, wallsOf } from '@cabane3d/core';
import { anchorsOf, findSnapPoint } from '@cabane3d/geometry';
import { drawPlan } from './plan-drawing';
import { markSnappedAnchor, showPlanElements } from './plan-elements';
import { loadPlanFonts, type PlanTokens, readPlanTokens, watchPlanTokens } from './tokens';
import {
  createPlanView,
  type PlanView,
  panView,
  resizeView,
  type ScreenPoint,
  screenToPlan,
  zoomView,
} from './view';
import {
  closesChain,
  extendChain,
  hasLength,
  pruneChain,
  startChain,
  type WallChain,
} from './wall-chain';

/**
 * The Plan view on screen (ADR-0005): an imperative Canvas 2D view, outside React. It owns the
 * view transform and the navigation gestures (wheel zoom toward the cursor, pan with the middle
 * button or Space + left button, whatever the active tool), and the pointer gestures of the Wall
 * tool. The view is not part of the project: nothing here writes to the document (ADR-0004). A
 * wall is drawn by asking the interface to create it ({@link PlanCanvasEvents.onDrawWall}), which
 * does so through a core command.
 */

export interface PlanCanvasEvents {
  /** The plan point under the cursor, or `null` when the cursor leaves the Plan view. */
  readonly onCursorMove?: (point: Point | null) => void;
  /** The view after every change: zoom, pan or resize. Also called once when mounted. */
  readonly onViewChange?: (view: PlanView) => void;
  /**
   * The user drew a wall from `start` to `end` with the Wall tool. Returns the id of the wall
   * created in the project, or `null` when it was refused: the chain then stays where it was.
   */
  readonly onDrawWall?: (wall: { readonly start: Point; readonly end: Point }) => WallId | null;
}

/** What the plan shows of the project. */
export interface PlanScene {
  /** The level shown: the current level. */
  readonly level: Level;
  /** The thickness a new wall takes: the default of the project. */
  readonly wallThickness: Mm;
}

export interface PlanCanvas {
  /** Shows the project as it is now. Called again after every change of the project. */
  showScene(scene: PlanScene): void;
  /**
   * Whether the Wall tool is the active tool. Choosing another tool abandons the wall being drawn;
   * the walls already created stay.
   */
  setWallTool(active: boolean): void;
  /** Removes every listener and observer. The elements stay in the page. */
  dispose(): void;
}

/** Elements where the Space key types text: it always stays theirs. */
const TEXT_ENTRY = [
  'input',
  'textarea',
  'select',
  '[contenteditable]:not([contenteditable="false"])',
  '[role="combobox"]',
  '[role="spinbutton"]',
  '[role="textbox"]',
].join(',');

/**
 * Controls that Space activates. They keep it only while the pointer is not over the plan: a tool
 * chosen with the mouse keeps the focus, and Space + drag over the plan must still move it.
 */
const CONTROL = [
  'button',
  'a[href]',
  '[role="button"]',
  '[role="checkbox"]',
  '[role="menuitem"]',
  '[role="menuitemcheckbox"]',
  '[role="menuitemradio"]',
  '[role="option"]',
  '[role="radio"]',
  '[role="slider"]',
  '[role="switch"]',
  '[role="tab"]',
].join(',');

function matches(target: EventTarget | null, selector: string): boolean {
  return target instanceof Element && target.closest(selector) !== null;
}

const MIDDLE_BUTTON = 1;
const LEFT_BUTTON = 0;

/**
 * Mounts the Plan view on `canvas`, which fills `region`. The view is published on the region as
 * `data-scale`, `data-origin-x` and `data-origin-y` (docs/api/plan-view.md), and the wall being
 * drawn as `data-drawing`, `data-drawing-length` and `data-drawing-thickness` (docs/api/walls.md),
 * straight to the DOM. The `elements` list, when given, describes the plan: its items are written
 * by the renderer (docs/api/walls.md).
 */
export function mountPlanCanvas(
  region: HTMLElement,
  canvas: HTMLCanvasElement,
  events: PlanCanvasEvents = {},
  elements: HTMLElement | null = null,
): PlanCanvas {
  const bounds = canvas.getBoundingClientRect();
  let view = createPlanView(bounds.width, bounds.height);
  let context: CanvasRenderingContext2D | null = null;
  let frame: number | null = null;
  let spaceHeld = false;
  // Whether the pointer is over the plan itself: the canvas, not the controls floating over it.
  let pointerInside = false;
  let pan: { readonly pointerId: number; last: ScreenPoint } | null = null;

  let tokens: PlanTokens | null = null;
  let fontsReady = false;
  let disposed = false;
  let scene: PlanScene | null = null;
  let anchors: readonly Point[] = [];
  let wallTool = false;
  let chain: WallChain | null = null;
  // The last cursor position over the plan, in screen pixels: the wall being drawn follows it.
  let cursor: ScreenPoint | null = null;

  const localPoint = (event: MouseEvent): ScreenPoint => {
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  /** The anchor the point being placed snaps to, if any. Only the Wall tool snaps. */
  const snappedAnchor = (): Point | null => {
    if (!wallTool || cursor === null) return null;
    return findSnapPoint(anchors, screenToPlan(view, cursor), 1 / view.scale);
  };

  /** The point a click at the cursor places: the snapped anchor, or the plan point under it. */
  const placedPoint = (): Point | null => {
    if (cursor === null) return null;
    return snappedAnchor() ?? screenToPlan(view, cursor);
  };

  /** The cursor of the plan when no gesture is going on. */
  const restCursor = () => (wallTool ? 'crosshair' : '');

  const draw = () => {
    frame = null;
    // The plan text must never fall back to a system font (docs/design/plan-drawing.md).
    if (!fontsReady) return;
    // The backing store is in device pixels, so lines stay crisp on high-density screens.
    const width = Math.round(view.width * devicePixelRatio);
    const height = Math.round(view.height * devicePixelRatio);
    if (width === 0 || height === 0) return;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    context ??= canvas.getContext('2d');
    if (!context) return;
    // One unit of the drawing is one CSS pixel.
    context.setTransform(width / view.width, 0, 0, height / view.height, 0, 0);
    tokens ??= readPlanTokens();
    const end = placedPoint();
    drawPlan(context, view, tokens, {
      walls: scene ? wallsOf(scene.level) : [],
      anchors: wallTool ? anchors : [],
      snapped: snappedAnchor(),
      drawing:
        chain && end && scene
          ? { start: chain.current, end, thickness: scene.wallThickness }
          : null,
    });
  };

  const scheduleDraw = () => {
    frame ??= requestAnimationFrame(draw);
  };

  const publish = () => {
    region.dataset.scale = String(view.scale);
    region.dataset.originX = String(view.origin.x);
    region.dataset.originY = String(view.origin.y);
    events.onViewChange?.(view);
    scheduleDraw();
  };

  /**
   * Publishes the wall being drawn on the region, and the snapped anchor on the list. A wall is
   * being drawn once the chain has a start point and the cursor is away from it: a chain whose
   * cursor is still on its start point shows no wall.
   */
  const publishDrawing = () => {
    const end = placedPoint();
    if (chain && scene && end && hasLength(chain, end)) {
      region.dataset.drawing = 'true';
      const length = Math.hypot(end.x - chain.current.x, end.y - chain.current.y);
      region.dataset.drawingLength = String(length);
      region.dataset.drawingThickness = String(scene.wallThickness);
    } else {
      region.dataset.drawing = 'false';
      delete region.dataset.drawingLength;
      delete region.dataset.drawingThickness;
    }
    if (elements) markSnappedAnchor(elements, wallTool ? anchors : [], snappedAnchor());
    scheduleDraw();
  };

  /** Writes the elements of the plan to the list, after a change of the scene or of the tool. */
  const publishElements = () => {
    if (elements) {
      showPlanElements(
        elements,
        scene ? wallsOf(scene.level) : [],
        wallTool ? anchors : [],
        snappedAnchor(),
      );
    }
    publishDrawing();
  };

  /** A left click with the Wall tool: starts the chain, or draws its next wall. */
  const placePoint = () => {
    const point = placedPoint();
    if (point === null) return;
    if (chain === null) {
      chain = startChain(point);
    } else if (hasLength(chain, point)) {
      const id = events.onDrawWall?.({ start: chain.current, end: point }) ?? null;
      if (id !== null) chain = closesChain(chain, point) ? null : extendChain(chain, id, point);
    }
    publishDrawing();
  };

  /** Ends the chain; the walls already drawn stay. Returns whether a chain was going on. */
  const endChain = (): boolean => {
    if (chain === null) return false;
    chain = null;
    publishDrawing();
    return true;
  };

  const setView = (next: PlanView) => {
    if (next === view) return;
    view = next;
    publish();
  };

  const updateCursor = (point: ScreenPoint) => {
    cursor = point;
    events.onCursorMove?.(screenToPlan(view, point));
    if (wallTool) publishDrawing();
  };

  const onWheel = (event: WheelEvent) => {
    if (event.deltaY === 0) return;
    // Not passive: the page must neither scroll nor zoom.
    event.preventDefault();
    const point = localPoint(event);
    // One notch per wheel event, whatever its size: wheel up (negative deltaY) zooms in.
    setView(zoomView(view, event.deltaY < 0 ? 1 : -1, point));
    updateCursor(point);
  };

  const onPointerDown = (event: PointerEvent) => {
    if (pan) return;
    const middle = event.button === MIDDLE_BUTTON;
    const left = event.button === LEFT_BUTTON;
    if (left && !spaceHeld && wallTool) {
      // Only the left button draws.
      event.preventDefault();
      updateCursor(localPoint(event));
      placePoint();
      return;
    }
    if (!middle && !(left && spaceHeld)) return;
    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);
    pan = { pointerId: event.pointerId, last: localPoint(event) };
    canvas.style.cursor = 'grabbing';
  };

  const onPointerMove = (event: PointerEvent) => {
    const point = localPoint(event);
    if (pan && event.pointerId === pan.pointerId) {
      setView(panView(view, point.x - pan.last.x, point.y - pan.last.y));
      pan.last = point;
    }
    updateCursor(point);
  };

  const endPan = (event: PointerEvent) => {
    if (!pan || event.pointerId !== pan.pointerId) return;
    pan = null;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    canvas.style.cursor = spaceHeld ? 'grab' : restCursor();
  };

  // A double-click ends the chain. Its second press fell on the end of the last wall: no wall.
  const onDoubleClick = (event: MouseEvent) => {
    if (event.button === LEFT_BUTTON && wallTool) endChain();
  };

  const onPointerEnter = () => {
    pointerInside = true;
  };

  const onPointerLeave = () => {
    pointerInside = false;
    events.onCursorMove?.(null);
  };

  // Chromium starts its autoscroll on the middle button's mousedown: prevent it.
  const onMouseDown = (event: MouseEvent) => {
    if (event.button === MIDDLE_BUTTON) event.preventDefault();
  };

  const releaseSpace = () => {
    spaceHeld = false;
    if (!pan) canvas.style.cursor = restCursor();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.isComposing) return;
    // Escape ends the chain; the walls already drawn stay.
    if (event.key === 'Escape') {
      if (!matches(event.target, TEXT_ENTRY) && endChain()) event.preventDefault();
      return;
    }
    if (event.code !== 'Space') return;
    if (matches(event.target, TEXT_ENTRY)) return;
    if (!pointerInside && matches(event.target, CONTROL)) return;
    // Space held means "move the plan": it must neither scroll the page nor activate the focused
    // control. Listened to in the capture phase, so this runs before the controls' own handlers.
    event.preventDefault();
    spaceHeld = true;
    if (!pan) canvas.style.cursor = 'grab';
  };

  const onKeyUp = (event: KeyboardEvent) => {
    if (event.code !== 'Space') return;
    // The keyup of an armed Space must not activate the focused control either.
    if (spaceHeld) event.preventDefault();
    releaseSpace();
  };

  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const size = entry.contentBoxSize[0];
      if (!size) continue;
      if (size.inlineSize !== view.width || size.blockSize !== view.height) {
        setView(resizeView(view, size.inlineSize, size.blockSize));
      } else {
        scheduleDraw();
      }
    }
  });
  // The device pixel box also changes with the device pixel ratio (the window moves to another
  // screen, the OS zoom changes): the canvas is then redrawn at the new density.
  resizeObserver.observe(canvas, { box: 'device-pixel-content-box' });

  // The tokens change with the theme, the contrast preference and forced colors: read them again.
  const stopWatchingTokens = watchPlanTokens(() => {
    tokens = null;
    scheduleDraw();
  });
  void loadPlanFonts(readPlanTokens()).then(() => {
    if (disposed) return;
    fontsReady = true;
    scheduleDraw();
  });

  canvas.addEventListener('wheel', onWheel, { passive: false });
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', endPan);
  canvas.addEventListener('pointercancel', endPan);
  canvas.addEventListener('lostpointercapture', endPan);
  canvas.addEventListener('pointerenter', onPointerEnter);
  canvas.addEventListener('pointerleave', onPointerLeave);
  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('dblclick', onDoubleClick);
  window.addEventListener('keydown', onKeyDown, { capture: true });
  window.addEventListener('keyup', onKeyUp, { capture: true });
  window.addEventListener('blur', releaseSpace);

  publish();
  publishElements();

  return {
    showScene(next) {
      scene = next;
      anchors = anchorsOf(next.level);
      const shown = new Set(wallsOf(next.level).map((wall) => wall.id));
      // After an undo, drawing continues from the start of the wall that was removed.
      if (chain) chain = pruneChain(chain, (id) => shown.has(id));
      publishElements();
    },
    setWallTool(active) {
      if (active === wallTool) return;
      wallTool = active;
      chain = null;
      if (!pan && !spaceHeld) canvas.style.cursor = restCursor();
      publishElements();
    },
    dispose() {
      disposed = true;
      stopWatchingTokens();
      resizeObserver.disconnect();
      if (frame !== null) cancelAnimationFrame(frame);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', endPan);
      canvas.removeEventListener('pointercancel', endPan);
      canvas.removeEventListener('lostpointercapture', endPan);
      canvas.removeEventListener('pointerenter', onPointerEnter);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('dblclick', onDoubleClick);
      window.removeEventListener('keydown', onKeyDown, { capture: true });
      window.removeEventListener('keyup', onKeyUp, { capture: true });
      window.removeEventListener('blur', releaseSpace);
    },
  };
}
