# ADR-0018: Plain Gherkin `.feature` files

- **Status**: Accepted
- **Date**: 2026-10-31
- **Amends**: ADR-0011 (file format only)

## Context

ADR-0011 chose Markdown with Gherkin (`.feature.md`) and asked to verify runner support during setup. Verification with playwright-bdd 9.2: its feature loader always parses sources as plain Gherkin (`text/x.cucumber.gherkin+plain`), so `.feature.md` files are not supported.

ADR-0011 planned a fallback: a `spec.md` for context next to a plain `.feature`. Gherkin, however, already allows free-form description text under `Feature:`, which is enough to hold context and business rules in the same file.

## Decision

- Specs are plain Gherkin files: `specs/<domain>/<feature>.feature`.
- Context and business rules are written in the **description** of the `Feature` (free text between the `Feature:` line and the first scenario or `Background`). Plain-text lists are fine there.
- When a spec needs richer material (diagrams, images, long reference tables), it goes in an optional `specs/<domain>/<feature>.md` next to the `.feature`, which the description references.
- Every other rule of ADR-0011 (identifiers, level tags, units, ownership, definition of done) is unchanged.
- **Scenario traceability** (`scripts/factory/check-scenario-coverage.sh`): every scenario has exactly one identifier and at least one level tag; identifiers are unique; `@unit` scenarios must be referenced by a Vitest test. Scenarios tagged `@e2e`, `@electron` or `@visual` are executed by playwright-bdd, whose generation step fails when a step has no definition.
- A scenario may carry several level tags (for example `@e2e @electron`): it then runs in each corresponding Playwright project. Step definitions use the `appPage` fixture (`tests/support/fixtures.ts`), which is the browser renderer or the Electron window depending on the project.

## Alternatives considered

- **Pre-processing `.feature.md` into `.feature` before `bddgen`**: keeps the original format, but adds custom tooling, breaks line numbers in error messages, and loses editor support (Cucumber extensions, syntax highlighting).
- **Cucumber-js instead of playwright-bdd**: supports Markdown with Gherkin, but loses the Playwright integration chosen in ADR-0013.
- **`spec.md` + `.feature` for every spec** (the fallback planned in ADR-0011): two files to keep in sync when one is enough in most cases.

## Consequences

**Positive**
- Native support everywhere: playwright-bdd, editors, Cucumber tooling.
- A single file per feature in the common case.

**Negative / risks**
- Feature descriptions are plain text: no Markdown rendering for context.
