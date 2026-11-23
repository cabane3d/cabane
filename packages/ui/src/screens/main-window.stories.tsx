import { type Mm, mm } from '@cabane3d/core';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Armchair,
  ArrowLeft,
  BrickWall,
  ChevronRight,
  DoorOpen,
  Menu,
  MousePointer2,
  Plus,
  Redo2,
  Ruler,
  Square,
  Trash2,
  Type,
  Undo2,
} from 'lucide-react';
import { type ReactNode, useEffect, useId, useRef, useState } from 'react';
import { Button } from '../components/button';
import { ConfirmDialog } from '../components/confirm-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/dropdown-menu';
import { IconButton } from '../components/icon-button';
import { Input } from '../components/input';
import { Label } from '../components/label';
import { NumericField } from '../components/numeric-field';
import { ScrollArea } from '../components/scroll-area';
import { SegmentedControl, SegmentedControlItem } from '../components/segmented-control';
import { Separator } from '../components/separator';
import { Switch } from '../components/switch';
import { Tabs, TabsList, TabsTrigger } from '../components/tabs';
import { ToolButton, Toolbar, ToolbarSeparator } from '../components/toolbar';
import { PlanSketch } from '../foundations/plan-sketch';

/**
 * The main window assembled from the components, with the zones and names of
 * docs/design/main-window.md. It is a design reference, not the application: nothing here is
 * connected to a project.
 */
export default {
  title: 'Screens / Main window',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

const TOOLS = [
  { id: 'select', label: 'Select tool', shortcut: 'V', icon: <MousePointer2 /> },
  { id: 'wall', label: 'Wall tool', shortcut: 'W', icon: <BrickWall /> },
  { id: 'room', label: 'Room tool', shortcut: 'R', icon: <Square /> },
  { id: 'opening', label: 'Opening tool', shortcut: 'O', icon: <DoorOpen /> },
  { id: 'dimension', label: 'Dimension tool', shortcut: 'D', icon: <Ruler /> },
  { id: 'label', label: 'Label tool', shortcut: 'T', icon: <Type /> },
] as const;

type Item = readonly [name: string, size: string];

/** Catalog content: each category with a few pieces of furniture and their footprint in mm. */
const CATEGORIES: readonly { id: string; name: string; items: readonly Item[] }[] = [
  {
    id: 'living-room',
    name: 'Living room',
    items: [
      ['Sofa', '2100 × 950'],
      ['Armchair', '850 × 850'],
      ['Coffee table', '1200 × 600'],
      ['TV stand', '1600 × 400'],
      ['Bookcase', '800 × 350'],
    ],
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    items: [
      ['Base cabinet', '600 × 600'],
      ['Sink unit', '1200 × 600'],
      ['Refrigerator', '600 × 650'],
      ['Dining table', '1600 × 900'],
    ],
  },
  {
    id: 'bedroom',
    name: 'Bedroom',
    items: [
      ['Double bed', '1600 × 2000'],
      ['Single bed', '900 × 2000'],
      ['Wardrobe', '1500 × 600'],
      ['Bedside table', '450 × 400'],
    ],
  },
  {
    id: 'bathroom',
    name: 'Bathroom',
    items: [
      ['Bathtub', '1700 × 750'],
      ['Shower', '900 × 900'],
      ['Washbasin', '600 × 450'],
      ['Toilet', '380 × 650'],
    ],
  },
  {
    id: 'openings',
    name: 'Doors, windows',
    items: [
      ['Door', '830 × 2040'],
      ['Window', '1200 × 1350'],
      ['French window', '1400 × 2150'],
    ],
  },
  {
    id: 'office',
    name: 'Office',
    items: [
      ['Desk', '1400 × 700'],
      ['Office chair', '650 × 650'],
    ],
  },
  {
    id: 'garden',
    name: 'Garden',
    items: [
      ['Garden table', '1800 × 900'],
      ['Deck chair', '700 × 1900'],
    ],
  },
  {
    id: 'lighting',
    name: 'Lighting',
    items: [
      ['Floor lamp', '350 × 350'],
      ['Pendant light', '400 × 400'],
    ],
  },
];

type Category = (typeof CATEGORIES)[number];

function matches(name: string, query: string) {
  return name.toLowerCase().includes(query.trim().toLowerCase());
}

function TopBar({ view, onViewChange }: { view: string; onViewChange: (view: string) => void }) {
  return (
    // A <header> inside a <div> has no landmark role of its own: it is given explicitly, with the
    // glossary name.
    // biome-ignore lint/a11y/noInteractiveElementToNoninteractiveRole: a <header> is not interactive.
    <header
      role="banner"
      aria-label="Top bar"
      className="flex h-bar shrink-0 items-center gap-1 border-b bg-background px-1.5"
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <IconButton label="Menu" icon={<Menu />} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem shortcut="Ctrl+N">New project</DropdownMenuItem>
          <DropdownMenuItem shortcut="Ctrl+O">Open…</DropdownMenuItem>
          <DropdownMenuItem shortcut="Ctrl+S">Save</DropdownMenuItem>
          <DropdownMenuItem shortcut="Ctrl+Shift+S">Save as…</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Import…</DropdownMenuItem>
          <DropdownMenuItem>Export…</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Preferences</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <span className="px-2 font-semibold">Untitled</span>
      <Separator orientation="vertical" className="mx-1 h-icon" />
      <IconButton label="Undo" shortcut="Ctrl+Z" icon={<Undo2 />} />
      <IconButton label="Redo" shortcut="Ctrl+Y" icon={<Redo2 />} disabled />
      <div className="flex-1" />
      <SegmentedControl aria-label="View switcher" value={view} onValueChange={onViewChange}>
        <SegmentedControlItem value="2d">2D</SegmentedControlItem>
        <SegmentedControlItem value="3d">3D</SegmentedControlItem>
      </SegmentedControl>
    </header>
  );
}

/** Header shared by the docked panels (Catalog, Properties): a muted title on a bar-high strip. */
function PanelHeader({ children }: { children: string }) {
  return (
    <>
      <div className="flex h-bar shrink-0 items-center px-3">
        <h2 className="truncate font-semibold text-muted-foreground">{children}</h2>
      </div>
      <Separator />
    </>
  );
}

function ItemList({ items }: { items: readonly Item[] }) {
  return (
    <ul className="flex flex-col">
      {items.map(([name, size]) => (
        <li key={name}>
          <Button variant="ghost" className="w-full justify-start">
            <Armchair className="text-muted-foreground" />
            <span className="flex-1 truncate text-left">{name}</span>
            <span className="text-muted-foreground text-sm tabular-nums">{size}</span>
          </Button>
        </li>
      ))}
    </ul>
  );
}

function NoResults() {
  return <p className="px-2 py-1 text-muted-foreground">No furniture matches this search.</p>;
}

/**
 * The Catalog, docked between the tool bar and the plan view like Properties. It lists the
 * categories; a category shows its furniture, with a small back arrow just above the first item.
 * The search filters what is shown: the furniture of every category, or of the open one.
 */
function Catalog() {
  const [category, setCategory] = useState<Category | null>(null);
  const [query, setQuery] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const returnTo = useRef<string | null>(null);

  // The list is replaced under the keyboard focus: keep it on the back arrow when a category
  // opens, and on that category again when the user comes back.
  useEffect(() => {
    if (category) {
      backRef.current?.focus();
    } else if (returnTo.current) {
      listRef.current
        ?.querySelector<HTMLButtonElement>(`[data-category="${returnTo.current}"]`)
        ?.focus();
      returnTo.current = null;
    }
  }, [category]);

  const open = (next: Category) => {
    setQuery('');
    setCategory(next);
  };
  const back = () => {
    returnTo.current = category?.id ?? null;
    setQuery('');
    setCategory(null);
  };

  let content: ReactNode;
  if (category) {
    const items = category.items.filter(([name]) => matches(name, query));
    content = (
      <>
        <IconButton
          ref={backRef}
          label="Back to categories"
          icon={<ArrowLeft />}
          size="sm"
          tooltipSide="right"
          className="mb-0.5 ml-1"
          onClick={back}
        />
        {items.length > 0 ? <ItemList items={items} /> : <NoResults />}
      </>
    );
  } else if (query.trim() !== '') {
    const items = CATEGORIES.flatMap((c) => c.items).filter(([name]) => matches(name, query));
    content = items.length > 0 ? <ItemList items={items} /> : <NoResults />;
  } else {
    content = (
      <ul className="flex flex-col">
        {CATEGORIES.map((c) => (
          <li key={c.id}>
            <Button
              variant="ghost"
              data-category={c.id}
              className="w-full justify-start"
              onClick={() => open(c)}
            >
              <span className="flex-1 text-left">{c.name}</span>
              <ChevronRight className="text-muted-foreground" />
            </Button>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <aside aria-label="Catalog" className="flex w-panel shrink-0 flex-col border-r bg-background">
      <PanelHeader>{category ? `Catalog – ${category.name}` : 'Catalog'}</PanelHeader>
      <div className="p-3 pb-2">
        <Input
          type="search"
          aria-label="Search the catalog"
          placeholder="Search…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div ref={listRef} className="p-1">
          {content}
        </div>
      </ScrollArea>
    </aside>
  );
}

function LengthRow({ label, initial }: { label: string; initial: number }) {
  const id = useId();
  const [value, setValue] = useState<Mm>(mm(initial));
  return (
    <div className="grid grid-cols-3 items-start gap-2">
      <Label htmlFor={id} className="pt-1">
        {label}
      </Label>
      <NumericField
        id={id}
        className="col-span-2"
        value={value}
        unit="mm"
        max={mm(100_000)}
        onCommit={setValue}
        invalidMessage="Enter a length, e.g. 3500 or 3.5 m"
        nonPositiveMessage="Must be greater than 0"
        outOfRangeMessage="At most 100 m"
      />
    </div>
  );
}

function Properties() {
  const [confirming, setConfirming] = useState(false);
  return (
    <aside
      aria-label="Properties"
      className="flex w-panel shrink-0 flex-col border-l bg-background"
    >
      <PanelHeader>Properties</PanelHeader>
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-4 p-3">
          <section aria-labelledby="selected-wall" className="flex flex-col gap-2">
            <h3 id="selected-wall" className="font-semibold text-lg">
              Wall
            </h3>
            <LengthRow label="Length" initial={2400} />
            <LengthRow label="Thickness" initial={200} />
            <LengthRow label="Height" initial={2500} />
          </section>
          <Separator />
          <Button variant="destructive" className="self-start" onClick={() => setConfirming(true)}>
            <Trash2 />
            Delete wall
          </Button>
        </div>
      </ScrollArea>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title="Delete this wall?"
        description="Its doors and windows are deleted with it. You can undo it."
        confirmLabel="Delete"
        cancelLabel="Keep"
        closeLabel="Close"
        onConfirm={() => {}}
      />
    </aside>
  );
}

function LevelTabs() {
  return (
    <Tabs
      defaultValue="0"
      className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full border border-popover-border bg-popover p-0.5 shadow-popover"
    >
      <TabsList aria-label="Level tabs">
        <TabsTrigger value="0">Level 0</TabsTrigger>
        <TabsTrigger value="1">Level 1</TabsTrigger>
      </TabsList>
      <IconButton label="Add level" icon={<Plus />} className="rounded-full" tooltipSide="top" />
    </Tabs>
  );
}

function StatusBar() {
  const snapId = useId();
  return (
    <footer
      role="contentinfo"
      aria-label="Status bar"
      className="flex h-control shrink-0 items-center gap-4 border-t bg-background px-3 text-muted-foreground text-sm tabular-nums"
    >
      <span>x 1250 mm · y 830 mm</span>
      <span className="flex items-center gap-1.5">
        <Switch id={snapId} defaultChecked />
        <Label htmlFor={snapId} className="text-sm">
          Snap
        </Label>
      </span>
      <div className="flex-1" />
      <span>Units: mm</span>
      <span>Zoom 100%</span>
    </footer>
  );
}

function MainWindow({ catalogOpen = false }: { catalogOpen?: boolean }) {
  const [tool, setTool] = useState<string>('select');
  const [view, setView] = useState('2d');
  const [catalog, setCatalog] = useState(catalogOpen);
  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <TopBar view={view} onViewChange={setView} />
      <div className="flex min-h-0 flex-1">
        <div className="flex w-bar shrink-0 flex-col items-center border-r bg-background py-1">
          <Toolbar aria-label="Tool bar">
            {TOOLS.map((item) => (
              <ToolButton
                key={item.id}
                label={item.label}
                shortcut={item.shortcut}
                icon={item.icon}
                active={tool === item.id}
                onClick={() => setTool(item.id)}
              />
            ))}
            <ToolbarSeparator />
            <ToolButton
              label="Catalog button"
              icon={<Armchair />}
              active={catalog}
              onClick={() => setCatalog(!catalog)}
            />
          </Toolbar>
        </div>
        {catalog && <Catalog />}
        {view === '2d' ? (
          <section aria-label="Plan view" className="relative min-w-0 flex-1">
            <PlanSketch
              label="Plan of Level 0: a living room, its right wall selected"
              className="absolute inset-0 block size-full"
            />
            <LevelTabs />
          </section>
        ) : (
          <section
            aria-label="3D view"
            className="flex min-w-0 flex-1 items-center justify-center bg-muted text-muted-foreground"
          >
            The 3D view is drawn by the renderer; it has no design of its own yet.
          </section>
        )}
        <Properties />
      </div>
      <StatusBar />
    </div>
  );
}

export const Default: StoryObj = { render: () => <MainWindow /> };
export const CatalogOpen: StoryObj = { render: () => <MainWindow catalogOpen /> };
