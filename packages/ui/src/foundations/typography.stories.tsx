import type { Meta, StoryObj } from '@storybook/react-vite';

export default { title: 'Foundations / Typography' } satisfies Meta;

const SCALE = [
  { className: 'text-2xl', name: 'text-2xl', size: '28 / 36', use: 'Welcome screen title' },
  { className: 'text-xl', name: 'text-xl', size: '20 / 28', use: 'Empty states' },
  { className: 'text-lg', name: 'text-lg', size: '15 / 22', use: 'Panel and dialog titles' },
  { className: 'text-base', name: 'text-base', size: '13 / 20', use: 'Default' },
  { className: 'text-sm', name: 'text-sm', size: '12 / 16', use: 'Labels, status bar, tooltips' },
] as const;

const ScaleDemo = () => (
  <table className="border-collapse">
    <tbody>
      {SCALE.map((step) => (
        <tr key={step.name} className="border-b">
          <td className="py-2 pr-6 align-baseline">
            <code className="text-muted-foreground text-sm">{step.name}</code>
          </td>
          <td className="py-2 pr-6 align-baseline text-muted-foreground text-sm tabular-nums">
            {step.size} px
          </td>
          <td className={`py-2 pr-6 align-baseline ${step.className}`}>Living room, 3500 mm</td>
          <td className="py-2 align-baseline text-muted-foreground text-sm">{step.use}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

const WeightsDemo = () => (
  <div className="flex flex-col gap-2 text-lg">
    <p className="font-normal">Regular 400: the interface text</p>
    <p className="font-semibold">Semibold 600: titles, selected items, primary buttons</p>
  </div>
);

const TabularFiguresDemo = () => (
  <div className="flex flex-col gap-1 text-lg">
    <p className="tabular-nums">x 1250 mm · y 830 mm · zoom 100%</p>
    <p className="tabular-nums">x 1111 mm · y 7777 mm · zoom 125%</p>
  </div>
);

/** Architects Daughter, for labels and room names in the plan only. */
const PlanHandwritingDemo = () => (
  <div className="flex flex-col gap-2 bg-plan-paper p-6 text-plan-ink">
    <p className="font-plan" style={{ fontSize: 'var(--plan-text-room)' }}>
      Living room
    </p>
    <p className="font-plan" style={{ fontSize: 'var(--plan-text-label)' }}>
      Load-bearing wall, keep the existing beam. Éléments déjà posés : àâçéèêëîïôûü
    </p>
    <p className="tabular-nums" style={{ fontSize: 'var(--plan-text-dimension)' }}>
      3500 · 12.4 m²
    </p>
  </div>
);

export const Scale: StoryObj = { render: () => <ScaleDemo /> };
export const Weights: StoryObj = { render: () => <WeightsDemo /> };
export const TabularFigures: StoryObj = { render: () => <TabularFiguresDemo /> };
export const PlanHandwriting: StoryObj = { render: () => <PlanHandwritingDemo /> };
