/**
 * The `Plan elements` list (docs/api/walls.md): a visually hidden list that describes what the
 * canvas shows, for screen readers and tests. The renderer writes its items straight to the DOM,
 * like the view attributes: whether an anchor is snapped changes at every pointer move.
 */
import { lengthsEqual, type Point, type Wall } from '@cabane3d/core';
import type { PlanJoint } from './joints';

/** A length as shown in the description: whole millimeters, the display unit. */
function shown(value: number): string {
  // `${-0}` is "0", so a value rounded from just below zero shows as 0.
  return `${Math.round(value)} mm`;
}

function describePoint(point: Point): string {
  return `(${shown(point.x)}, ${shown(point.y)})`;
}

function wallItem(wall: Wall): HTMLLIElement {
  const item = document.createElement('li');
  Object.assign(item.dataset, {
    element: 'wall',
    wallId: wall.id,
    startX: String(wall.start.x),
    startY: String(wall.start.y),
    endX: String(wall.end.x),
    endY: String(wall.end.y),
    thickness: String(wall.thickness),
    height: String(wall.height),
    selected: 'false',
  });
  item.textContent = `Wall from ${describePoint(wall.start)} to ${describePoint(wall.end)}`;
  return item;
}

function anchorItem(anchor: Point): HTMLLIElement {
  const item = document.createElement('li');
  Object.assign(item.dataset, {
    element: 'anchor',
    x: String(anchor.x),
    y: String(anchor.y),
    snapped: 'false',
  });
  item.textContent = `Anchor at ${describePoint(anchor)}`;
  return item;
}

function isAt(anchor: Point, point: Point | null): boolean {
  return point !== null && lengthsEqual(anchor.x, point.x) && lengthsEqual(anchor.y, point.y);
}

/** A joint: its shared point and its polygon, as JSON `[[x, y], …]`, in millimeters. */
function jointItem(joint: PlanJoint): HTMLLIElement {
  const item = document.createElement('li');
  Object.assign(item.dataset, {
    element: 'joint',
    x: String(joint.at.x),
    y: String(joint.at.y),
    points: JSON.stringify(joint.points.map((point) => [point.x, point.y])),
  });
  item.textContent = `Joint at ${describePoint(joint.at)}`;
  return item;
}

/**
 * Writes the items of the list: the walls, in creation order, then the joints, in the order of
 * `jointsOf`, then the anchors.
 */
export function showPlanElements(
  list: HTMLElement,
  walls: readonly Wall[],
  joints: readonly PlanJoint[],
  anchors: readonly Point[],
  snapped: Point | null,
): void {
  list.replaceChildren(
    ...walls.map(wallItem),
    ...joints.map(jointItem),
    ...anchors.map(anchorItem),
  );
  markSnappedAnchor(list, anchors, snapped);
}

/** Marks the anchor items: `data-snapped="true"` on the one at `snapped`, `"false"` on the others. */
export function markSnappedAnchor(
  list: HTMLElement,
  anchors: readonly Point[],
  snapped: Point | null,
): void {
  const items = list.querySelectorAll<HTMLElement>('[data-element="anchor"]');
  items.forEach((item, index) => {
    const anchor = anchors[index];
    const value = anchor && isAt(anchor, snapped) ? 'true' : 'false';
    if (item.dataset.snapped !== value) item.dataset.snapped = value;
  });
}
