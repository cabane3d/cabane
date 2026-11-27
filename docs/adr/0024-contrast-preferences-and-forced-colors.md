# ADR-0024: Contrast preferences, forced colors and motion

- **Status**: Accepted
- **Date**: 2026-11-27
- **Amends**: ADR-0019, ADR-0021

## Context

ADR-0019 sets WCAG 2.2 AA as the target and states that "states never rely on color alone". ADR-0021 removes all motion. Neither says what happens when the user's system overrides the colors:

- In **forced colors** mode (Windows High Contrast), the browser replaces backgrounds and borders with system colors. A `ToolButton` whose active state is only a `bg-primary` fill (and `aria-pressed`) loses its visible state, and so can a switch or a scroll thumb that uses a background.
- With **`prefers-contrast: more`**, the subtle grays of `border`, `input` and `muted-foreground` stay as they are.
- The base layer disables every transition and animation with `!important`. That rule is deliberate (ADR-0021), but it was never written down that **`prefers-reduced-motion` needs no handling** because there is no motion.

A review with the `modern-web-guidance` skill found that focus rings already use `outline` (good) but that active states and the scrollbar have no forced-colors or contrast override.

## Decision

**States stay visible in forced colors**
- Every state conveyed by a fill (`aria-pressed`, `data-[state=checked]`, `aria-selected`, selected tabs and segments) also has a **non-background cue** in `forced-colors: active`: an `outline` or `border` in `Highlight`/`ButtonText`, or a `forced-color-adjust` rule chosen per component. Tailwind's `forced-colors:` variant is used for it.
- Focus rings stay `outline`-based, never `box-shadow` alone.
- Icons use `currentColor`; no information is carried by an image or a background image only.
- Floating layers, which rely on a shadow for separation (ADR-0021), also get a **border** in forced colors, because shadows are removed.

**Contrast preference**
- `theme.css` redefines, under `@media (prefers-contrast: more)`, the tokens that separate or label: `border`, `input`, `muted-foreground`, `popover-border` and `hover`, to reach at least **7:1** for text and **4.5:1** for non-text elements. These are overrides of existing tokens, not new names, in both themes.
- The scrollbar of `ScrollArea` uses a thumb token with at least 3:1 against its track, and the high-contrast override above.

**Motion**
- ADR-0021's **no-motion rule stands**. Because nothing moves, `prefers-reduced-motion` is not handled and does not need to be.
- If motion is ever introduced, it comes with its own ADR, and that ADR must honor `prefers-reduced-motion`. Until then, the `!important` reset in the base layer is the guard against anyone reintroducing it.

**Checks**
- The `Foundations / Accessibility / States` story gathers every control that shows a state with a fill. It is reviewed in the browser's forced-colors and `prefers-contrast: more` emulation (DevTools > Rendering), in both themes. CSS media features cannot be switched from a Storybook toolbar, so the emulation is manual until a Playwright `@visual` scenario covers it.
- The accessibility addon (axe) stays enabled for every story.

## Alternatives considered

- **Do nothing and trust the OS**: forced colors already keeps text readable, but state-only-by-fill controls become ambiguous, which breaks ADR-0019's "never color alone".
- **A third theme, "high contrast", chosen in the interface**: duplicates the system preference and doubles the states to test.
- **Honor `prefers-reduced-motion` anyway, for later**: dead code today, and it would suggest that motion is welcome.
- **Switch every state to a text or icon change**: robust but heavy; an outline in system colors is enough in forced mode only.

## Consequences

**Positive**
- Active tools, switches, tabs and scroll thumbs stay legible in Windows High Contrast.
- Users who ask for more contrast get it from the same tokens, with no extra component code.
- The motion decision is explicit.

**Negative / risks**
- The contrast token overrides have to be checked against the plan colors (`plan-*`) too.
- Forced-color rules are easy to forget on a new component: the reviewer agent checks them, and `docs/design/components.md` lists the expected cue per state.
- Emulated forced colors in Chromium differs slightly from the real Windows mode; one manual check on Windows is still advisable before release.
