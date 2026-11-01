# ADR-0003: TypeScript monorepo with pnpm and Turborepo

- **Status**: Accepted
- **Date**: 2026-10-31

## Context

The application spans distinct domains: document model, geometry, file import, rendering, AI, UI, and later a collaboration server. These domains must stay decoupled so they can be tested in isolation and so agents work within a clear scope. A single language across the stack simplifies tooling and code sharing.

## Decision

- **TypeScript in `strict` mode** everywhere.
- **Monorepo** managed with **pnpm workspaces** and **Turborepo** (build caching, running only affected packages).
- Packages are published under the **`@cabane3d/`** scope.
- Initial layout:

```
packages/
  core/          document model (Yjs), commands, units, versioned schema
  geometry/      wall joints, openings, triangulation (Workers + WASM)
  importers/     third-party formats into the core model, one module per format
  renderer/      Three.js 3D engine + 2D plan view
  ai/            provider abstraction + tools bound to core commands
  platform/      system access interface (files, secrets…)
  ui/            editor components
apps/
  desktop/       Electron application (main, preload, renderer)
```

- **Dependency rules**, enforced by **dependency-cruiser** in CI:
  - `core` depends on neither the UI, Three.js nor Electron;
  - `importers` depends only on `core` (and `geometry` if needed);
  - only `apps/desktop` knows about Electron;
  - no package imports Node.js directly, except the `main` process.

## Alternatives considered

- **Single package without workspaces**: simpler at first, but boundaries are not enforced by tooling and agents end up crossing them.
- **Nx**: more powerful (generators, project graph), but heavier and more intrusive than needed.
- **npm or Yarn workspaces**: pnpm is faster, disk-efficient and strict about phantom dependencies.

## Consequences

**Positive**
- Architecture boundaries are checked automatically.
- Incremental tests and builds, hence fast CI.
- Each package gives agents a clear scope.

**Negative / risks**
- Some initial setup (base tsconfig, package exports).
- The split may evolve: merging or splitting a package requires a new ADR.
