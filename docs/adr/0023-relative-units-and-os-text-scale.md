# ADR-0023: Relative units and operating system text scale

- **Status**: Accepted
- **Date**: 2026-11-27
- **Amends**: ADR-0021

## Context

ADR-0021 fixed the spacing, sizing and type scales in **pixels**: text from 12 to 28 px, controls 24 and 28 px high, `bar` 40 px, panels and dialogs 256 to 480 px wide. Components also use fixed heights (`h-control`, `h-bar`).

A review of the interface with the `modern-web-guidance` skill found that this ignores the **operating system text scale** (Windows "Make text bigger"): the user's setting has no effect on Cabane. The interface also relies on 13 px text and 28 px controls, so users who need larger text are the ones most affected. WCAG 2.2 AA (ADR-0019) requires text to be resizable up to 200 % without loss of content or functionality (1.4.4) and content to reflow without clipping (1.4.10).

Electron ships Chromium, which supports `<meta name="text-scale" content="scale">` from version 146: it scales the root font size (`1rem`) to the OS preference, so everything sized in `rem` follows.

## Decision

- **The scales of ADR-0021 are expressed in `rem`**, at the default root size of 16 px, so nothing changes visually at the default text scale:
  - spacing steps: `0.125rem`, `0.25rem`, `0.375rem`, `0.5rem`, `0.75rem`, `1rem`, `1.5rem`, `2rem`, `3rem` (the same 2, 4, 6, 8, 12, 16, 24, 32, 48 px);
  - named sizes `icon`, `icon-lg`, `control-sm`, `control`, `bar`, `panel`, `drawer`, `dialog` (1, 1.25, 1.5, 1.75, 2.5, 16, 20 and 30 rem);
  - text sizes `sm`, `base`, `lg`, `xl`, `2xl` with their line heights (12/16, 13/20, 15/22, 20/28, 28/36 px, converted to `rem`).
- **The token names do not change**, nor does the rule that a value outside the scales generates no CSS. Only their values move from `px` to `rem`.
- `apps/desktop/src/renderer/index.html` declares `<meta name="text-scale" content="scale">`.
- **No `font-size` is ever set on `:root` or `html`**, and `env(preferred-text-scale)` is not used: the browser applies the scale itself, and doing both would scale twice.
- **Controls grow with their text**: components use `min-h-control` and `min-h-bar` rather than fixed `h-*`, and never `white-space: nowrap` on text that can wrap, so scaled text is not clipped. Icon-only controls keep a square size in `rem` so they scale with the icon.
- **The plan stays in screen pixels.** Line widths, handles, ticks and the plan text sizes (`--plan-*`, ADR-0021) are drawn on a canvas or SVG scaled by the zoom, not by the text scale, and keep their pixel values.
- `scripts/check-design-tokens.sh` rejects `px` values in component styles outside `theme.css`, other than `1px` hairlines.
- Components are checked at **200 % text** in Storybook (a root font size of 32 px), and the main window at a 320 CSS px reflow width where the layout allows it.

## Alternatives considered

- **Keep pixels and rely on Electron's page zoom (Ctrl +/-)**: zoom still works and stays available, but it ignores the OS setting, which is where users with a visual impairment have already configured their needs.
- **Scale everything with `zoom` on the root**: simple, but it scales the plan canvas and breaks the constant-pixel drawing rules of ADR-0021.
- **Set the root font size to 13 px so that `rem` equals the base text**: rejected, because setting `font-size` on `:root` prevents the browser from applying the text scale.
- **Use `env(preferred-text-scale)` by hand**: duplicates the meta opt-in and can scale twice.

## Consequences

**Positive**
- Cabane follows the OS text scale, and the WCAG 2.2 AA target of ADR-0019 is met for resizing.
- No visual change at the default scale, and no new token names.
- Tokens remain the single place for sizes.

**Negative / risks**
- Fixed-height layouts (Top bar, Tool bar, Level tabs floating over the plan) must tolerate larger content: at large scales they cover more of the plan.
- Components that relied on `h-control` need to be reviewed, and their stories updated for 200 % text.
- Plan text no longer follows the OS scale; it follows the plan zoom instead.

## Open questions

- Which Electron version first bundles a Chromium that honors `<meta name="text-scale">` on Windows and Linux? Until it does, the meta is harmless, and only page zoom applies.
- Should the Properties panel width (`panel`) grow with the text scale, or stay capped at a fraction of the window?
