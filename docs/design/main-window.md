# Main window

Low-fidelity wireframe of Cabane's main window, and the vocabulary used in specs, code and tests.
It fixes **zones and names**, not the visual design.

## Wireframe

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ A  ☰ Menu   Untitled   ↶ ↷                                    [ 2D | 3D ]    │
├────┬─────────────────────────────────────────────────────────┬───────────────┤
│ B  │ D  Plan view (2D)          — or —          E  3D view    │ F  Properties │
│    │                                                         │               │
│ ⌖  │                                                         │ Selected:     │
│ ▭  │            ┌───────────────────┐                        │   Wall        │
│ ◻  │            │                   │                        │ Length        │
│ ⊓  │            │                   │                        │   3500 mm     │
│ ↔  │            │                   │                        │ Thickness     │
│ T  │            └───────────────────┘                        │   200 mm      │
│    │                                                         │ Height        │
│ ▤  │  [ Level 0 ] [ + ]                                      │   2500 mm     │
├────┴─────────────────────────────────────────────────────────┴───────────────┤
│ G  x 1250 mm · y 830 mm   Snap: on                     Units: mm · Zoom 100% │
└──────────────────────────────────────────────────────────────────────────────┘

Catalog drawer (C), opened from the tool bar, slides over the plan view from the left:

├────┬──────────────────┬──────────────────────────────────────┤
│ B  │ C  Catalog     ✕ │  D  Plan view (partly covered)       │
│    │ [ Search…      ] │                                      │
│    │ Living room      │                                      │
│    │ Kitchen          │                                      │
│    │ Bedroom          │                                      │
│    │ Bathroom         │                                      │
│    │ Doors, windows   │                                      │
```

## Layout decisions

- **One view at a time**: the plan view and the 3D view are never shown together. The view switcher in the top bar toggles between them. A split view may come later.
- **Catalog as a drawer**: hidden by default, opened from the tool bar, closed with its close button or Escape. It leaves the whole width to the plan when closed.
- **Level tabs** at the bottom of the plan view, with a button to add a level.
- **No AI assistant** in the interface for now.

## Glossary

Specs use these exact names. In the UI, each zone exposes the same name as its accessible name (`aria-label` or visible label), so E2E tests find it with `getByRole(role, { name })`.

| Name | Role | Description |
|---|---|---|
| Main window | — | The whole application window |
| Top bar | `banner` | Menu, project name, undo, redo, view switcher |
| Project name | — | Name of the open project, `Untitled` until saved |
| Undo / Redo | `button` | Undo or redo the last document change |
| View switcher | `radiogroup` | Choice between `2D` and `3D` |
| Tool bar | `toolbar` | Creation and editing tools; one tool is active at a time |
| Select tool | `button` | Select and move elements (the default tool) |
| Wall tool | `button` | Draw walls in the plan view |
| Room tool | `button` | Create rooms (floors and ceilings) |
| Opening tool | `button` | Place doors and windows in walls |
| Dimension tool | `button` | Add dimension lines |
| Label tool | `button` | Add text labels |
| Catalog button | `button` | Opens and closes the catalog drawer |
| Catalog | `dialog` (non-modal drawer) | Furniture by category, with a search field |
| Plan view | `region` | The 2D plan of the current level, where elements are drawn |
| 3D view | `region` | The 3D rendering of the project |
| Level tabs | `tablist` | One tab per level; the selected tab is the current level |
| Add level | `button` | Adds a level above the highest one |
| Properties | `complementary` | Properties of the selected elements, editable |
| Status bar | `contentinfo` | Cursor position, snapping state, display units, zoom |
