import type { Meta, StoryObj } from '@storybook/react-vite';
import { BrickWall, MousePointer2, Square } from 'lucide-react';
import { useId, useState } from 'react';
import { Button } from '../components/button';
import { Checkbox } from '../components/checkbox';
import { Input } from '../components/input';
import { Label } from '../components/label';
import { ScrollArea } from '../components/scroll-area';
import { SegmentedControl, SegmentedControlItem } from '../components/segmented-control';
import { Switch } from '../components/switch';
import { Tabs, TabsList, TabsTrigger } from '../components/tabs';
import { ToolButton, Toolbar } from '../components/toolbar';

export default { title: 'Foundations / Accessibility' } satisfies Meta;

const TOOLS = [
  { id: 'select', label: 'Select tool', icon: <MousePointer2 /> },
  { id: 'wall', label: 'Wall tool', icon: <BrickWall /> },
  { id: 'room', label: 'Room tool', icon: <Square /> },
] as const;

const ROOMS = ['Living room', 'Kitchen', 'Bedroom', 'Bathroom', 'Hall', 'Garage'] as const;

/**
 * Every control that shows a state with a fill. Open it with the browser's forced colors
 * emulation (DevTools > Rendering > "Emulate CSS media feature forced-colors: active") or with
 * `prefers-contrast: more`, in the light and dark themes (ADR-0024). Each on or selected state
 * must stay visible without its background, and Tab must still show where the focus is.
 */
const StatesDemo = () => {
  const [tool, setTool] = useState<string>('wall');
  const id = useId();
  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2">
        <h2 className="font-semibold text-lg">Active tool</h2>
        <Toolbar
          aria-label="Tool bar"
          orientation="horizontal"
          className="self-start rounded-xl border border-popover-border bg-popover p-1 shadow-popover"
        >
          {TOOLS.map((item) => (
            <ToolButton
              key={item.id}
              label={item.label}
              icon={item.icon}
              active={tool === item.id}
              onClick={() => setTool(item.id)}
            />
          ))}
        </Toolbar>
      </section>
      <section className="flex flex-col gap-2">
        <h2 className="font-semibold text-lg">Tabs and segmented control</h2>
        <Tabs defaultValue="ground">
          <TabsList aria-label="Level tabs">
            <TabsTrigger value="ground">Ground floor</TabsTrigger>
            <TabsTrigger value="first">First floor</TabsTrigger>
          </TabsList>
        </Tabs>
        <SegmentedControl aria-label="View switcher" defaultValue="2d">
          <SegmentedControlItem value="2d">2D</SegmentedControlItem>
          <SegmentedControlItem value="3d">3D</SegmentedControlItem>
        </SegmentedControl>
      </section>
      <section className="flex flex-col gap-2">
        <h2 className="font-semibold text-lg">Switch and checkbox</h2>
        <div className="flex items-center gap-2">
          <Switch id={`${id}-snap`} defaultChecked />
          <Label htmlFor={`${id}-snap`} className="text-base text-foreground">
            Snap
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id={`${id}-dimensions`} defaultChecked />
          <Label htmlFor={`${id}-dimensions`} className="text-base text-foreground">
            Show dimensions
          </Label>
        </div>
      </section>
      <section className="flex flex-col gap-2">
        <h2 className="font-semibold text-lg">Field, button and scroll thumb</h2>
        <div className="flex items-center gap-2">
          <Input aria-label="Wall name" defaultValue="North wall" className="w-panel" />
          <Button variant="primary">Apply</Button>
        </div>
        <ScrollArea className="h-12 w-panel rounded-md border">
          <div className="flex flex-col gap-1 p-2">
            {ROOMS.map((room) => (
              <span key={room}>{room}</span>
            ))}
          </div>
        </ScrollArea>
      </section>
    </div>
  );
};

/** Controls at the default text scale. */
export const States: StoryObj = { render: () => <StatesDemo /> };

/**
 * The same controls with the OS text scale at 200% (ADR-0023): the root font size doubles, so the
 * controls grow with their text and nothing is clipped. The "Text scale" toolbar changes it for
 * any story.
 */
export const LargeText: StoryObj = {
  render: () => <StatesDemo />,
  globals: { textScale: '200' },
};
