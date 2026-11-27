import { lengthsEqual } from '@cabane3d/core';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { createPlanView, resizeView, screenToPlan, zoomView } from './view';

describe('resizeView', () => {
  it('keeps the plan point at the center of the view at the center, and the scale', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -20, max: 20 }),
        fc.integer({ min: 1, max: 4000 }),
        fc.integer({ min: 1, max: 3000 }),
        (notches, width, height) => {
          const before = zoomView(createPlanView(1000, 600), notches, { x: 700, y: 200 });
          const center = screenToPlan(before, { x: 500, y: 300 });

          const after = resizeView(before, width, height);

          const newCenter = screenToPlan(after, { x: width / 2, y: height / 2 });
          expect(after.scale).toBe(before.scale);
          expect(after.width).toBe(width);
          expect(after.height).toBe(height);
          expect(lengthsEqual(newCenter.x, center.x)).toBe(true);
          expect(lengthsEqual(newCenter.y, center.y)).toBe(true);
        },
      ),
    );
  });
});
