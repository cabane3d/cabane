import type { Meta, StoryObj } from '@storybook/react-vite';
import { Plus, Redo2, Trash2, Undo2 } from 'lucide-react';
import { Button } from './button';
import { IconButton } from './icon-button';
import { Kbd } from './kbd';

export default { title: 'Components / Button' } satisfies Meta;

const VARIANTS = ['primary', 'secondary', 'ghost', 'destructive'] as const;

const VariantsDemo = () => (
  <div className="flex flex-col gap-4">
    {VARIANTS.map((variant) => (
      <div key={variant} className="flex items-center gap-2">
        <code className="w-24 text-muted-foreground text-sm">{variant}</code>
        <Button variant={variant}>Save project</Button>
        <Button variant={variant}>
          <Plus aria-hidden="true" />
          Add level
        </Button>
        <Button variant={variant} size="sm">
          Small
        </Button>
        <Button variant={variant} disabled>
          Disabled
        </Button>
      </div>
    ))}
  </div>
);

const IconButtonsDemo = () => (
  <div className="flex items-center gap-1">
    <IconButton label="Undo" shortcut="Ctrl+Z" icon={<Undo2 />} />
    <IconButton label="Redo" shortcut="Ctrl+Y" icon={<Redo2 />} />
    <IconButton label="Delete" shortcut="Delete" icon={<Trash2 />} variant="destructive" />
    <IconButton label="Add level" icon={<Plus />} size="sm" variant="secondary" />
    <IconButton label="Undo" icon={<Undo2 />} disabled />
  </div>
);

const ShortcutDemo = () => (
  <p>
    Press <Kbd>Ctrl+S</Kbd> to save.
  </p>
);

export const Variants: StoryObj = { render: () => <VariantsDemo /> };
export const IconButtons: StoryObj = { render: () => <IconButtonsDemo /> };
export const Shortcut: StoryObj = { render: () => <ShortcutDemo /> };
