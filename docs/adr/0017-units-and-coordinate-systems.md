# ADR-0017: Units and coordinate systems

- **Status**: Accepted
- **Date**: 2026-10-31

## Context

Every layer handles dimensions: document, geometry, import, rendering, AI, specs. Without a single convention, unit errors (×10, ×1000) and axis errors (inverted Y, vertical Y or not) become a source of silent bugs, all the more likely with several agents writing code independently.

The trade (kitchen fitters, carpenters, architectural drawings) thinks in **millimeters**. Imported formats use various units and axis conventions. Three.js and its physically based lighting assume a scene in **meters**.

## Decision

**Lengths**
- The length unit of the `core` model is the **millimeter**.
- Values are JavaScript `number`s (double precision), **not necessarily integers**: the intersection of two oblique walls does not land on a round millimeter, and rounding computed points would accumulate errors. Snapping and user input naturally produce round values.
- Geometric comparisons use a single **tolerance** defined in `core` (order of magnitude: 0.01 mm), never `===`.
- Areas are expressed in **mm²** in the model and converted to m² only for display.
- A nominal (branded) type `Mm` distinguishes millimeters from other numbers, so the compiler catches mix-ups.

**Angles**
- **Radians** in the model; converted to degrees only for display and input.

**Coordinate system**
- Plan coordinates: **X to the right, Y up** on the plan (mathematical convention), **Z vertical**, origin on the floor of level 0.
- Elevations (levels, window sills, furniture heights) are in mm along Z.

**Conversions at boundaries**, and only there:
- **Importers**: each importer converts its format's units, axes and rotation conventions (e.g. Sweet Home 3D: centimeters × 10, plan Y axis pointing down).
- **Three.js rendering**: conversion to **meters** (× 0.001) and to Three.js's Y-up frame, centralized in a single function in `renderer`.
- **2D plan**: switch to screen coordinates (Y down) in the view transform, not in the model.
- **Display**: formatting according to user preferences (mm, cm, m; imperial units later).
- **AI**: tools exposed to models document their units explicitly (mm, degrees for input); conversion happens inside the command.

**Gherkin specs**
- Values are written **with their unit** (`a 3.5 m wall`, `a 200 mm thickness`). Step definitions convert them, keeping specs readable and unambiguous.

## Alternatives considered

- **Integer millimeters**: exact for entered values, but computed points must be rounded, which accumulates errors and breaks wall joints.
- **Floating-point meters**: natural for Three.js, but less meaningful to the trade, and a source of numbers like `0.30000000000000004` in tests and specs.
- **Centimeters**: rarely used by professionals for fine dimensions.

## Consequences

**Positive**
- A single unit across the whole domain; conversions are isolated and tested.
- Values in tests and JSON documents are readable (`3500` rather than `3.5` or `350`).
- The `Mm` type catches unit errors at compile time.

**Negative / risks**
- The conversion to Three.js meters must be strictly centralized: a missed conversion produces a scene 1000 times too large.
- The comparison tolerance must be applied everywhere; a property-based test (fast-check) checks it on geometric operations.
