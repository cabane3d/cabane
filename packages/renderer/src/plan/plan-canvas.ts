import type { Point } from '@cabane3d/core';
import {
  createPlanView,
  type PlanView,
  panView,
  resizeView,
  type ScreenPoint,
  screenToPlan,
  zoomView,
} from './view';

/**
 * The Plan view on screen (ADR-0005): an imperative Canvas 2D view, outside React. It owns the
 * view transform and the navigation gestures (wheel zoom toward the cursor, pan with the middle
 * button or Space + left button, whatever the active tool). The view is not part of the project:
 * nothing here writes to the document (ADR-0004).
 */

export interface PlanCanvasEvents {
  /** The plan point under the cursor, or `null` when the cursor leaves the Plan view. */
  readonly onCursorMove?: (point: Point | null) => void;
  /** The view after every change: zoom, pan or resize. Also called once when mounted. */
  readonly onViewChange?: (view: PlanView) => void;
}

export interface PlanCanvas {
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
 * `data-scale`, `data-origin-x` and `data-origin-y` (docs/api/plan-view.md), straight to the DOM.
 */
export function mountPlanCanvas(
  region: HTMLElement,
  canvas: HTMLCanvasElement,
  events: PlanCanvasEvents = {},
): PlanCanvas {
  const bounds = canvas.getBoundingClientRect();
  let view = createPlanView(bounds.width, bounds.height);
  let context: CanvasRenderingContext2D | null = null;
  let frame: number | null = null;
  let spaceHeld = false;
  // Whether the pointer is over the plan itself: the canvas, not the controls floating over it.
  let pointerInside = false;
  let pan: { readonly pointerId: number; last: ScreenPoint } | null = null;

  const localPoint = (event: MouseEvent): ScreenPoint => {
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const draw = () => {
    frame = null;
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
    // The paper is the region's background: nothing is drawn on the plan yet.
    context.clearRect(0, 0, view.width, view.height);
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

  const setView = (next: PlanView) => {
    if (next === view) return;
    view = next;
    publish();
  };

  const updateCursor = (point: ScreenPoint) => {
    events.onCursorMove?.(screenToPlan(view, point));
  };

  const onWheel = (event: WheelEvent) => {
    if (event.deltaY === 0) return;
    // Not passive: the page must neither scroll nor zoom.
    event.preventDefault();
    const cursor = localPoint(event);
    // One notch per wheel event, whatever its size: wheel up (negative deltaY) zooms in.
    setView(zoomView(view, event.deltaY < 0 ? 1 : -1, cursor));
    updateCursor(cursor);
  };

  const onPointerDown = (event: PointerEvent) => {
    if (pan) return;
    const middle = event.button === MIDDLE_BUTTON;
    if (!middle && !(event.button === LEFT_BUTTON && spaceHeld)) return;
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
    canvas.style.cursor = spaceHeld ? 'grab' : '';
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
    if (!pan) canvas.style.cursor = '';
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.code !== 'Space' || event.isComposing) return;
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

  canvas.addEventListener('wheel', onWheel, { passive: false });
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', endPan);
  canvas.addEventListener('pointercancel', endPan);
  canvas.addEventListener('lostpointercapture', endPan);
  canvas.addEventListener('pointerenter', onPointerEnter);
  canvas.addEventListener('pointerleave', onPointerLeave);
  canvas.addEventListener('mousedown', onMouseDown);
  window.addEventListener('keydown', onKeyDown, { capture: true });
  window.addEventListener('keyup', onKeyUp, { capture: true });
  window.addEventListener('blur', releaseSpace);

  publish();

  return {
    dispose() {
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
      window.removeEventListener('keydown', onKeyDown, { capture: true });
      window.removeEventListener('keyup', onKeyUp, { capture: true });
      window.removeEventListener('blur', releaseSpace);
    },
  };
}
