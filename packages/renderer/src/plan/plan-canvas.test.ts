// @vitest-environment jsdom
import { lengthsEqual } from '@cabane3d/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mountPlanCanvas, type PlanCanvas } from './plan-canvas';
import { type PlanView, screenToPlan } from './view';

const WIDTH = 1000;
const HEIGHT = 600;

/** A ResizeObserver whose callback the test calls: jsdom has no layout. */
class FakeResizeObserver implements ResizeObserver {
  static last: FakeResizeObserver | null = null;
  constructor(private readonly callback: ResizeObserverCallback) {
    FakeResizeObserver.last = this;
  }
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  resize(target: Element, inlineSize: number, blockSize: number): void {
    const size = [{ inlineSize, blockSize }];
    const entry: ResizeObserverEntry = {
      target,
      contentRect: rect(inlineSize, blockSize),
      borderBoxSize: size,
      contentBoxSize: size,
      devicePixelContentBoxSize: size,
    };
    this.callback([entry], this);
  }
}

function rect(width: number, height: number): DOMRect {
  return {
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    width,
    height,
    right: width,
    bottom: height,
    toJSON: () => ({}),
  };
}

let region: HTMLElement;
let canvas: HTMLCanvasElement;
let plan: PlanCanvas;

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', FakeResizeObserver);
  // Drawing needs a 2D context, which jsdom lacks: the frame never runs.
  vi.stubGlobal('requestAnimationFrame', () => 1);
  vi.stubGlobal('cancelAnimationFrame', () => {});
  region = document.createElement('section');
  canvas = document.createElement('canvas');
  vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue(rect(WIDTH, HEIGHT));
  // jsdom does not implement pointer capture.
  canvas.setPointerCapture = () => {};
  canvas.releasePointerCapture = () => {};
  canvas.hasPointerCapture = () => false;
  region.append(canvas);
  document.body.append(region);
  plan = mountPlanCanvas(region, canvas);
});

afterEach(() => {
  plan.dispose();
  region.remove();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function origin(): { x: number; y: number } {
  return { x: Number(region.dataset.originX), y: Number(region.dataset.originY) };
}

function viewOnRegion(width: number, height: number): PlanView {
  return { width, height, scale: Number(region.dataset.scale), origin: origin() };
}

function pressSpace(target: EventTarget, init: KeyboardEventInit = {}): KeyboardEvent {
  const event = new KeyboardEvent('keydown', {
    code: 'Space',
    key: ' ',
    bubbles: true,
    cancelable: true,
    ...init,
  });
  target.dispatchEvent(event);
  return event;
}

/** A left-button drag of (dx, dy) px on the canvas, from (500, 300). */
function leftDrag(dx: number, dy: number): void {
  const at = (x: number, y: number) => ({
    pointerId: 1,
    button: 0,
    clientX: x,
    clientY: y,
    bubbles: true,
    cancelable: true,
  });
  canvas.dispatchEvent(new PointerEvent('pointerdown', at(500, 300)));
  canvas.dispatchEvent(new PointerEvent('pointermove', at(500 + dx, 300 + dy)));
  canvas.dispatchEvent(new PointerEvent('pointerup', at(500 + dx, 300 + dy)));
}

function focusedButton(): HTMLButtonElement {
  const button = document.createElement('button');
  button.textContent = 'Select tool';
  region.append(button);
  button.focus();
  return button;
}

describe('mountPlanCanvas, Space and the left button', () => {
  it('pans with Space held on a focused tool button while the pointer is over the plan', () => {
    const button = focusedButton();
    canvas.dispatchEvent(new PointerEvent('pointerenter'));

    const keydown = pressSpace(button);
    leftDrag(-100, 50);

    expect(keydown.defaultPrevented).toBe(true);
    expect(origin()).toEqual({ x: 400, y: 350 });
  });

  it('leaves Space to a focused tool button while the pointer is not over the plan', () => {
    const button = focusedButton();
    canvas.dispatchEvent(new PointerEvent('pointerenter'));
    canvas.dispatchEvent(new PointerEvent('pointerleave'));

    const keydown = pressSpace(button);

    expect(keydown.defaultPrevented).toBe(false);
  });

  it('does not pan with Space typed in a text field, even with the pointer over the plan', () => {
    const input = document.createElement('input');
    region.append(input);
    input.focus();
    canvas.dispatchEvent(new PointerEvent('pointerenter'));

    const keydown = pressSpace(input);
    leftDrag(-100, 50);

    expect(keydown.defaultPrevented).toBe(false);
    expect(origin()).toEqual({ x: 500, y: 300 });
  });

  it('does not pan with Space during an IME composition', () => {
    const keydown = pressSpace(document.body, { isComposing: true });
    leftDrag(-100, 50);

    expect(keydown.defaultPrevented).toBe(false);
    expect(origin()).toEqual({ x: 500, y: 300 });
  });

  it('releases Space when the window loses focus', () => {
    pressSpace(document.body);
    expect(canvas.style.cursor).toBe('grab');

    window.dispatchEvent(new Event('blur'));
    leftDrag(-100, 50);

    expect(canvas.style.cursor).toBe('');
    expect(origin()).toEqual({ x: 500, y: 300 });
  });
});

describe('mountPlanCanvas, resizing', () => {
  it('keeps the plan point at the center of the Plan view at the center', () => {
    pressSpace(document.body);
    leftDrag(-100, 50);
    const center = screenToPlan(viewOnRegion(WIDTH, HEIGHT), { x: WIDTH / 2, y: HEIGHT / 2 });

    FakeResizeObserver.last?.resize(canvas, 800, 400);

    const newCenter = screenToPlan(viewOnRegion(800, 400), { x: 400, y: 200 });
    expect(origin()).toEqual({ x: 300, y: 250 });
    expect(lengthsEqual(newCenter.x, center.x)).toBe(true);
    expect(lengthsEqual(newCenter.y, center.y)).toBe(true);
  });
});
