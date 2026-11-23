import type { Meta, StoryObj } from '@storybook/react-vite';
import { Armchair, BrickWall, DoorOpen, MousePointer2, Ruler, Square, Type } from 'lucide-react';
import { useState } from 'react';
import { SegmentedControl, SegmentedControlItem } from './segmented-control';
import { ToolButton, Toolbar, ToolbarSeparator } from './toolbar';

export default { title: 'Components / Tool bar' } satisfies Meta;

const TOOLS = [
  { id: 'select', label: 'Select tool', shortcut: 'V', icon: <MousePointer2 /> },
  { id: 'wall', label: 'Wall tool', shortcut: 'W', icon: <BrickWall /> },
  { id: 'room', label: 'Room tool', shortcut: 'R', icon: <Square /> },
  { id: 'opening', label: 'Opening tool', shortcut: 'O', icon: <DoorOpen /> },
  { id: 'dimension', label: 'Dimension tool', shortcut: 'D', icon: <Ruler /> },
  { id: 'label', label: 'Label tool', shortcut: 'T', icon: <Type /> },
] as const;

const ToolBarDemo = () => {
  const [active, setActive] = useState<string>('wall');
  return (
    <div className="inline-flex rounded-xl border bg-popover p-1 shadow-popover">
      <Toolbar aria-label="Tool bar">
        {TOOLS.map((tool) => (
          <ToolButton
            key={tool.id}
            label={tool.label}
            shortcut={tool.shortcut}
            icon={tool.icon}
            active={active === tool.id}
            onClick={() => setActive(tool.id)}
          />
        ))}
        <ToolbarSeparator />
        <ToolButton label="Catalog" icon={<Armchair />} active={false} />
      </Toolbar>
    </div>
  );
};

const ViewSwitcherDemo = () => (
  <SegmentedControl aria-label="View switcher" defaultValue="2d">
    <SegmentedControlItem value="2d">2D</SegmentedControlItem>
    <SegmentedControlItem value="3d">3D</SegmentedControlItem>
  </SegmentedControl>
);

export const ToolBar: StoryObj = { render: () => <ToolBarDemo /> };
export const ViewSwitcher: StoryObj = { render: () => <ViewSwitcherDemo /> };
