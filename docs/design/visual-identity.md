# Visual identity

Cabane looks like a **professional tool with a slight handcrafted feel**: a calm interface with the friendly, rounded shapes of today's design tools (Figma, Canva, Pinterest), around a plan that feels like drawing on coarse paper.

Tokens are defined in [`packages/ui/src/theme.css`](../../packages/ui/src/theme.css), the only file where raw color values are allowed (ADR-0019). This document explains them.

## Brand palette

| Name | Hex | Role |
|---|---|---|
| Pumpkin Spice | `#FF812C` | Accent: active tool, selection, primary actions |
| Jet Black | `#292F36` | Text and ink |
| Snow | `#FCF7F8` | Background and paper |

## Interface tokens

| Token | Light | Dark | Use |
|---|---|---|---|
| `background` | Snow `#FCF7F8` | `#1D2127` | Window background |
| `foreground` | Jet Black `#292F36` | Snow `#FCF7F8` | Text, icons |
| `muted` | `#F2ECEB` | `#262B32` | Secondary surfaces (panels, active tab) |
| `hover` | `#E8DEDC` | `#353C46` | Hovered buttons, tools and tabs; highlighted menu items |
| `muted-foreground` | `#5E646B` | `#A9AFB6` | Secondary text, labels |
| `border` | `#D9D3D2` | `#3A414A` | Separators (decorative) |
| `input` | `#8A8F96` | `#6B727B` | Borders of interactive fields (≥ 3:1) |
| `primary` | Pumpkin Spice | Pumpkin Spice | Accent **fills**, always with `primary-foreground` content |
| `primary-foreground` | Jet Black | Jet Black | Text and icons on `primary` |
| `accent-strong` | `#D2601A` | Pumpkin Spice | Accent **strokes and icons** (active tool, selection) |
| `accent-text` | `#A84612` | Pumpkin Spice | Accent **text** (selected dimension, links) |
| `ring` | `accent-strong` | `accent-strong` | Keyboard focus outline |
| `popover` / `popover-foreground` | `#FFFFFF` / `foreground` | `#2A3038` / `foreground` | Raised surface and content of floating layers (menus, popovers, drawer, dialogs, toasts) |
| `popover-border` | `border` | `border` | Light border of floating layers |
| `shadow-popover` | soft, small | soft, darker | Menus, selects, tooltips |
| `shadow-dialog` | soft, large | soft, darker | Dialogs, floating panels, toasts |
| `destructive`, `success`, `warning`, `info` | standard | standard | Status messages (to be refined later) |

### Why three oranges

Pumpkin Spice on Snow has a contrast of **2.35:1**: too low for text (WCAG AA requires 4.5:1) and for icons or strokes (3:1). In light mode:
- as a **fill**, it is used as is, with Jet Black content (5.4:1);
- for **strokes and icons**, `accent-strong` `#D2601A` (3.65:1);
- for **text**, `accent-text` `#A84612` (5.6:1 on Snow, 5.1:1 on `muted`).

In dark mode, Pumpkin Spice passes everywhere (6.5:1 on the background) and is used as is.

## Plan view

| Token | Light | Dark | Use |
|---|---|---|---|
| `plan-paper` | Snow | Jet Black | Paper color |
| `plan-ink` | Jet Black | `#E8E2E1` | Walls, lines, text |
| `plan-selection` | `accent-strong` | Pumpkin Spice | Selected elements |
| `plan-selection-text` | `accent-text` | Pumpkin Spice | Dimensions of selected elements |
| `plan-handle-fill` / `plan-handle-stroke` | paper / ink | paper / ink | Square selection handles |
| `plan-grain-opacity` | 0.55 | 0.35 | Strength of the paper grain |
| `plan-wall` | ink | ink | Wall fill (poché) |
| `plan-hover` | ink at 12 % | ink at 18 % | Hover halo |
| `plan-guide` | `muted-foreground` | `muted-foreground` | Dashed snapping guides |
| `plan-invalid` | `destructive` | `destructive` | Outline and cross-hatching of invalid elements |

The renderer reads these tokens with `getComputedStyle(document.documentElement)` and re-reads them when the theme changes; it never hard-codes colors.

Drawing conventions (walls, dimensions, guides, hover, invalid elements, line widths, plan text) and their tokens are described in [`plan-drawing.md`](plan-drawing.md).

### Paper texture

- **Coarse-grained drawing paper** (Canson style): a relief texture, light coming from the top left, grain slightly finer than the first mockups.
- **Attached to the drawing**: the grain moves and scales with pan and zoom, like a real sheet.
- To avoid huge blotches at high zoom or a grey haze when zoomed out, the texture uses **levels of detail**: two scales of the same seamless tile are cross-faded according to the zoom, so the apparent grain size stays within a fixed range while remaining anchored to the drawing.
- The texture is a pre-computed seamless tile (no per-frame noise), multiplied over `plan-paper` (light) or blended in overlay (dark) with `plan-grain-opacity`.
- It never reduces legibility: ink and selection keep their contrast on the darkest grain spots.

## States

- **Active tool**: a filled `primary` tile with a dark icon. The filled shape stands out from the bar, so the state does not rely on hue alone.
- **Selection in the plan**: element in `plan-selection`, with square handles (`plan-handle-*`) at its ends or corners.
- **Focus**: 2 px `ring` outline, offset 2 px, on every focusable element (`:focus-visible`).
- **Hover**: `hover` background, visibly darker than `muted` so it reads on every surface, including floating layers.
- **Disabled**: 50 % opacity and no hover; disabled controls stay readable but are exempt from contrast rules.
- **Invalid field**: `destructive` border, plus an error message and an icon (never the border alone).

Component-level states are listed in [`components.md`](components.md).

## Typography

- **Inter** (variable), bundled with the app (`@fontsource-variable/inter`, OFL-1.1): no network font, the app works offline.
- **Architects Daughter** (`@fontsource/architects-daughter`, OFL-1.1), bundled, for **labels and room names in the plan only** (`font-plan`, `--plan-font-label`). Never in the interface around the plan.
- **Tabular figures** (`tabular-nums`) for every number that changes: dimensions, coordinates, zoom.
- Two weights: regular (400, `font-normal`) and semibold (600, `font-semibold`). Other weights do not exist.

### Type scale (ADR-0021)

| Utility | Size / line height | Use |
|---|---|---|
| `text-sm` | 12 / 16 px | Field labels, status bar, tooltips, keyboard shortcuts |
| `text-base` | **13 / 20 px** | Default: controls, menus, values, body text |
| `text-lg` | 15 / 22 px | Panel and dialog titles |
| `text-xl` | 20 / 28 px | Empty states |
| `text-2xl` | 28 / 36 px | Welcome screen title |

Any other size (`text-xs`, `text-3xl`, `text-[15px]`) does not exist.

## Shapes, density and icons

- **Rounded corners** (ADR-0021), from four steps only; Tailwind's other radii do not exist:

  | Utility | Radius | Use |
  |---|---|---|
  | `rounded-sm` | 4 px | Checkboxes, small marks |
  | `rounded-md` | 8 px | Buttons, fields, tool tiles, menu items, tooltips |
  | `rounded-lg` | 12 px | Menus, popovers, selects, toasts |
  | `rounded-xl` | 16 px | Dialogs, drawers |
  | `rounded-full` | pill | Switch, segmented control, tabs, scrollbar thumbs |

- **Flat interface, raised floating layers**: buttons, fields and panels have no shadow. Only floating layers do, with `shadow-popover` or `shadow-dialog`. Other shadow utilities do not exist.
- **The plan keeps its conventions**: square selection handles, crisp strokes ([`plan-drawing.md`](plan-drawing.md)).
- **Compact density** (ADR-0021): controls 28 px high (`h-control`), 24 px for the small size (`h-control-sm`), base text 13 px. Cabane targets mouse and keyboard.
- **Icons**: Lucide (`lucide-react`, ISC), 16 px in controls (`size-icon`), 20 px in the tool bar (`size-icon-lg`), stroke width 1.75. Icon-only buttons always have an accessible name and a tooltip.

### Spacing and sizes (ADR-0021)

Spacing steps (padding, margin, gap, insets): `0` 0 · `0.5` 2 px · `1` 4 px · `1.5` 6 px · `2` 8 px · `3` 12 px · `4` 16 px · `6` 24 px · `8` 32 px · `12` 48 px. Other steps (`p-5`, `gap-2.5`, `p-[13px]`) do not exist.

Named sizes, usable with `w-`, `h-`, `size-`, `min-w-`, `max-w-`…:

| Token | Value | Use |
|---|---|---|
| `icon` | 16 px | Icons in controls |
| `icon-lg` | 20 px | Tool bar icons |
| `control-sm` | 24 px | Small controls (status bar, inline buttons in fields) |
| `control` | 28 px | Default control height, icon buttons |
| `bar` | 40 px | Top bar height, tool bar width |
| `panel` | 256 px | Properties panel width |
| `drawer` | 320 px | Drawer width |
| `dialog` | 480 px | Default dialog width |

Usual rhythm: 4 px inside a control, 8 px between related controls, 12 px panel padding, 16 px between groups.

### Layers and elevation

A floating layer has a raised `popover` surface, a 1 px `popover-border` border, rounded corners and a soft shadow (`shadow-popover` for small layers, `shadow-dialog` for large ones), which separate it from the interface and from the plan paper. There is no veil behind modal dialogs. Tooltips are inverted: `foreground` background, `background` text.

Stacking order uses named levels, through `z-(--layer-…)`; raw `z-10`, `z-50` are rejected by the token guard:

| Level | Value | Elements |
|---|---|---|
| `--layer-drawer` | 10 | Drawers |
| `--layer-popover` | 20 | Menus, selects, popovers |
| `--layer-dialog` | 30 | Dialogs |
| `--layer-toast` | 40 | Toasts |
| `--layer-tooltip` | 50 | Tooltips |

### Motion

**None** (ADR-0021). Opening, closing and state changes are instantaneous. The base layer of `theme.css` disables CSS transitions and animations, and Tailwind's animation utilities do not exist.

### Cursors

| Cursor | When |
|---|---|
| `default` | Interface, Select tool over empty paper |
| `pointer` | Never on buttons (desktop convention); only on links |
| `move` | Over a selected element that can be moved |
| `crosshair` | Drawing tools (Wall, Room, Dimension) in the plan |
| `grab` / `grabbing` | Panning the plan or orbiting the 3D view |
| resize cursors | Over a selection handle, oriented along the handle's axis |
| `not-allowed` | Over a disabled control |

## Logo

The logo is a modern house, in deliberate contrast with the name *cabane* (hut): a deep upper frame cantilevered over an open ground floor, held by the end wall and a single column, on a terrace that overhangs on the right. Files are in [`logo/`](logo/).

| File | Use |
|---|---|
| `cabane-icon.svg`, `cabane-logo.svg` | Masters in `currentColor`: inline them so they take the surrounding text color |
| `cabane-*-jet-black.svg` | On light backgrounds |
| `cabane-*-snow.svg` | On dark backgrounds |
| `cabane-*-pumpkin-spice.svg` | Accent use and app icon |

### Construction

- **64-unit grid**, icon centered: frame 52 × 20, ground floor 16 high, terrace 56 wide, flush with the end wall on the left.
- **One stroke weight everywhere: 4 units**, including the wordmark stems. Never thicken or thin a single part.
- **Wordmark**: Inter outlined to paths (no font needed), weight tuned (≈ 649) so the stems are exactly 4 units; x-height 16 units, equal to the ground floor height; baseline on the top of the terrace; 12 units between the terrace end and the first letter.

### Usage

- **Single color on a transparent background**, always: Jet Black on light backgrounds, Snow on dark ones, Pumpkin Spice for accent use. Logos are exempt from WCAG contrast rules, but prefer Jet Black over Pumpkin Spice on Snow (2.35:1).
- **Clear space**: at least 8 units (two strokes) on every side.
- **Minimum size**: icon 16 px (strokes are then 1 px), wide logo 32 px high.
- Never stretch, outline, add a gradient or a shadow, recolor outside the three brand colors, or move the wordmark relative to the icon.

### App icon

`apps/desktop/build/icon.png` (1024 px) and `icon.ico` are the icon in **Pumpkin Spice**, the only brand color that stays visible on both light and dark taskbars and docks. The drawing fills about 820 px of the 1024 px canvas, as platform guidelines expect. electron-builder derives the macOS `.icns` from the PNG.

## Accessibility

- WCAG 2.2 **AA**: text ≥ 4.5:1, large text and non-text elements (icons, field borders, selection strokes) ≥ 3:1. Every token pair above has been checked.
- **Never color alone**: states also change shape or weight (filled active tool, selected tab fill and weight, selection handles, focus outline).
- Every interactive element is reachable and usable with the keyboard, with a visible focus.
- The interface follows the system light or dark setting by default; `data-theme="light"` or `"dark"` on the root element forces one.

## Rules for code

- Use only tokens: Tailwind utilities (`bg-background`, `text-accent-text`, `border-input`…) or `var(--token)`.
- No raw colors, arbitrary Tailwind colors (`bg-[#fff]`), radii or shadows outside `theme.css`. `scripts/check-design-tokens.sh` (part of `pnpm lint`) enforces it, and Tailwind only generates the palette, radii and shadows defined there.
- Only the scales of ADR-0021 exist: spacing, named sizes, text sizes and weights. Arbitrary values (`p-[13px]`, `h-[30px]`, `text-[15px]`) and raw stacking numbers (`z-50`) are rejected by `scripts/check-design-tokens.sh`.
- No transitions or animations.
- A new need (a new state, a new plan element, a new size) means a new token in `theme.css`, documented here.
- Build with the components of `packages/ui/src/components/` ([`components.md`](components.md)) before writing new markup; check them in Storybook (`pnpm storybook`).
