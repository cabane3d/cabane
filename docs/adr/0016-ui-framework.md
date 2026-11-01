# ADR-0016: UI framework: React

- **Status**: Accepted
- **Date**: 2026-10-31

## Context

The editor UI includes panels (catalog, properties, levels), toolbars, dialogs, a command palette and AI settings. The 2D/3D rendering engine is framework-independent (ADR-0005) and the document lives in Yjs (ADR-0004). The framework therefore only handles the UI around the canvas.

The project does not accept external contributions (ADR-0001): the contributor pool is not a criterion. The criteria are:
1. the maintainer's productivity;
2. the quality of code AI agents produce with the framework;
3. the ecosystem of accessible components (menus, dialogs, virtualized lists…);
4. performance for an editor with a lot of reactive state.

## Options considered

### React

- **+** The largest ecosystem (Radix UI, shadcn/ui, React Aria, TanStack), and the framework AI agents master best.
- **+** Straightforward bindings to Yjs and Zustand.
- **−** More verbose; re-renders must be watched in a dense editor.

### Svelte 5

- **+** Fine-grained reactivity with runes, concise code, excellent performance.
- **+** Bits UI / shadcn-svelte for accessible components.
- **−** Smaller ecosystem; agents often produce outdated Svelte 4 code.

### SolidJS

- **+** Fine-grained reactivity, React-like syntax, excellent performance.
- **+** Kobalte for accessible components.
- **−** The smallest ecosystem of the three; less training material for agents.

## Decision

- The UI is written in **React**, built with **Vite** (via electron-vite, ADR-0002).
- **Zustand** manages ephemeral UI state (selection, active tool, panels). The document stays in Yjs (ADR-0004); React subscribes to it through dedicated hooks from `core`.
- Base components come from **shadcn/ui** (on **Radix UI**), styled with **Tailwind CSS**.
- The 2D/3D rendering engine is mounted inside a React component but driven imperatively (ADR-0005). **react-three-fiber is not used.**

Criterion 2 (quality of agent-produced code) weighs heavily in an agent factory model (ADR-0012). React's performance drawbacks are limited here, since the 2D/3D canvas does not depend on it.

## Consequences

**Positive**
- Agents produce reliable, idiomatic React code.
- Wide choice of accessible components and libraries (virtualized lists, drag and drop, keyboard shortcuts).

**Negative / risks**
- Re-renders must be controlled: fine-grained Yjs and Zustand subscriptions (selectors), and no frequently changing state (pointer position, camera) in React.
