import { type Mm, mm } from '@cabane3d/core';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useId, useState } from 'react';
import { Button } from './button';
import { Checkbox } from './checkbox';
import { ConfirmDialog } from './confirm-dialog';
import { FieldError, Input } from './input';
import { Label } from './label';
import { NumericField } from './numeric-field';
import { SegmentedControl, SegmentedControlItem } from './segmented-control';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Switch } from './switch';

export default { title: 'Components / Fields' } satisfies Meta;

function LengthRow({
  label,
  initial,
  onEmpty,
}: {
  label: string;
  initial: number;
  onEmpty: () => void;
}) {
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
        onEmpty={onEmpty}
        invalidMessage="Enter a length, e.g. 3500 or 3.5 m"
        nonPositiveMessage="Must be greater than 0"
        outOfRangeMessage="At most 100 m"
      />
    </div>
  );
}

/**
 * What each element type says in its Properties panel. Every message is a whole sentence of its
 * own (as it will be in the translation files), never an element name inserted into a sentence.
 */
const ELEMENTS = {
  wall: {
    label: 'Wall',
    deleteTitle: 'Delete this wall?',
    deletedMessage: 'The wall was deleted.',
    dimensions: [
      ['Length', 3500],
      ['Thickness', 200],
      ['Height', 2500],
    ],
  },
  terrace: {
    label: 'Terrace',
    deleteTitle: 'Delete this terrace?',
    deletedMessage: 'The terrace was deleted.',
    dimensions: [
      ['Length', 6000],
      ['Width', 4000],
    ],
  },
  sofa: {
    label: 'Sofa',
    deleteTitle: 'Delete this sofa?',
    deletedMessage: 'The sofa was deleted.',
    dimensions: [
      ['Width', 2100],
      ['Depth', 950],
      ['Height', 850],
    ],
  },
} as const satisfies Record<
  string,
  {
    label: string;
    deleteTitle: string;
    deletedMessage: string;
    dimensions: readonly (readonly [string, number])[];
  }
>;

type ElementType = keyof typeof ELEMENTS;

function isElementType(value: string): value is ElementType {
  return Object.hasOwn(ELEMENTS, value);
}

function PropertiesPanel({ type }: { type: ElementType }) {
  const element = ELEMENTS[type];
  const [confirming, setConfirming] = useState(false);
  const [deleted, setDeleted] = useState(false);
  if (deleted) {
    return (
      <div className="flex w-panel flex-col items-start gap-2 rounded-lg border p-3">
        <p className="text-muted-foreground">{element.deletedMessage}</p>
        <Button onClick={() => setDeleted(false)}>Undo</Button>
      </div>
    );
  }
  return (
    <div className="flex w-panel flex-col gap-2 rounded-lg border p-3">
      <h2 className="font-semibold text-lg">{element.label}</h2>
      {element.dimensions.map(([label, initial]) => (
        <LengthRow
          key={label}
          label={label}
          initial={initial}
          onEmpty={() => setConfirming(true)}
        />
      ))}
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={element.deleteTitle}
        description="You emptied one of its dimensions. Delete it, or keep it as it was."
        confirmLabel="Delete"
        cancelLabel="Keep"
        closeLabel="Close"
        onConfirm={() => setDeleted(true)}
      />
    </div>
  );
}

/**
 * The Properties panel of the selected element. Try `3.5 m`, `3500 + 200`, `(3 m - 20 cm) / 2`,
 * `abc`, `0`, `-200`, or empty a field and press Enter: Cabane asks whether to delete the element.
 */
const LengthFieldsDemo = () => {
  const [type, setType] = useState<ElementType>('wall');
  return (
    <div className="flex flex-col items-start gap-3">
      <SegmentedControl
        aria-label="Selected element"
        value={type}
        onValueChange={(value) => {
          if (isElementType(value)) setType(value);
        }}
      >
        {Object.entries(ELEMENTS).map(([key, element]) => (
          <SegmentedControlItem key={key} value={key}>
            {element.label}
          </SegmentedControlItem>
        ))}
      </SegmentedControl>
      <PropertiesPanel key={type} type={type} />
    </div>
  );
};

const LengthUnitsDemo = () => {
  const [value, setValue] = useState<Mm>(mm(3500));
  return (
    <div className="flex w-panel flex-col gap-2">
      {(['mm', 'cm', 'm'] as const).map((unit) => (
        <NumericField
          key={unit}
          aria-label={`Length in ${unit}`}
          value={value}
          unit={unit}
          onCommit={setValue}
          invalidMessage="Enter a length"
        />
      ))}
      <NumericField
        aria-label="Disabled length"
        value={value}
        unit="mm"
        onCommit={setValue}
        invalidMessage="Enter a length"
        disabled
      />
    </div>
  );
};

const TextInputDemo = () => {
  const id = useId();
  const errorId = useId();
  return (
    <div className="flex w-panel flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Label htmlFor={id}>Project name</Label>
        <Input id={id} defaultValue="Untitled" />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor={`${id}-search`}>Search</Label>
        <Input id={`${id}-search`} placeholder="Search…" />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor={`${id}-invalid`}>Level name</Label>
        <Input id={`${id}-invalid`} aria-invalid aria-describedby={errorId} defaultValue="" />
        <FieldError id={errorId}>A level needs a name</FieldError>
      </div>
      <Input aria-label="Disabled field" defaultValue="Disabled" disabled />
    </div>
  );
};

const SelectFieldDemo = () => (
  <div className="flex w-panel flex-col gap-1">
    <Label>Display units</Label>
    <Select defaultValue="mm">
      <SelectTrigger aria-label="Display units">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="mm">Millimeters</SelectItem>
        <SelectItem value="cm">Centimeters</SelectItem>
        <SelectItem value="m">Meters</SelectItem>
        <SelectItem value="in" disabled>
          Inches (later)
        </SelectItem>
      </SelectContent>
    </Select>
  </div>
);

const TogglesDemo = () => {
  const id = useId();
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Checkbox id={`${id}-a`} defaultChecked />
        <Label htmlFor={`${id}-a`} className="text-base text-foreground">
          Show dimensions
        </Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id={`${id}-b`} />
        <Label htmlFor={`${id}-b`} className="text-base text-foreground">
          Show furniture
        </Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id={`${id}-c`} checked="indeterminate" />
        <Label htmlFor={`${id}-c`} className="text-base text-foreground">
          Some levels
        </Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id={`${id}-d`} disabled />
        <Label htmlFor={`${id}-d`} className="text-base text-foreground">
          Disabled
        </Label>
      </div>
      <div className="flex items-center gap-2">
        <Switch id={`${id}-snap`} defaultChecked />
        <Label htmlFor={`${id}-snap`} className="text-base text-foreground">
          Snap
        </Label>
      </div>
      <div className="flex items-center gap-2">
        <Switch id={`${id}-grid`} />
        <Label htmlFor={`${id}-grid`} className="text-base text-foreground">
          Grid
        </Label>
      </div>
    </div>
  );
};

export const LengthFields: StoryObj = { render: () => <LengthFieldsDemo /> };
export const LengthUnits: StoryObj = { render: () => <LengthUnitsDemo /> };
export const TextInput: StoryObj = { render: () => <TextInputDemo /> };
export const SelectField: StoryObj = { render: () => <SelectFieldDemo /> };
export const Toggles: StoryObj = { render: () => <TogglesDemo /> };
