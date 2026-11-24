# ADR-0022: Work-in-progress specs (`@wip`)

- **Status**: Accepted
- **Date**: 2026-11-24

## Context

The maintainer sometimes writes a spec before the features it depends on exist. For example, `specs/app/start-screen.feature` (Open project, Recent projects) needs the open and save feature, which is not specified yet.

With ADR-0011 and ADR-0018, such a spec breaks `pnpm check` for every other feature: playwright-bdd fails when a step has no definition, and `check-scenario-coverage.sh` fails when an `@unit` scenario has no test. Keeping the spec outside `specs/` loses it from the place where specs live.

## Decision

- A `Feature` or a scenario tagged **`@wip`** is written but not implemented yet.
- Playwright does not run `@wip` scenarios (`tags: '<level> and not @wip'` in `playwright.config.ts`), so their steps need no definition.
- `scripts/factory/check-scenario-coverage.sh` still counts `@wip` identifiers for uniqueness, but requires no test for them. Feature tags apply to every scenario of the file.
- Only the maintainer adds or removes `@wip`, like the rest of the spec (ADR-0011). Removing it is the moment the spec enters the agent factory (`/implement`).

## Alternatives considered

- **Keep future specs in `docs/drafts/`**: rejected by the maintainer; specs belong in `specs/`.
- **Write failing tests right away**: `pnpm check` would stay red on `main`.

## Consequences

**Positive**
- Specs can be written in advance, in their final place, without blocking other features.

**Negative / risks**
- A `@wip` spec can drift from the code that lands meanwhile; it must be reread before `@wip` is removed.
