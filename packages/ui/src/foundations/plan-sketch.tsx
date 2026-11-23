import { useEffect, useRef } from 'react';

/**
 * A sketch of the plan conventions (docs/design/plan-drawing.md), drawn from the tokens the
 * same way the renderer will: colors, pen widths and fonts are read from CSS custom properties.
 * Geometry is in screen pixels here; it is a specimen, not the renderer.
 */
function readTokens() {
  const style = getComputedStyle(document.documentElement);
  const text = (name: string) => style.getPropertyValue(`--${name}`).trim();
  const num = (name: string) => Number.parseFloat(text(name));
  return {
    paper: text('plan-paper'),
    ink: text('plan-ink'),
    wall: text('plan-wall'),
    selection: text('plan-selection'),
    selectionText: text('plan-selection-text'),
    handleFill: text('plan-handle-fill'),
    handleStroke: text('plan-handle-stroke'),
    hover: text('plan-hover'),
    guide: text('plan-guide'),
    invalid: text('plan-invalid'),
    fine: num('plan-stroke-fine'),
    medium: num('plan-stroke-medium'),
    bold: num('plan-stroke-bold'),
    handle: num('plan-handle-size'),
    tick: num('plan-tick-size'),
    extensionGap: num('plan-extension-gap'),
    extensionOvershoot: num('plan-extension-overshoot'),
    hoverWidth: num('plan-hover-width'),
    hatch: num('plan-hatch-spacing'),
    dash: text('plan-dash').split(/\s+/).map(Number),
    fontLabel: text('plan-font-label'),
    fontDimension: text('plan-font-dimension'),
    textDimension: text('plan-text-dimension'),
    textLabel: text('plan-text-label'),
    textRoom: text('plan-text-room'),
  };
}

type Tokens = ReturnType<typeof readTokens>;
type Rect = readonly [x: number, y: number, w: number, h: number];

/** Size of the drawing, in CSS pixels; it is centered on larger canvases. */
const WIDTH = 760;
const HEIGHT = 420;
const T = 14; // wall thickness on screen

function wall(ctx: CanvasRenderingContext2D, t: Tokens, [x, y, w, h]: Rect, fill = t.wall) {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
  ctx.lineWidth = t.medium;
  ctx.strokeStyle = fill;
  ctx.strokeRect(x, y, w, h);
}

function handle(ctx: CanvasRenderingContext2D, t: Tokens, x: number, y: number) {
  const s = t.handle;
  ctx.fillStyle = t.handleFill;
  ctx.fillRect(x - s / 2, y - s / 2, s, s);
  ctx.lineWidth = t.fine;
  ctx.strokeStyle = t.handleStroke;
  ctx.strokeRect(x - s / 2 + 0.5, y - s / 2 + 0.5, s - 1, s - 1);
}

function dimension(
  ctx: CanvasRenderingContext2D,
  t: Tokens,
  x1: number,
  x2: number,
  measuredY: number,
  lineY: number,
  label: string,
  color = t.ink,
  textColor = t.ink,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = t.fine;
  ctx.beginPath();
  const dir = Math.sign(lineY - measuredY);
  for (const x of [x1, x2]) {
    ctx.moveTo(x + 0.5, measuredY + dir * t.extensionGap);
    ctx.lineTo(x + 0.5, lineY + dir * t.extensionOvershoot);
  }
  ctx.moveTo(x1, lineY + 0.5);
  ctx.lineTo(x2, lineY + 0.5);
  const half = t.tick / 2 / Math.SQRT2;
  for (const x of [x1, x2]) {
    ctx.moveTo(x - half, lineY + half);
    ctx.lineTo(x + half, lineY - half);
  }
  ctx.stroke();
  ctx.fillStyle = textColor;
  ctx.font = `${t.textDimension} ${t.fontDimension}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(label, (x1 + x2) / 2, lineY - 2);
}

function hatch(ctx: CanvasRenderingContext2D, t: Tokens, [x, y, w, h]: Rect) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.strokeStyle = t.invalid;
  ctx.lineWidth = t.fine;
  ctx.beginPath();
  for (let d = -h; d < w + h; d += t.hatch) {
    ctx.moveTo(x + d, y);
    ctx.lineTo(x + d + h, y + h);
    ctx.moveTo(x + d, y + h);
    ctx.lineTo(x + d + h, y);
  }
  ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = t.invalid;
  ctx.lineWidth = t.bold;
  ctx.strokeRect(x, y, w, h);
}

function draw(ctx: CanvasRenderingContext2D, t: Tokens, showInvalid: boolean) {
  // Snapping guide (dashed ink) along the top face of the room.
  ctx.save();
  ctx.setLineDash(t.dash);
  ctx.strokeStyle = t.guide;
  ctx.lineWidth = t.fine;
  ctx.beginPath();
  ctx.moveTo(-10_000, 80.5);
  ctx.lineTo(10_000, 80.5); // across the whole canvas
  ctx.stroke();
  ctx.restore();

  // Hover halo under the left wall.
  ctx.save();
  ctx.strokeStyle = t.hover;
  ctx.lineWidth = T + t.hoverWidth * 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(80 + T / 2, 80 + T / 2);
  ctx.lineTo(80 + T / 2, 320 - T / 2);
  ctx.stroke();
  ctx.restore();

  // Room: top wall with a door opening, left wall (hovered), bottom wall, right wall (selected).
  wall(ctx, t, [80, 80, 140, T]);
  wall(ctx, t, [300, 80, 160, T]);
  wall(ctx, t, [80, 80, T, 240]);
  wall(ctx, t, [80, 306, 380, T]);
  wall(ctx, t, [446, 80, T, 240], t.selection);
  handle(ctx, t, 446 + T / 2, 80 + T / 2);
  handle(ctx, t, 446 + T / 2, 320 - T / 2);

  // Door: leaf and swing.
  ctx.strokeStyle = t.ink;
  ctx.lineWidth = t.fine;
  ctx.beginPath();
  ctx.moveTo(220, 80 + T);
  ctx.lineTo(220, 80 + T + 80);
  ctx.moveTo(300, 80 + T);
  ctx.arc(220, 80 + T, 80, 0, Math.PI / 2);
  ctx.stroke();

  // Window in the bottom wall: three fine lines.
  ctx.fillStyle = t.paper;
  ctx.fillRect(320, 306, 90, T);
  ctx.beginPath();
  for (const y of [306, 306 + T / 2, 306 + T]) {
    ctx.moveTo(320, y + 0.5);
    ctx.lineTo(410, y + 0.5);
  }
  ctx.moveTo(320.5, 306);
  ctx.lineTo(320.5, 306 + T);
  ctx.moveTo(409.5, 306);
  ctx.lineTo(409.5, 306 + T);
  ctx.stroke();

  // Room name and area.
  ctx.fillStyle = t.ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `${t.textRoom} ${t.fontLabel}`;
  ctx.fillText('Living room', 270, 200);
  ctx.font = `${t.textDimension} ${t.fontDimension}`;
  ctx.fillText('12.4 m²', 270, 218);

  // Dimensions: one normal, one of the selected wall.
  dimension(ctx, t, 80, 460, 80, 48, '3800');
  ctx.save();
  ctx.translate(500, 320);
  ctx.rotate(-Math.PI / 2);
  dimension(ctx, t, 0, 240, -40, 0, '2400', t.selection, t.selectionText);
  ctx.restore();

  if (!showInvalid) return;
  // Invalid element: a wall overlapping another, cross-hatched.
  wall(ctx, t, [560, 150, 160, T]);
  hatch(ctx, t, [600, 130, 120, 50]);
  ctx.fillStyle = t.ink;
  ctx.textAlign = 'left';
  ctx.font = `${t.textLabel} ${t.fontLabel}`;
  ctx.fillText('Overlapping walls', 560, 220);
}

export interface PlanSketchProps {
  /** Accessible name of the drawing. */
  readonly label: string;
  /** Also draws an invalid, cross-hatched element (for the specimen). */
  readonly showInvalid?: boolean;
  readonly className?: string;
}

/**
 * Draws the sketch on a canvas that fills its parent, paper everywhere and the drawing centered.
 * Redrawn when the parent is resized or the theme changes.
 */
export function PlanSketch({ label, showInvalid = false, className }: PlanSketchProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    let cancelled = false;
    const render = async () => {
      const t = readTokens();
      await Promise.all([
        document.fonts.load(`${t.textRoom} ${t.fontLabel}`),
        document.fonts.load(`${t.textDimension} ${t.fontDimension}`),
      ]);
      if (cancelled) return;
      const ratio = window.devicePixelRatio;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.fillStyle = t.paper;
      ctx.fillRect(0, 0, width, height);
      ctx.translate(Math.round((width - WIDTH) / 2), Math.round((height - HEIGHT) / 2));
      draw(ctx, t, showInvalid);
    };
    void render();
    const resize = new ResizeObserver(() => void render());
    resize.observe(canvas);
    const theme = new MutationObserver(() => void render());
    theme.observe(document.documentElement, { attributeFilter: ['data-theme'] });
    return () => {
      cancelled = true;
      resize.disconnect();
      theme.disconnect();
    };
  }, [showInvalid]);
  return <canvas ref={canvasRef} role="img" aria-label={label} className={className} />;
}

/** Size of the specimen drawing, for a canvas that shows it whole. */
export const PLAN_SKETCH_SIZE = { width: WIDTH, height: HEIGHT } as const;
