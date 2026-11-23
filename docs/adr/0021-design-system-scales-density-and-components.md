# ADR-0021: Design system: shapes, scales, density, motion and components

- **Status**: Accepted
- **Date**: 2026-11-09
- **Amends**: ADR-0019

## Context

ADR-0019 fixed the colors, the typeface, the icons and the "no radius, no shadow" rule, but left everything else to each component: spacing, text sizes, control height, layering of floating elements, motion, the components themselves and the drawing conventions of the plan. Agents will build most of the interface; any value left open will drift.

ADR-0019 also chose an **airy density** (controls ≥ 32 px) and **square corners without shadows**. The maintainer now wants Cabane to look and feel like a professional tool, where the Properties panel shows many values at once, with the friendlier shapes of today's web design tools (Figma, Canva, Pinterest) rather than a strictly technical look.

## Decision

**Density and scales**
- **Compact density**: controls are **28 px** high (24 px for the small size), base text is **13 px**.
- Tailwind's spacing, sizing, text, weight, leading, tracking, container and animation scales are **replaced by restricted, named scales** in `theme.css`, exactly as ADR-0019 did for colors. A value outside the scale does not generate any CSS.
  - Spacing: 0, 2, 4, 6, 8, 12, 16, 24, 32, 48 px (`0`, `0.5`, `1`, `1.5`, `2`, `3`, `4`, `6`, `8`, `12`).
  - Named sizes: `icon` (16), `icon-lg` (20), `control-sm` (24), `control` (28), `bar` (40), `panel` (256), `drawer` (320), `dialog` (480).
  - Text: `sm` 12/16, `base` 13/20, `lg` 15/22, `xl` 20/28, `2xl` 28/36. Weights: 400 and 600 only.
- Floating layers use **named stacking levels** (`--layer-drawer`, `--layer-popover`, `--layer-dialog`, `--layer-toast`, `--layer-tooltip`), never raw `z-*` numbers.
- `scripts/check-design-tokens.sh` also rejects arbitrary values (`p-[13px]`, `text-[15px]`, `h-[30px]`…) and raw `z-*` numbers.

**Shapes and elevation** (replaces "square corners, no shadows" from ADR-0019)
- **Rounded corners** from a four-step scale: `rounded-sm` 4 px (checkboxes, small marks), `rounded-md` 8 px (buttons, fields, tool tiles, menu items), `rounded-lg` 12 px (menus, popovers, toasts), `rounded-xl` 16 px (dialogs, floating panels). `rounded-full` makes pills (switch, segmented control, tabs).
- The interface itself stays **flat**. Only **floating layers** have a soft shadow, from two tokens: `shadow-popover` (menus, selects, tooltips) and `shadow-dialog` (dialogs, drawers, toasts), on a raised `popover` surface with a light border. There is no backdrop veil.
- The **plan keeps its drawing conventions**: square selection handles and crisp strokes; rounded shapes are for the interface around it.
- Tool bars and panels may **float** over the plan, Figma-style: rounded, with a border and a shadow.

**Motion**: **none**. Every state change is instantaneous, as in a classic CAD tool. Tailwind's animation scale is removed and the base layer disables CSS transitions and animations.

**Plan view**
- Walls are drawn **solid (poché)** in ink; dimensions end with **45° ticks**; snapping guides are **dashed ink**; hover is a **soft halo**; invalid elements are outlined in `destructive` and **cross-hatched**.
- Line widths, handle sizes and plan text sizes are **constant in screen pixels**, whatever the zoom; only the drawing (and its paper grain) scales.
- Labels and room names use **Architects Daughter** (OFL-1.1, bundled); dimensions and coordinates keep Inter with tabular figures.
- These conventions are described in [`docs/design/plan-drawing.md`](../design/plan-drawing.md) and exposed as `plan-*` tokens.

**Components**
- The component inventory, variants and states are described in [`docs/design/components.md`](../design/components.md). Components live in `packages/ui/src/components/`, built from shadcn/ui on Radix (ADR-0016) and restyled with the tokens.
- **Storybook** is the living catalog: every component has a `*.stories.tsx` file next to it, and the foundations (colors, type, spacing, plan drawing) have their own stories. `pnpm storybook` serves it, with a light/dark switch and the accessibility addon (axe). Telemetry and update notifications are disabled: Cabane's tooling makes no network calls either.
- Length fields accept **units** (`3.5 m`, `350 cm`, `3500`) and **arithmetic expressions** (`3500 + 200`, `4200 / 2`). Parsing and formatting are pure functions in `core`, the display boundary of ADR-0017.

**Internationalization**: the interface is in English, but components never hard-code user-facing text they do not receive as props, and layouts tolerate labels 30 % longer than English.

## Alternatives considered

- **Keep the airy density (32 px)**: comfortable, but the Properties panel would scroll for a single wall.
- **User-selectable density**: twice the visual states to test, for a need nobody has expressed.
- **Keep Tailwind's default scales**: free, but agents mix `p-5`, `p-[18px]` and `gap-3.5` and the interface drifts.
- **Keep square corners and no shadows** (ADR-0019): coherent with a technical drawing, but it reads as austere next to the tools Cabane's users already know.
- **Pill-shaped buttons everywhere** (Pinterest): very friendly, but wide pills waste space in a compact tool; pills are kept for switches, segmented controls and tabs.
- **A hard offset shadow for floating layers** ("cut paper"): distinctive, but competes with the plan for attention.
- **Short UI transitions (100–150 ms)**: softer, but the maintainer prefers the immediacy of a CAD tool; no motion also removes `prefers-reduced-motion` handling and timing flakiness from visual tests.
- **Sketchy (rough.js-like) strokes in the plan**: strong handcrafted feel, but it hurts precision reading; the paper grain and the handwritten labels carry the feel instead.
- **Ladle** instead of Storybook: lighter, but its last release dates from November 2025 and it bundles an older Vite; Storybook is actively maintained, runs on the project's own Vite and has an accessibility addon.

## Consequences

**Positive**
- Spacing, sizes and stacking are as constrained as colors: the right value is the only one that works.
- No animation code, no timing in visual tests.
- One catalog where the maintainer reviews every component and state, in both themes.

**Negative / risks**
- A layout need outside the scales requires a new token, which slows down one-off adjustments.
- Storybook is a large development dependency. It never ships in the application.
- Architects Daughter covers Latin scripts only; languages needing other scripts will need a fallback handwritten font.
- 13 px text and 28 px controls are below comfortable touch targets; Cabane targets mouse and keyboard.
