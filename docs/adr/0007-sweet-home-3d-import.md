# ADR-0007: Sweet Home 3D import only, via a clean-room implementation

- **Status**: Accepted
- **Date**: 2026-10-31

## Context

Sweet Home 3D has a large user base, many existing `.sh3d` files and a large community library of furniture (`.sh3f`) and textures (`.sh3t`). Being able to open them is a strong adoption driver.

A `.sh3d` file is a ZIP archive containing:
- `Home`: the model in **native Java serialization**, hard to read outside a JVM;
- `Home.xml`: the same model as **XML**, present since Sweet Home 3D 5.3;
- numbered folders with resources: 3D models (OBJ/MTL, sometimes 3DS/DAE), textures, icons.

Sweet Home 3D and its web version (SweetHome3DJS) are licensed under **GPL v2**, which is incompatible with reusing their code in an AGPL-3.0 project (ADR-0001).

## Decision

- Sweet Home 3D is the first format supported by the `importers` package, as its `sh3d` module. Other formats will follow through their own ADRs.
- The project **imports** Sweet Home 3D files but **does not export** them. Export to other formats will be covered by later ADRs.
- The importer reads **`Home.xml`**. Files without it (older than version 5.3) are rejected with a message inviting the user to re-save them with a recent version of Sweet Home 3D.
- The import covers, in priority order: levels, walls (straight, curved, sloped), rooms, doors and windows, furniture and groups, lights, dimension lines, labels, polylines, compass, cameras, environment, background image.
- **`.sh3f`** libraries (furniture) can be imported into the catalog; **`.sh3t`** (textures) comes second. **`.sh3p`** plugins (Java) are not supported.
- **Clean-room implementation**: it relies on the observed structure of the files and the published DTD of the XML format, **without copying or adapting** any code from Sweet Home 3D or SweetHome3DJS. This rule applies to every importer and is stated in `AGENTS.md`.
- The import runs in a **Web Worker** (files may be malformed or malicious), with size and decompression limits (zip bomb protection).
- Sweet Home 3D units and conventions (centimeters, angles in radians, plan Y axis pointing down) are converted at the boundary into the `core` model (ADR-0017).
- **Licenses and authors** of 3D models, when present in the metadata, are preserved and displayed.
- A **corpus of real `.sh3d` files** (`tests/fixtures/import/sh3d/`) serves as non-regression tests (ADR-0013).

## Alternatives considered

- **Reading the Java-serialized `Home` entry**: would open very old files, but requires writing a complete Java deserializer. High cost for marginal gain; postponed.
- **Import + export (round trip)**: would force the internal model to stay aligned with Sweet Home 3D's, and richer features would be lost on export. Postponed.
- **Reusing SweetHome3DJS's parser**: saves time, but would impose GPL v2, incompatible with ADR-0001.

## Consequences

**Positive**
- Sweet Home 3D users can migrate their projects and furniture libraries.
- The internal model remains free to evolve.
- No risk of license contamination.

**Negative / risks**
- Files older than version 5.3 cannot be opened directly.
- Properties added by third-party plugins are ignored, or preserved as-is without being interpreted.
- Imported scenes may look slightly different from Sweet Home 3D (lighting, materials): specs must define what "faithful" means.
- 3D models from community libraries have heterogeneous licenses: users must be informed.
