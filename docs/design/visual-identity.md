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
- **Never color alone**: states also change shape (active tool marker, selection handles, focus outline).
- Every interactive element is reachable and usable with the keyboard, with a visible focus.
- The interface follows the system light or dark setting by default; `data-theme="light"` or `"dark"` on the root element forces one.

## Rules for code

- Use only tokens: Tailwind utilities (`bg-background`, `text-accent-text`, `border-input`…) or `var(--token)`.
- No raw colors, arbitrary Tailwind colors (`bg-[#fff]`), radii or shadows outside `theme.css`. `scripts/check-design-tokens.sh` (part of `pnpm lint`) enforces it, and Tailwind no longer generates its default palette, radii or shadows.
- A new need (a new state, a new plan element) means a new token in `theme.css`, documented here.
