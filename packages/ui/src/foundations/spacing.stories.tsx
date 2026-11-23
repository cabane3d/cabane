import type { Meta, StoryObj } from '@storybook/react-vite';

export default { title: 'Foundations / Spacing and sizes' } satisfies Meta;

const SPACING = [
  ['0.5', 'w-0.5', '2'],
  ['1', 'w-1', '4'],
  ['1.5', 'w-1.5', '6'],
  ['2', 'w-2', '8'],
  ['3', 'w-3', '12'],
  ['4', 'w-4', '16'],
  ['6', 'w-6', '24'],
  ['8', 'w-8', '32'],
  ['12', 'w-12', '48'],
] as const;

const SIZES = [
  ['icon', 'w-icon', '16', 'Icons in controls'],
  ['icon-lg', 'w-icon-lg', '20', 'Tool bar icons'],
  ['control-sm', 'w-control-sm', '24', 'Small controls'],
  ['control', 'w-control', '28', 'Default control height'],
  ['bar', 'w-bar', '40', 'Top bar height, tool bar width'],
  ['panel', 'w-panel', '256', 'Properties panel'],
  ['drawer', 'w-drawer', '320', 'Catalog drawer'],
  ['dialog', 'w-dialog', '480', 'Dialogs'],
] as const;

function Row({ name, bar, px, use }: { name: string; bar: string; px: string; use?: string }) {
  return (
    <tr>
      <td className="py-1 pr-4">
        <code>{name}</code>
      </td>
      <td className="py-1 pr-4 text-right text-muted-foreground tabular-nums">{px} px</td>
      <td className="py-1 pr-4">
        <div className={`h-3 rounded-sm bg-primary ${bar}`} />
      </td>
      <td className="py-1 text-muted-foreground text-sm">{use}</td>
    </tr>
  );
}

const SpacingDemo = () => (
  <table>
    <tbody>
      {SPACING.map(([name, bar, px]) => (
        <Row key={name} name={name} bar={bar} px={px} />
      ))}
    </tbody>
  </table>
);

const NamedSizesDemo = () => (
  <table>
    <tbody>
      {SIZES.map(([name, bar, px, use]) => (
        <Row key={name} name={name} bar={bar} px={px} use={use} />
      ))}
    </tbody>
  </table>
);

export const Spacing: StoryObj = { render: () => <SpacingDemo /> };
export const NamedSizes: StoryObj = { render: () => <NamedSizesDemo /> };
