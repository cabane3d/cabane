# Plan drawing

How the plan view draws the project: a precise architectural drawing on coarse paper (ADR-0019, ADR-0021). Colors and the paper texture are in [`visual-identity.md`](visual-identity.md#plan-view); this document fixes the **drawing conventions** and their tokens.

All tokens below live in [`packages/ui/src/theme.css`](../../packages/ui/src/theme.css). The renderer reads them with `getComputedStyle(document.documentElement)`, re-reads them when the theme changes, and never hard-codes a color, a width or a font.

## Principles

- **The drawing scales, the pen does not.** Geometry (wall thickness, lengths) follows the zoom; line widths, handle sizes, dash patterns, hatch spacing and text sizes are **constant in screen pixels**. The paper grain is attached to the drawing (see the paper texture).
- **Crisp lines.** Strokes are straight and precise; the handcrafted feel comes from the paper and the handwritten labels, never from wobbly geometry.
- **Never color alone.** Every state also changes shape: handles for selection, a halo for hover, hatching for invalid elements, dashes for guides.

## Line widths

| Token | Value | Use |
|---|---|---|
| `--plan-stroke-fine` | 1 px | Dimension and extension lines, snapping guides, hatching, door swings, window panes |
| `--plan-stroke-medium` | 1.5 px | Wall edges, furniture outlines, room outlines |
| `--plan-stroke-bold` | 2 px | Selection outline, invalid outline, marquee |

## Elements

| Element | Drawing |
|---|---|
| **Wall** | Filled solid with `plan-wall` (poché), edges in `--plan-stroke-medium`. Joints are merged: no line between two joined walls. |
| **Opening** | The wall is interrupted. **Door**: leaf as a fine line, swing as a fine quarter arc. **Window**: two fine lines on the wall faces and one in the middle (the pane). |
| **Room** | No fill (the paper shows through). Name centered in Architects Daughter (`--plan-text-room`), area under it in Inter tabular (`--plan-text-dimension`), e.g. `12.4 m²`. |
| **Furniture** | Outline in `--plan-stroke-medium`, filled with `plan-paper` so it hides what is under it. |
| **Dimension** | Fine line, **45° ticks** of `--plan-tick-size` at both ends, fine extension lines starting `--plan-extension-gap` from the measured point and running `--plan-extension-overshoot` past the dimension line. Value centered above the line, in Inter tabular (`--plan-text-dimension`), always readable from the bottom or the right. |
| **Label** | Architects Daughter (`--plan-text-label`), `plan-ink`. |

## States

| State | Drawing |
|---|---|
| **Hover** | A soft halo: the element's shape stroked with `plan-hover`, `--plan-hover-width` wide on each side, drawn **under** the element. The cursor also changes. |
| **Selected** | The element is drawn in `plan-selection` (a selected wall is filled with it), its dimensions in `plan-selection-text`, with square handles (`--plan-handle-size`, `plan-handle-fill` / `plan-handle-stroke`) at its ends or corners. With several elements selected, each is drawn in `plan-selection` and the handles go on the common bounding box. |
| **Marquee** | Rectangle in `plan-selection`, `--plan-stroke-bold`, dashed (`--plan-dash`), no fill. |
| **Invalid** (overlapping walls, opening wider than its wall…) | Outline in `plan-invalid` (`--plan-stroke-bold`) and **cross-hatching** in `plan-invalid` (`--plan-stroke-fine`, at 45° and 135°, every `--plan-hatch-spacing`), clipped to the element. The Properties panel also shows the reason, with an icon. |
| **Snapping guide** | Dashed (`--plan-dash`) fine line in `plan-guide`, across the whole view (alignments, extensions, angles). The snapped point is marked with a small cross of `--plan-tick-size`. |
| **Drawing in progress** | The element being drawn uses the normal style; its live length and angle use the dimension style. |

## Text

| Token | Value | Use |
|---|---|---|
| `--plan-font-label` | Architects Daughter | Labels, room names |
| `--plan-font-dimension` | Inter, tabular figures | Dimensions, areas, live values |
| `--plan-text-dimension` | 11 px | Dimensions, areas |
| `--plan-text-label` | 14 px | Labels |
| `--plan-text-room` | 16 px | Room names |

Fonts are bundled. Before the first draw, the renderer waits for `document.fonts.load()` on both fonts, so the canvas never falls back to a system font.

## Other tokens

| Token | Value | Use |
|---|---|---|
| `--plan-handle-size` | 8 px | Side of selection handles |
| `--plan-tick-size` | 8 px | Dimension ticks, snapped-point cross |
| `--plan-extension-gap` | 4 px | Gap between a measured point and its extension line |
| `--plan-extension-overshoot` | 4 px | Extension line past the dimension line |
| `--plan-hover-width` | 6 px | Halo width on each side |
| `--plan-hatch-spacing` | 6 px | Spacing of invalid cross-hatching |
| `--plan-dash` | `4 4` | Dash pattern (guides, marquee), for `setLineDash` |

## Open questions

- Grid: none for now; the paper is the background. To decide when snapping is specified.
- Other levels: whether the level below is shown faintly under the current one.
