# ADR-0006: Geometry kernel: manifold-3d, clipper2, earcut in Workers

- **Status**: Accepted
- **Date**: 2026-10-31

## Context

Geometry is the trickiest part of interior design software:
- clean joints between walls (corners, T-junctions, curved walls, walls of different heights);
- cutting doors and windows out of walls;
- computing rooms, floors and ceilings from polygons;
- exact areas and quantities.

These computations must be robust (no holes, no degenerate faces) and must never block the UI.

## Decision

- **manifold-3d** (WASM, Apache-2.0) for 3D boolean operations: openings in walls, and volumes in general.
- **clipper2** for 2D polygon operations: offsetting for wall thickness, union, intersection, joints.
- **earcut** for triangulating floors, ceilings and planar faces.
- Expensive computations run in **Web Workers**. The `geometry` package exposes an asynchronous API.
- `geometry` is **pure and deterministic**: same inputs, same output, with no dependency on Three.js or the DOM.
- Geometric invariants are covered by **property-based tests** (fast-check, see ADR-0013).

## Alternatives considered

- **three-bvh-csg**: booleans directly on Three.js objects, but less robust than Manifold on edge cases, and ties geometry to the rendering engine.
- **Full CAD kernel (OpenCascade.js)**: very powerful, but heavy (tens of MB of WASM) and oversized for this need.
- **Custom geometry**: total control, but the edge cases of booleans and offsets are a bottomless pit.

## Consequences

**Positive**
- Robust geometry built on proven libraries.
- Smooth UI thanks to Workers.
- Geometry can be tested without a browser or GPU.

**Negative / risks**
- Data exchange between threads: transferable buffers are needed to avoid copies.
- Asynchronous loading of WASM modules must be handled at startup.
- Licenses of WASM libraries must be rechecked on every upgrade (automated check, ADR-0014).
