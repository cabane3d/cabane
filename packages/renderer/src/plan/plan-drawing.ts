/**
 * Drawing the plan on a Canvas 2D context, in CSS pixels (docs/design/plan-drawing.md): the
 * geometry follows the view, the pen (line widths, marks, text) stays constant on screen. Colors,
 * widths, sizes and fonts come from the plan tokens only.
 */
import { LENGTH_TOLERANCE, type Mm, mm, type Point, type Wall } from '@cabane3d/core';
import type { PlanTokens } from './tokens';
import { type PlanView, planToScreen, type ScreenPoint } from './view';

/** What the plan shows, besides the view. */
export interface PlanPicture {
  readonly walls: readonly Wall[];
  /** The anchors, shown while the Wall tool is active; empty otherwise. */
  readonly anchors: readonly Point[];
  /** The anchor the point being placed snaps to, marked with a cross. */
  readonly snapped: Point | null;
  /** The wall being drawn, from the current point of the chain to the point being placed. */
  readonly drawing: {
    readonly start: Point;
    readonly end: Point;
    readonly thickness: Mm;
  } | null;
}

/** The four corners of a wall footprint, `thickness` to the right of `start → end`. */
function footprint(start: Point, end: Point, thickness: number): readonly Point[] {
  const length = Math.hypot(end.x - start.x, end.y - start.y);
  const right = { x: (end.y - start.y) / length, y: -(end.x - start.x) / length };
  const moved = (point: Point): Point => ({
    x: mm(point.x + right.x * thickness),
    y: mm(point.y + right.y * thickness),
  });
  return [start, end, moved(end), moved(start)];
}

/** A wall: filled solid (poché), its edges in the medium pen. */
function drawFootprint(
  context: CanvasRenderingContext2D,
  view: PlanView,
  tokens: PlanTokens,
  corners: readonly Point[],
): void {
  context.beginPath();
  for (const corner of corners) {
    const screen = planToScreen(view, corner);
    context.lineTo(screen.x, screen.y);
  }
  context.closePath();
  context.fillStyle = tokens.wall;
  context.fill();
  context.lineWidth = tokens.strokeMedium;
  context.lineJoin = 'miter';
  context.strokeStyle = tokens.wall;
  context.stroke();
}

/**
 * The live length of the wall being drawn, in the dimension style: a fine line on the side away
 * from the thickness, 45° ticks at both ends, extension lines, the value centered above the line
 * and always readable from the bottom or the right.
 */
function drawDimension(
  context: CanvasRenderingContext2D,
  view: PlanView,
  tokens: PlanTokens,
  start: Point,
  end: Point,
): void {
  const a = planToScreen(view, start);
  const b = planToScreen(view, end);
  const length = Math.hypot(b.x - a.x, b.y - a.y);
  if (length === 0) return;
  const along = { x: (b.x - a.x) / length, y: (b.y - a.y) / length };
  // On screen (Y down), the left of the drawing direction, away from the thickness.
  const away = { x: along.y, y: -along.x };
  // The dimension line stands two ticks away from the wall face.
  const offset = tokens.tickSize * 2;
  const shift = (point: ScreenPoint, distance: number): ScreenPoint => ({
    x: point.x + away.x * distance,
    y: point.y + away.y * distance,
  });
  const lineStart = shift(a, offset);
  const lineEnd = shift(b, offset);

  context.beginPath();
  for (const point of [a, b]) {
    const from = shift(point, tokens.extensionGap);
    const to = shift(point, offset + tokens.extensionOvershoot);
    context.moveTo(from.x, from.y);
    context.lineTo(to.x, to.y);
  }
  context.moveTo(lineStart.x, lineStart.y);
  context.lineTo(lineEnd.x, lineEnd.y);
  const half = tokens.tickSize / 2 / Math.SQRT2;
  const tick = { x: (along.x + away.x) * half, y: (along.y + away.y) * half };
  for (const point of [lineStart, lineEnd]) {
    context.moveTo(point.x - tick.x, point.y - tick.y);
    context.lineTo(point.x + tick.x, point.y + tick.y);
  }
  context.lineWidth = tokens.strokeFine;
  context.strokeStyle = tokens.ink;
  context.stroke();

  // Readable from the bottom or the right: the text never points left.
  let angle = Math.atan2(along.y, along.x);
  // Vertical text reads from the right: bottom to top.
  if (angle >= Math.PI / 2) angle -= Math.PI;
  if (angle < -Math.PI / 2) angle += Math.PI;
  // "Above" the text, in its own frame, on screen.
  const textUp = { x: Math.sin(angle), y: -Math.cos(angle) };
  const outward = textUp.x * away.x + textUp.y * away.y > 0;
  const middle = shift(
    { x: (lineStart.x + lineEnd.x) / 2, y: (lineStart.y + lineEnd.y) / 2 },
    tokens.extensionGap,
  );
  context.save();
  context.translate(middle.x, middle.y);
  context.rotate(angle);
  context.font = tokens.dimensionFont;
  context.fillStyle = tokens.ink;
  context.textAlign = 'center';
  context.textBaseline = outward ? 'bottom' : 'top';
  context.fillText(String(Math.round(Math.hypot(end.x - start.x, end.y - start.y))), 0, 0);
  context.restore();
}

/** An anchor: a small round mark, so it never reads as a selection handle (square). */
function drawAnchor(
  context: CanvasRenderingContext2D,
  view: PlanView,
  tokens: PlanTokens,
  anchor: Point,
): void {
  const screen = planToScreen(view, anchor);
  context.beginPath();
  // As wide as a selection handle, but round.
  context.arc(screen.x, screen.y, tokens.handleSize / 2, 0, Math.PI * 2);
  context.fillStyle = tokens.paper;
  context.fill();
  context.lineWidth = tokens.strokeFine;
  context.strokeStyle = tokens.guide;
  context.stroke();
}

/** The snapped point: a small cross of `--plan-tick-size`. */
function drawSnapCross(
  context: CanvasRenderingContext2D,
  view: PlanView,
  tokens: PlanTokens,
  point: Point,
): void {
  const screen = planToScreen(view, point);
  const half = tokens.tickSize / 2;
  context.beginPath();
  context.moveTo(screen.x - half, screen.y - half);
  context.lineTo(screen.x + half, screen.y + half);
  context.moveTo(screen.x - half, screen.y + half);
  context.lineTo(screen.x + half, screen.y - half);
  context.lineWidth = tokens.strokeMedium;
  context.strokeStyle = tokens.selection;
  context.stroke();
}

/** Draws the whole plan. The context is cleared first; one unit is one CSS pixel. */
export function drawPlan(
  context: CanvasRenderingContext2D,
  view: PlanView,
  tokens: PlanTokens,
  picture: PlanPicture,
): void {
  // The paper is the region's background.
  context.clearRect(0, 0, view.width, view.height);
  for (const wall of picture.walls) drawFootprint(context, view, tokens, wall.corners);
  const { drawing } = picture;
  if (
    drawing &&
    Math.hypot(drawing.end.x - drawing.start.x, drawing.end.y - drawing.start.y) >= LENGTH_TOLERANCE
  ) {
    drawFootprint(context, view, tokens, footprint(drawing.start, drawing.end, drawing.thickness));
    drawDimension(context, view, tokens, drawing.start, drawing.end);
  }
  for (const anchor of picture.anchors) drawAnchor(context, view, tokens, anchor);
  if (picture.snapped) drawSnapCross(context, view, tokens, picture.snapped);
}
