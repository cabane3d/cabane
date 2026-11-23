import type { Meta, StoryObj } from '@storybook/react-vite';
import { Armchair, Undo2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from './button';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogTrigger } from './dialog';
import { Drawer, DrawerContent, DrawerTrigger } from './drawer';
import { IconButton } from './icon-button';
import { Input } from './input';
import { ScrollArea } from './scroll-area';
import { Separator } from './separator';
import { Toast, ToastProvider, ToastViewport } from './toast';
import { Tooltip } from './tooltip';

export default { title: 'Components / Floating layers' } satisfies Meta;

const TooltipsDemo = () => (
  <div className="flex gap-2">
    <IconButton label="Undo" shortcut="Ctrl+Z" icon={<Undo2 />} />
    <Tooltip label="Projects are saved on this computer only">
      <Button>Hover me</Button>
    </Tooltip>
  </div>
);

const ConfirmDialogDemo = () => (
  <Dialog>
    <DialogTrigger asChild>
      <Button variant="destructive">Delete level…</Button>
    </DialogTrigger>
    <DialogContent
      title="Delete Level 1?"
      description="Its 12 walls, 3 rooms and 8 pieces of furniture will be deleted. You can undo it."
      closeLabel="Close"
    >
      <DialogFooter>
        <DialogClose asChild>
          <Button>Cancel</Button>
        </DialogClose>
        <DialogClose asChild>
          <Button variant="primary">Delete</Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

const CATEGORIES = ['Living room', 'Kitchen', 'Bedroom', 'Bathroom', 'Doors, windows', 'Office'];

const CatalogDrawerDemo = () => {
  const [open, setOpen] = useState(true);
  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <div className="flex h-dialog w-full overflow-hidden rounded-xl border">
        <div className="flex w-bar flex-col items-center border-r py-1">
          <DrawerTrigger asChild>
            <IconButton
              label="Catalog"
              icon={<Armchair />}
              tooltipSide="right"
              aria-pressed={open}
            />
          </DrawerTrigger>
        </div>
        <div className="relative flex-1 bg-plan-paper">
          <p className="p-12 pl-drawer text-muted-foreground">
            Plan view: stays usable while the drawer is open.
          </p>
          <DrawerContent title="Catalog" closeLabel="Close catalog">
            <div className="p-3">
              <Input aria-label="Search the catalog" placeholder="Search…" />
            </div>
            <Separator />
            <ScrollArea className="flex-1">
              <ul className="flex flex-col p-1">
                {[...CATEGORIES, ...CATEGORIES.map((c) => `${c} (more)`)].map((category) => (
                  <li key={category}>
                    <Button variant="ghost" className="w-full justify-start">
                      {category}
                    </Button>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </DrawerContent>
        </div>
      </div>
    </Drawer>
  );
};

const ToastsDemo = () => (
  <ToastProvider duration={60_000}>
    <p className="text-muted-foreground">Toasts appear in the bottom right corner.</p>
    <Toast open status="success" title="Project saved" closeLabel="Dismiss" />
    <Toast
      open
      status="info"
      title="Wall deleted"
      action={{ label: 'Undo', altText: 'Undo with Ctrl+Z', onClick: () => {} }}
      closeLabel="Dismiss"
    />
    <Toast
      open
      status="warning"
      title="3 pieces of furniture were not imported"
      description="Their models are missing from the file."
      closeLabel="Dismiss"
    />
    <Toast
      open
      status="error"
      title="The project could not be saved"
      description="The disk is full."
      closeLabel="Dismiss"
    />
    <ToastViewport />
  </ToastProvider>
);

export const Tooltips: StoryObj = { render: () => <TooltipsDemo /> };
export const ConfirmDialog: StoryObj = { render: () => <ConfirmDialogDemo /> };
export const CatalogDrawer: StoryObj = { render: () => <CatalogDrawerDemo /> };
export const Toasts: StoryObj = { render: () => <ToastsDemo /> };
