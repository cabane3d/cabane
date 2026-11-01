# Visual identity

Cabane looks like a **professional tool with a slight handcrafted feel**, in the spirit of Excalidraw: a calm, neutral interface, and a plan that feels like drawing on coarse paper.

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
| `muted` | `#F2ECEB` | `#262B32` | Secondary surfaces (hover, panels) |
| `muted-foreground` | `#5E646B` | `#A9AFB6` | Secondary text, labels |
| `border` | `#D9D3D2` | `#3A414A` | Separators (decorative) |
| `input` | `#8A8F96` | `#6B727B` | Borders of interactive fields (≥ 3:1) |
| `primary` | Pumpkin Spice | Pumpkin Spice | Accent **fills**, always with `primary-foreground` content |
| `primary-foreground` | Jet Black | Jet Black | Text and icons on `primary` |
| `accent-strong` | `#D2601A` | Pumpkin Spice | Accent **strokes and icons** (active tool, selection) |
| `accent-text` | `#A84612` | Pumpkin Spice | Accent **text** (selected dimension, links) |
| `ring` | `accent-strong` | `accent-strong` | Keyboard focus outline |
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

The renderer reads these tokens with `getComputedStyle(document.documentElement)` and re-reads them when the theme changes; it never hard-codes colors.

### Paper texture

- **Coarse-grained drawing paper** (Canson style): a relief texture, light coming from the top left, grain slightly finer than the first mockups.
- **Attached to the drawing**: the grain moves and scales with pan and zoom, like a real sheet.
- To avoid huge blotches at high zoom or a grey haze when zoomed out, the texture uses **levels of detail**: two scales of the same seamless tile are cross-faded according to the zoom, so the apparent grain size stays within a fixed range while remaining anchored to the drawing.
- The texture is a pre-computed seamless tile (no per-frame noise), multiplied over `plan-paper` (light) or blended in overlay (dark) with `plan-grain-opacity`.
- It never reduces legibility: ink and selection keep their contrast on the darkest grain spots.

## States

- **Active tool**: icon in `accent-strong`, plus a 2 px `accent-strong` marker on its left edge. The marker makes the state visible without relying on color alone.
- **Selection in the plan**: element in `plan-selection`, with square handles (`plan-handle-*`) at its ends or corners.
- **Focus**: 2 px `ring` outline, offset 2 px, on every focusable element (`:focus-visible`).
- **Hover**: `muted` background.

## Typography

- **Inter** (variable), bundled with the app (`@fontsource-variable/inter`, OFL-1.1): no network font, the app works offline.
- **Tabular figures** (`tabular-nums`) for every number that changes: dimensions, coordinates, zoom.
- Two weights in the interface: regular (400) and semibold (600).

## Shapes, density and icons

- **Square corners** everywhere: radii are removed from the Tailwind theme.
- **No shadows**: elevation is shown with borders and `muted` surfaces. Shadow utilities are removed from the Tailwind theme.
- **Airy density** for now: comfortable spacing, controls at least 32 px high.
- **Icons**: Lucide (`lucide-react`, ISC), 16–20 px, stroke width 1.75. Installed with the first component that needs an icon.

## Accessibility

- WCAG 2.2 **AA**: text ≥ 4.5:1, large text and non-text elements (icons, field borders, selection strokes) ≥ 3:1. Every token pair above has been checked.
- **Never color alone**: states also change shape (active tool marker, selection handles, focus outline).
- Every interactive element is reachable and usable with the keyboard, with a visible focus.
- The interface follows the system light or dark setting by default; `data-theme="light"` or `"dark"` on the root element forces one.

## Rules for code

- Use only tokens: Tailwind utilities (`bg-background`, `text-accent-text`, `border-input`…) or `var(--token)`.
- No raw colors, arbitrary Tailwind colors (`bg-[#fff]`), radii or shadows outside `theme.css`. `scripts/check-design-tokens.sh` (part of `pnpm lint`) enforces it, and Tailwind no longer generates its default palette, radii or shadows.
- A new need (a new state, a new plan element) means a new token in `theme.css`, documented here.
