# ADR-0000: Record architecture decisions

- **Status**: Accepted
- **Date**: 2026-10-31

## Context

Most of the project will be developed by AI agents (coder, test-writer, reviewer) working from specifications. These agents start with no memory of past discussions: they only know what is written in the repository. Without a written record of decisions, they may question or contradict them, for example by adding a dependency incompatible with the license or bypassing the architecture.

## Decision

- Every structural decision is recorded in `docs/adr/` as a numbered Markdown file (`NNNN-title.md`) following [`template.md`](template.md), inspired by MADR.
- ADRs are written in English, like the rest of the project.
- An accepted ADR is not rewritten: it is superseded by a new one.
- `AGENTS.md` links to this index, and the reviewer agent checks that a diff contradicts no accepted ADR.

## Alternatives considered

- **Decisions in a wiki or external document**: outside the repository, hence invisible to agents and not versioned with the code.
- **Everything in `AGENTS.md`**: that file must stay short and operational; the full reasoning behind each decision would bloat it.

## Consequences

**Positive**
- Agents and future readers understand _why_ choices were made.
- Revisiting a decision becomes an explicit, traceable act.

**Negative / risks**
- Requires the discipline to write an ADR for every significant decision.
