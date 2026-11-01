# ADR-0019: Design system and tokens

- **Status**: Accepted
- **Date**: 2026-11-01

## Context

Agents will build most of the interface. Without a shared visual vocabulary, each component would pick its own colors, radii and spacing, and the interface would drift. Changing the look later would then mean editing every component.

The maintainer defined a brand palette (Pumpkin Spice `#FF812C`, Jet Black `#292F36`, Snow `#FCF7F8`) and a direction: a professional tool with a slight handcrafted feel, a plan drawn on coarse paper, square corners, no shadows, light and dark modes.

Pumpkin Spice on Snow has a contrast of 2.35:1, below WCAG AA for text (4.5:1) and non-text elements (3:1).

## Decision

- The visual identity is described in [`docs/design/visual-identity.md`](../design/visual-identity.md).
- All visual values are **design tokens** defined as CSS custom properties in `packages/ui/src/theme.css`, with light and dark values. Names follow shadcn/ui conventions (`background`, `foreground`, `primary`, `muted`, `border`, `input`, `ring`…), plus project tokens (`accent-strong`, `accent-text`, `plan-*`).
- Tailwind CSS v4 maps the tokens to utilities (`@theme inline`) and **removes its default palette, radii and shadows**, so only tokens can be used.
- `theme.css` is the **only** place where raw color values are allowed. `scripts/check-design-tokens.sh`, run by `pnpm lint`, rejects raw colors, arbitrary Tailwind colors, radii and shadows elsewhere.
- Accessibility target: **WCAG 2.2 AA**. In light mode the accent uses three tokens: Pumpkin Spice as a fill with dark content, `accent-strong` (`#D2601A`) for strokes and icons, `accent-text` (`#A84612`) for text. States never rely on color alone.
- Theme follows the system setting by default; `data-theme` on the root element forces light or dark.
- Typography: Inter, bundled with the app (no network fonts), tabular figures for changing numbers.
- Icons: Lucide.
- The plan renderer reads its colors from the same tokens at runtime.

## Alternatives considered

- **Colors chosen per component, refined later**: fast at first, but every later change touches every component, and agents produce inconsistent results.
- **Keeping Tailwind's default palette alongside the tokens**: convenient, but agents would keep reaching for `bg-blue-500`; removing it makes the right choice the only choice.
- **Using Pumpkin Spice as is for icons and text in light mode**: faithful to the palette, but fails WCAG AA.
- **A design-token pipeline (Style Dictionary, Figma tokens)**: useful with several platforms or a design team; a single CSS file is enough here.

## Consequences

**Positive**
- A visual change is a change in `theme.css`, applied everywhere.
- Light and dark modes come for free with every component.
- Guardrails are technical (missing Tailwind utilities, lint script), not only written rules.
- shadcn/ui components can be added without restyling.

**Negative / risks**
- Every new visual need requires a new token, which takes discipline.
- The token guard relies on patterns; an unusual way of writing a color might slip through, so the reviewer agent also checks it.
- The plan renderer must re-read tokens when the theme changes.
