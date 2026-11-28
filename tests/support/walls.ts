import { expect, type Locator, type Page } from '@playwright/test';
import { planElements, planView } from './locators';
import { type MmPoint, pageOfPlanPoint, readPlanView } from './plan-view';

/** "A few pixels off", in each direction, as in docs/api/walls.md. */
export const A_FEW_PIXELS = 3;

/** Tolerance of the comparisons of millimeter values read from the page (docs/api/walls.md). */
export const READ_TOLERANCE_MM = 0.01;

/** A plan point written in a step, e.g. `(1000 mm, -2000 mm)`, from the captured numbers. */
export function mmPoint(x: string, y: string): MmPoint {
  return { x: Number(x), y: Number(y) };
}

async function pagePositionOf(page: Page, point: MmPoint, near: boolean) {
  const target = pageOfPlanPoint(await readPlanView(page), point);
  const offset = near ? A_FEW_PIXELS : 0;
  return { x: target.x + offset, y: target.y + offset };
}

/** A left click on a plan point, or a few pixels off it when `near` is true. */
export async function clickPlan(page: Page, point: MmPoint, near = false): Promise<void> {
  const position = await pagePositionOf(page, point, near);
  await page.mouse.click(position.x, position.y);
}

/** A double-click on a plan point. */
export async function doubleClickPlan(page: Page, point: MmPoint): Promise<void> {
  const position = await pagePositionOf(page, point, false);
  await page.mouse.dblclick(position.x, position.y);
}

/** A right-click on a plan point. */
export async function rightClickPlan(page: Page, point: MmPoint): Promise<void> {
  const position = await pagePositionOf(page, point, false);
  await page.mouse.click(position.x, position.y, { button: 'right' });
}

/** Moves the cursor onto a plan point, or a few pixels off it when `near` is true. */
export async function movePointer(page: Page, point: MmPoint, near = false): Promise<void> {
  const position = await pagePositionOf(page, point, near);
  await page.mouse.move(position.x, position.y);
}

/** Draws one wall, as the Given of the scenarios does: W, click on the start, double-click on the end, V. */
export async function drawWall(page: Page, start: MmPoint, end: MmPoint): Promise<void> {
  await page.keyboard.press('w');
  await clickPlan(page, start);
  await doubleClickPlan(page, end);
  await page.keyboard.press('v');
}

/** The wall items of the plan elements list (docs/api/walls.md). */
export function wallItems(page: Page): Locator {
  return planElements(page).locator('[data-element="wall"]');
}

/** The anchor items of the plan elements list, shown while the Wall tool is active. */
export function anchorItems(page: Page): Locator {
  return planElements(page).locator('[data-element="anchor"]');
}

/** A number read from an attribute: a missing attribute is an error, never a zero. */
async function numberAttribute(item: Locator, attribute: string): Promise<number> {
  const value = await item.getAttribute(attribute);
  if (value === null) throw new Error(`The element has no ${attribute} attribute`);
  return Number(value);
}

/** Waits until a numeric attribute is within `tolerance` of `expected`. */
async function expectNumberAttribute(
  item: Locator,
  attribute: string,
  expected: number,
  tolerance: number,
): Promise<void> {
  await expect
    .poll(async () => Math.abs((await numberAttribute(item, attribute)) - expected))
    .toBeLessThanOrEqual(tolerance);
}

/**
 * Waits until the start and/or the end of a wall item are at the given plan points. Points are
 * compared within `tolerance` millimeters.
 */
export async function expectWallEnds(
  item: Locator,
  ends: { readonly start?: MmPoint; readonly end?: MmPoint },
  tolerance: number,
): Promise<void> {
  if (ends.start) {
    await expectNumberAttribute(item, 'data-start-x', ends.start.x, tolerance);
    await expectNumberAttribute(item, 'data-start-y', ends.start.y, tolerance);
  }
  if (ends.end) {
    await expectNumberAttribute(item, 'data-end-x', ends.end.x, tolerance);
    await expectNumberAttribute(item, 'data-end-y', ends.end.y, tolerance);
  }
}

/** An anchor item as read from the page. */
export interface AnchorReading extends MmPoint {
  readonly snapped: boolean;
}

/** The anchor items currently shown, in document order. */
export async function readAnchors(page: Page): Promise<AnchorReading[]> {
  return anchorItems(page).evaluateAll((items) =>
    items.map((item) => ({
      x: Number(item.getAttribute('data-x')),
      y: Number(item.getAttribute('data-y')),
      snapped: item.getAttribute('data-snapped') === 'true',
    })),
  );
}

/** True when two plan points are within `READ_TOLERANCE_MM` of each other on both axes. */
export function samePoint(a: MmPoint, b: MmPoint): boolean {
  return Math.abs(a.x - b.x) <= READ_TOLERANCE_MM && Math.abs(a.y - b.y) <= READ_TOLERANCE_MM;
}

/** Waits until the plan shows exactly these anchors, each at one of the given points. */
export async function expectAnchorsAt(page: Page, points: readonly MmPoint[]): Promise<void> {
  await expect.poll(async () => (await readAnchors(page)).length).toBe(points.length);
  const anchors = await readAnchors(page);
  for (const point of points) {
    expect(
      anchors.some((anchor) => samePoint(anchor, point)),
      `No anchor at (${point.x} mm, ${point.y} mm)`,
    ).toBe(true);
  }
}

/** Waits until the anchor at this point is marked as snapped. */
export async function expectAnchorSnapped(page: Page, point: MmPoint): Promise<void> {
  await expect
    .poll(async () =>
      (await readAnchors(page)).some((anchor) => anchor.snapped && samePoint(anchor, point)),
    )
    .toBe(true);
}

/** Waits until the plan shows a wall being drawn whose live length is `length` millimeters. */
export async function expectDrawingLength(page: Page, length: number): Promise<void> {
  const region = planView(page);
  await expect(region).toHaveAttribute('data-drawing', 'true');
  await expectNumberAttribute(region, 'data-drawing-length', length, READ_TOLERANCE_MM);
}

/** The joint items of the plan elements list (docs/api/walls.md). */
export function jointItems(page: Page): Locator {
  return planElements(page).locator('[data-element="joint"]');
}

/** A joint item as read from the page: its shared point and its polygon, in millimeters. */
export interface JointReading extends MmPoint {
  readonly points: readonly MmPoint[];
}

/** Parses the `data-points` attribute of a joint item: a JSON array of [x, y] pairs. */
function parseJointPoints(text: string): MmPoint[] {
  const value: unknown = JSON.parse(text);
  if (!Array.isArray(value)) throw new Error(`The joint points are not a list: ${text}`);
  return value.map((pair: unknown) => {
    if (!Array.isArray(pair) || typeof pair[0] !== 'number' || typeof pair[1] !== 'number') {
      throw new Error(`A joint point is not a pair of numbers: ${text}`);
    }
    return { x: pair[0], y: pair[1] };
  });
}

/** The joint items currently shown, in document order. */
export async function readJoints(page: Page): Promise<JointReading[]> {
  const raw = await jointItems(page).evaluateAll((items) =>
    items.map((item) => ({
      x: Number(item.getAttribute('data-x')),
      y: Number(item.getAttribute('data-y')),
      points: item.getAttribute('data-points') ?? '',
    })),
  );
  return raw.map((joint) => ({ x: joint.x, y: joint.y, points: parseJointPoints(joint.points) }));
}

/** True when two polygons have the same points, in the same order, within `READ_TOLERANCE_MM`. */
function samePolygon(actual: readonly MmPoint[], expected: readonly MmPoint[]): boolean {
  return (
    actual.length === expected.length &&
    expected.every((point, index) => {
      const candidate = actual[index];
      return candidate !== undefined && samePoint(candidate, point);
    })
  );
}

/** Waits until the plan shows a joint whose shared point is at this point. */
export async function expectJointAt(page: Page, point: MmPoint): Promise<void> {
  await expect
    .poll(async () => (await readJoints(page)).some((joint) => samePoint(joint, point)))
    .toBe(true);
}

/** Waits until the joint at this shared point covers exactly these points, in this order. */
export async function expectJointCovers(
  page: Page,
  point: MmPoint,
  expected: readonly MmPoint[],
): Promise<void> {
  await expect
    .poll(async () => {
      const joint = (await readJoints(page)).find((candidate) => samePoint(candidate, point));
      return joint !== undefined && samePolygon(joint.points, expected);
    })
    .toBe(true);
}

/** Waits until the plan shows no joint at all. */
export async function expectNoJoint(page: Page): Promise<void> {
  await expect(jointItems(page)).toHaveCount(0);
}
