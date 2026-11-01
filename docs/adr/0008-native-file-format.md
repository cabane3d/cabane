# ADR-0008: Native file format (`.cabn`)

- **Status**: Accepted
- **Date**: 2026-10-31

## Context

Projects are saved as local files (ADR-0002). The format must:
- faithfully preserve the Yjs document (ADR-0004), including for future collaboration;
- embed resources (3D models, textures, background images) so that a file is self-contained and shareable;
- remain readable and recoverable by other tools, even without the application;
- evolve over time without breaking older files.

## Decision

Cabane's native format is a **ZIP archive** with the **`.cabn`** extension, containing:

```
manifest.json      format version, app version, date, metadata
document.yjs       binary Yjs state: the source of truth
document.json      human-readable snapshot of the document (recovery, third-party tools, diffing)
assets/<sha256>.*  resources named by their hash (no duplicates)
thumbnail.png      preview for file explorers and the start screen
```

- `document.yjs` is authoritative. `document.json` is regenerated on every save; if it diverges, it is ignored.
- The **format version** in `manifest.json` drives **migrations** on open. A file created by a newer app version is opened read-only, with a warning.
- **Atomic** saving: write to a temporary file, then rename, so a crash never corrupts a project.
- A periodic **autosave** is kept in the application data folder for crash recovery.

## Alternatives considered

- **A single JSON file**: simple, but binary resources would be base64-encoded (heavy), and the Yjs history would be lost.
- **SQLite database**: robust and queryable, but less transparent and harder to inspect or repair by hand.
- **Project folder** (several files): Git-friendly, but less convenient to share than a single file.

## Consequences

**Positive**
- A self-contained file, easy to share or email.
- Inspectable with any ZIP tool.
- Deduplicated resources.

**Negative / risks**
- Large projects require rewriting the archive on each save; this can be optimized later (uncompressed resources, incremental writes).
- Keeping `document.json` in sync requires some discipline, covered by tests.

## Notes

- `.cabn` was chosen among `.cb3d`, `.cabn`, `.cabane` and `.cbn`: short, no known collision, and reads as "cabane". `.cab` is excluded (Microsoft Cabinet archives).
- Internal units are defined by ADR-0017.
