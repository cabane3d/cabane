# Components

The building blocks of Cabane's interface (ADR-0016, ADR-0021). They live in [`packages/ui/src/components/`](../../packages/ui/src/components/), are based on shadcn/ui and Radix, and use only the tokens of [`theme.css`](../../packages/ui/src/theme.css).

Every component has a `*.stories.tsx` file next to it. Run the catalog (Storybook, http://localhost:6006) with:

```bash
pnpm storybook
```

Its toolbar has a light/dark switch and an accessibility panel (axe); review every new component and state in both themes, with no accessibility violation.

## Rules

- **Build with these components** before writing new markup. A missing variant is added to the component, not to the call site.
- Components take their **user-facing text as props** (labels, messages, tooltips): no hard-coded English inside a component, so the interface can be translated later. Layouts tolerate labels 30 % longer than English.
- Every interactive component is reachable and usable with the keyboard, with the 2 px `ring` focus outline (`:focus-visible`).
- **Icon-only buttons** always have an accessible name (`label`) and show it in a tooltip, with the keyboard shortcut when there is one.
- **No motion**: no transitions or animations, state changes are instantaneous.
- `className` is accepted for layout (margins, width, grid placement) and merged with `cn()`; never use it to restyle colors or states.

## Common states

| State | Appearance |
|---|---|
| Rest | As described per component |
| Hover | `muted` background (except `primary` fills, which keep their color) |
| Focus | 2 px `ring` outline, offset 2 px |
| Pressed / on / selected | Depends on the component (see below); always more than a color change |
| Disabled | 50 % opacity, no hover, `not-allowed` cursor |
| Invalid | `destructive` border, message and icon under the field |

## Inventory

### Actions

| Component | Base | Variants and notes |
|---|---|---|
| `Button` | `button` | `primary` (`primary` fill, `primary-foreground` text; one per dialog or zone), `secondary` (`background`, `input` border), `ghost` (transparent, hover `muted`), `destructive` (`destructive` border and text). Sizes `default` (at least 28 px) and `sm` (at least 24 px), which grow with the text scale (ADR-0023). Optional leading icon. |
| `IconButton` | `Button` + `Tooltip` | Same width and height (`size-control` or `size-control-sm`), `ghost` by default. Requires `label` (accessible name and tooltip) and accepts `shortcut`. |
| `Kbd` | `kbd` | Keyboard shortcut, `text-sm`, `muted-foreground`, in tooltips and menus. |

### Tools and views

| Component | Base | Variants and notes |
|---|---|---|
| `Toolbar` | Radix Toolbar | Vertical (Tool bar) or horizontal. Arrow keys move between items. |
| `ToolButton` | Radix Toolbar button | One active at a time. Active: filled `primary` tile with a dark icon, `aria-pressed="true"`. 20 px icons in a 40 px rounded tile (`size-bar`, `rounded-md`). Tooltip with name and shortcut. The tool bar itself floats over the plan: `rounded-xl`, border, `shadow-popover`. |
| `SegmentedControl` | Radix Radio Group | A few exclusive options side by side, e.g. the View switcher (`radiogroup`). A `muted` pill track; the selected item is a raised `primary` pill, semibold. |
| `Tabs` | Radix Tabs | e.g. Level tabs. Pill-shaped; the selected tab is filled with `muted`, semibold, in `foreground`; others `muted-foreground`. |

### Fields

| Component | Base | Variants and notes |
|---|---|---|
| `Label` | Radix Label | `text-sm`, `muted-foreground`. |
| `Input` | `input` | 28 px, `input` border, `background` fill; `aria-invalid` gives the invalid state. |
| `FieldError` | `p` | Error message under a field, `destructive` text with an alert icon; link it to the field with `aria-describedby`. |
| `NumericField` | `Input` + `parseLength` / `formatLength` from `core` | Length fields (Properties). Shows the value formatted in the display unit (0.1 mm precision), with the unit as a suffix that is also its accessible description. Accepts units (`3.5 m`, `350 cm`, `3500 mm`, `3500` = display unit) and expressions (`3500 + 200`, `4200 / 2`, `(3 m - 20 cm) / 2`), decimal point or comma. **Enter** or leaving the field commits; **Escape** restores the last value. An invalid entry, or a length that is **zero or negative**, is kept in the field, marked invalid with a message, and nothing is committed. **Emptying** the field and committing shows the last value again and calls `onEmpty`: the caller opens a `ConfirmDialog` asking whether to delete the element (`Delete this wall?`, `Delete this terrace?`…) (*Delete* removes it, *Keep* changes nothing). |
| `Select` | Radix Select | Same box as `Input`, chevron icon, list in a floating layer. |
| `Checkbox` | Radix Checkbox | 16 px, `rounded-sm`, `input` border; checked: `primary` fill with a `primary-foreground` check mark. |
| `Switch` | Radix Switch | For immediate on/off settings (e.g. Snap). Pill track 28 × 16 px, `input` border, round thumb; on: `primary` fill and the thumb moves right. |

### Floating layers

All floating layers use the raised `popover` surface, a 1 px `popover-border` border, rounded corners, a soft shadow and no backdrop veil (ADR-0021), and their named stacking level.

| Component | Base | Variants and notes |
|---|---|---|
| `Tooltip` | Radix Tooltip | Inverted bubble (`foreground` background), `rounded-md`, `text-sm`, label and optional `Kbd`. Opens after a short delay, without animation. `--layer-tooltip`. |
| `DropdownMenu` | Radix Dropdown Menu | Items 28 px, optional icon and shortcut, separators, checkbox and radio items, sub-menus. Highlighted item: `hover`. `--layer-popover`. |
| `ContextMenu` | Radix Context Menu | Same items as `DropdownMenu`, opened by right click in the plan or a list. |
| `Dialog` | Radix Dialog (modal) | `rounded-xl`, `shadow-dialog`, width `dialog`, title `text-lg` semibold, actions at the bottom right, primary last. Escape closes. `--layer-dialog`. |
| `ConfirmDialog` | `Dialog` | Confirms an action, typically a deletion: the question as title (`Delete this wall?`), an optional sentence, the safe choice (*Keep*, *Cancel*) then the action, primary. Opens with the focus on the **safe choice**, so Enter never confirms by accident. The question is received whole, already translated: one message per element type (`Delete this wall?`, `Delete this terrace?`), never an element name inserted into a sentence, because articles and agreements differ between languages (*ce mur*, *cette terrasse*). |
| `Drawer` | Radix Dialog (non-modal) | Floating panel over a zone, 8 px from its left edge, `rounded-xl`, `shadow-dialog`, width `drawer`, title and close button, Escape closes, the rest of the window stays usable. `--layer-drawer`. Not used by the Catalog, which is a docked panel like Properties. |
| `Toast` | Radix Toast | Bottom right, `text-base`, status icon (`info`, `success`, `warning`, `destructive`) plus text, optional action. `--layer-toast`. |

### Layout

| Component | Base | Variants and notes |
|---|---|---|
| `Separator` | Radix Separator | 1 px `border`, horizontal or vertical. |
| `ScrollArea` | Radix Scroll Area | Thin scrollbar with a pill thumb in `muted-foreground`, for panels and lists. |

## Adding a component

1. Start from the shadcn/ui source of the component when there is one, and restyle it with the tokens: the radius and shadow steps above, no animation classes, 28 px controls.
2. Put it in `packages/ui/src/components/<name>.tsx` and export it from `packages/ui/src/index.ts`.
3. Show every variant and state in a `*.stories.tsx` file, and test its behavior when it has any (`<name>.test.tsx`, Vitest with `// @vitest-environment jsdom` and Testing Library).
4. Document it in this file.
