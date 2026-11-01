# ADR-0011: Executable Gherkin specifications

- **Status**: Accepted, file format amended by ADR-0018
- **Date**: 2026-10-31

## Context

Development is delegated to agents (ADR-0012). We need a source of truth that is readable by a human, understandable by an agent and **automatically verifiable**, so that "done" has an objective meaning.

## Decision

- Each feature is described in `specs/<domain>/<feature>.feature.md`: **Markdown with Gherkin** (a format recognized by Cucumber). Free text gives the context and business rules; Gherkin blocks are the executable acceptance criteria.
- Specs are written **in English**, with standard English Gherkin keywords (`Feature`, `Scenario`, `Given`, `When`, `Then`).
- Specs are written by the **maintainer**. Agents do not modify them: when they spot an ambiguity, they report it.
- Each scenario has:
  - a **unique identifier** (`@WALL-012`), enabling spec → test traceability;
  - a **level tag** stating where it runs: `@unit`, `@e2e`, `@electron`, `@visual`, and later `@collab`.
- Multiple cases are expressed with `Scenario Outline` + `Examples`.
- Values are written **with their unit** (`a 3.5 m wall`, `a 200 mm thickness`, see ADR-0017).
- A feature is **done** when all its scenarios pass in CI.
- A CI script checks that **every scenario identifier is implemented** by at least one test.

## Alternatives considered

- **Plain `.feature` files**: universally supported, but business context ends up in comments or a separate file.
- **Free-form prose specs**: expressive, but not executable; "done" becomes subjective.
- **Writing tests directly, without specs**: no source of truth independent from the code, so agents validate their own interpretation.

## Consequences

**Positive**
- Objective acceptance criteria for agents and maintainer alike.
- Living functional documentation, always in sync with actual behavior.

**Negative / risks**
- **To verify during setup**: not every runner reads `.feature.md` (playwright-bdd in particular, see ADR-0013). If not, fallback: a `spec.md` (context) and a plain `.feature` side by side, with the same identifier convention. That fallback would be recorded in an ADR superseding this one.
- Writing good specs takes time: it becomes the maintainer's main job.
