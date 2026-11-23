import type { Meta, StoryObj } from '@storybook/react-vite';
import { Copy, FilePlus, FolderOpen, Menu, Save, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from './button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from './context-menu';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from './dropdown-menu';

export default { title: 'Components / Menus' } satisfies Meta;

const MainMenuDemo = () => {
  const [dimensions, setDimensions] = useState(true);
  const [units, setUnits] = useState('mm');
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost">
          <Menu aria-hidden="true" />
          Menu
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem shortcut="Ctrl+N">
          <FilePlus aria-hidden="true" />
          New project
        </DropdownMenuItem>
        <DropdownMenuItem shortcut="Ctrl+O">
          <FolderOpen aria-hidden="true" />
          Open…
        </DropdownMenuItem>
        <DropdownMenuItem shortcut="Ctrl+S">
          <Save aria-hidden="true" />
          Save
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Import</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem>Sweet Home 3D project…</DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>View</DropdownMenuLabel>
        <DropdownMenuCheckboxItem checked={dimensions} onCheckedChange={setDimensions}>
          Show dimensions
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Display units</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={units} onValueChange={setUnits}>
          <DropdownMenuRadioItem value="mm">Millimeters</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="cm">Centimeters</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="m">Meters</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>Export (later)</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const PlanContextMenuDemo = () => (
  <ContextMenu>
    <ContextMenuTrigger className="flex h-bar w-dialog items-center justify-center rounded-lg border border-dashed bg-plan-paper text-muted-foreground">
      Right click here
    </ContextMenuTrigger>
    <ContextMenuContent>
      <ContextMenuItem shortcut="Ctrl+D">
        <Copy aria-hidden="true" />
        Duplicate
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem shortcut="Delete" destructive>
        <Trash2 aria-hidden="true" />
        Delete
      </ContextMenuItem>
    </ContextMenuContent>
  </ContextMenu>
);

export const MainMenu: StoryObj = { render: () => <MainMenuDemo /> };
export const PlanContextMenu: StoryObj = { render: () => <PlanContextMenuDemo /> };
