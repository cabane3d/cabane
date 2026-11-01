# ADR-0004: Yjs (CRDT) document model and command layer

- **Status**: Accepted
- **Date**: 2026-10-31

## Context

The editor needs reliable undo/redo, robust saving and, eventually, real-time collaboration (a server edition for companies). Adding collaboration later to a conventional data model usually means rewriting the core of the application.

Several actors modify the document: the user through the UI, the AI, and later remote collaborators.

## Decision

- The document state (levels, walls, rooms, openings, furniture, dimensions, cameras…) is stored in a **Yjs document** from the very first version, even for single-user editing.
- **Undo/redo** relies on `Y.UndoManager`.
- **Every modification goes through a layer of typed, named commands** (`addWall`, `moveFurniture`, `setRoomFloorTexture`…). Commands:
  - validate their arguments;
  - run inside a Yjs transaction, so each one is a single undo step;
  - are the **only** entry point for the UI, the AI, the importer and tests.
- Ephemeral UI state (selection, active tool, zoom) is **not** stored in the Yjs document.
- The document schema is **versioned**, with explicit migrations.

## Alternatives considered

- **Conventional store (Redux/Zustand) + custom history**: simple at first, but collaboration and offline merging would have to be reinvented.
- **Automerge**: a comparable CRDT, but the Yjs ecosystem is richer (UndoManager, Hocuspocus server, sync providers).
- **Custom event sourcing**: flexible, but costly to design correctly for concurrent editing.

## Consequences

**Positive**
- Future collaboration amounts to plugging in a sync provider (WebSocket to a Hocuspocus server self-hosted by the company).
- Undo/redo and incremental saving for free.
- The AI manipulates the document through the same commands as the user: its actions are validated and undoable.
- Commands form a natural API for tests and Gherkin step definitions.

**Negative / risks**
- CRDTs do not guarantee business invariants (for example, a room stays a valid polygon after two concurrent edits). A normalization or validation step after merging will be needed.
- Yjs structures are less ergonomic than plain objects: a typed read layer on top of `core` is required.
- Moderate memory overhead from the CRDT history.
