# ADR-0013: Testing strategy

- **Status**: Accepted
- **Date**: 2026-10-31

## Context

Code is written by agents (ADR-0012): the test suite is the main safety net, and it must run **autonomously**, locally and in CI. The application combines pure logic (document, geometry, import), 3D rendering, UI and Electron integration.

## Decision

| Level                | Tool                                          | Scope                                                                                                                                         |
| -------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit                 | **Vitest**                                    | `core`, `geometry`, `importers`, `ai`, `platform`                                                                                             |
| Property-based       | **fast-check**                                | Geometric invariants and round trips (e.g. "a closed room has an area > 0", "serializing then reading the document yields the same document") |
| Import corpora       | Vitest + snapshots                            | Real files per format in `tests/fixtures/import/<format>/`: import → JSON snapshot of the model                                               |
| Components           | **Vitest Browser Mode** (Playwright provider) | UI components in a real Chromium                                                                                                              |
| Acceptance / E2E     | **Playwright** + **playwright-bdd**           | `@e2e` Gherkin scenarios, run in **Chromium** with the fake `platform` implementation                                                         |
| Electron integration | Playwright `_electron`                        | `@electron` scenarios on the packaged app: files, IPC, opening from the OS, updates                                                           |
| Visual regression    | Playwright `toHaveScreenshot`                 | `@visual` scenarios: reference 2D and 3D scenes                                                                                               |
| Accessibility        | **@axe-core/playwright**                      | Built into E2E tests                                                                                                                          |
| AI                   | **Vercel AI SDK** mock model                  | Checks that the AI produces the right commands, with no real calls                                                                            |
| Test quality         | **Stryker** (mutation testing)                | Checks that tests actually catch bugs; runs nightly                                                                                           |
| Coverage             | Vitest (v8)                                   | Minimum threshold enforced in CI                                                                                                              |

**Determinism**:
- in CI, software 3D rendering (`--use-angle=swiftshader`), under **xvfb** for Electron;
- visual tests run in the **official Playwright Docker image**, with a fixed camera, animations disabled and a tolerance threshold;
- no network dependency in tests.

**Static analysis**, considered part of the test suite:
- TypeScript `strict`;
- **Biome** for linting and formatting (a single fast tool, ideal for agent hooks);
- **dependency-cruiser** for architecture boundaries (ADR-0003);
- **knip** for dead code and unused dependencies.

## Alternatives considered

- **ESLint + Prettier**: a larger rule ecosystem, but two tools to configure and much slower. Biome is enough for a TypeScript/React project; if an essential rule is missing, ESLint can be added for that rule only.
- **Jest**: slower and less integrated with Vite and ESM than Vitest.
- **Cypress**: drives Electron less well than Playwright, and handles multiple browser contexts less well (useful for future collaboration).
- **Cucumber-js alone for E2E**: less integrated with Playwright (traces, parallelism, fixtures) than playwright-bdd.
- **Testing everything in Electron**: realistic but slow; reserved for the `@electron` subset.

## Consequences

**Positive**
- Agents get a fast feedback loop (unit + Chromium E2E).
- Gherkin specs are executed as written.
- Mutation testing offsets agents' tendency to write overly lenient tests.

**Negative / risks**
- 3D visual tests are sensitive to Chromium and Three.js upgrades: reference images must be regenerated in a controlled way.
- Stryker is slow: it is limited to nightly runs and critical packages (`core`, `geometry`, `importers`).
- Import corpora must only contain files whose redistribution is allowed.

