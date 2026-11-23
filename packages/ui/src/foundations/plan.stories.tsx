import type { Meta, StoryObj } from '@storybook/react-vite';
import { PLAN_SKETCH_SIZE, PlanSketch } from './plan-sketch';

export default { title: 'Foundations / Plan drawing' } satisfies Meta;

const SpecimenDemo = () => (
  <div className="flex flex-col gap-3">
    <div className="border" style={PLAN_SKETCH_SIZE}>
      <PlanSketch
        label="Specimen of the plan drawing conventions"
        showInvalid
        className="block size-full"
      />
    </div>
    <p className="text-muted-foreground text-sm">
      Poché walls · door and window · 45° dimension ticks · hover halo (left wall) · selection with
      handles (right wall) · dashed snapping guide · invalid cross-hatching · Architects Daughter
      labels.
    </p>
  </div>
);

export const Specimen: StoryObj = { render: () => <SpecimenDemo /> };
