# ADR-0005: Imperative Three.js 3D rendering and dedicated 2D plan

- **Status**: Accepted
- **Date**: 2026-10-31

## Context

The application shows two synchronized views of the same document: a precise **2D plan** (walls, dimensions, hatching, snapping) and a real-time **3D view**, ideally with high-quality rendering (PBR materials, lighting). Both views must stay smooth with several levels and hundreds of furniture pieces.

## Decision

- **3D view: Three.js**, used **imperatively** and encapsulated in the `renderer` package. The engine subscribes to document changes and updates the scene incrementally.
- **WebGL2** rendering at first, migrating to Three.js's **WebGPU** renderer once mature. Electron guarantees a recent Chromium (ADR-0002).
- **PBR** materials (`MeshStandardMaterial` / `MeshPhysicalMaterial`).
- Later, for photorealistic renders: **three-gpu-pathtracer**.
- **2D plan: a dedicated Canvas 2D renderer** in `renderer`, not an orthographic camera on the 3D scene. An architectural plan follows its own drawing conventions (line weights, hatching, dimensions, opening symbols).
- No business logic in the renderer: it reads the document and emits intents, which the UI translates into commands (ADR-0004).

## Alternatives considered

- **react-three-fiber**: pleasant for declarative scenes, but makes fine-grained performance control harder in an editor, and ties the engine to the UI framework.
- **Babylon.js**: a complete, solid engine, but heavier, with a smaller ecosystem of loaders and examples for this use case.
- **SVG 2D plan**: convenient for simple plans, but performance degrades with many elements.
- **PixiJS for the 2D plan**: an option if Canvas 2D reaches its limits; may be revisited through a new ADR.

## Consequences

**Positive**
- The rendering engine is independent of the UI framework (ADR-0016).
- Large Three.js ecosystem: OBJ/MTL/glTF loaders, post-processing, path tracing.
- The 2D plan can later be exported (PDF, SVG) with a clean look.

**Negative / risks**
- Two rendering engines to maintain.
- Incremental synchronization between the document and the scene requires rigor (memory leaks, GPU resources to release).
