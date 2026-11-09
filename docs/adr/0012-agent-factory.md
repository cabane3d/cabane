# ADR-0012: Agent factory and human review

- **Status**: Accepted, orchestration and review rounds amended by ADR-0020
- **Date**: 2026-10-31

## Context

The maintainer wants to focus on specs and review, and delegate writing code and tests to agents (Claude Code). The main risk of a single agent writing both the code and its tests is that it produces tests tailored to its implementation: they always pass without proving that the spec is met.

## Decision

**Three Claude Code subagents**, defined in `.claude/agents/`, with separate responsibilities and permissions:

| Agent         | Writes to                         | Role                                                                                                                                            |
| ------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `test-writer` | `tests/**`, spec step definitions | Turns the spec into acceptance and unit tests. **Proves they fail** before handing over                                                         |
| `coder`       | `packages/**`, `apps/**`          | Implements until all tests pass. **Forbidden** from modifying acceptance tests                                                                  |
| `reviewer`    | Nothing (read-only)               | Checks coverage of every scenario, compliance with ADRs, architecture, security and simplicity. Returns `APPROVED` or a ranked list of findings |

**Orchestration** through a Claude Code command (e.g. `/implement <spec>`):
1. `test-writer` → "red tests" commit;
2. `coder` → iterates until green;
3. `reviewer` → if there are findings, back to `coder`, with **at most 3 loops**. Beyond that, stop and report to the maintainer;
4. open a PR.

**Technical guardrails**, not relying on prompts:
- **Claude Code hooks**: block writes to `tests/acceptance/**` during the coding phase; run lint and typecheck after each edit; require passing tests before a task is declared done;
- **independent CI check**: the PR fails if acceptance tests changed after the "red tests" commit;
- `AGENTS.md` summarizes conventions and links to the ADRs (`CLAUDE.md` imports it);
- **one Git worktree per feature**, so several factories can run in parallel.

**Human review**:
- branch protection on `main` requires **the maintainer's approval**;
- the maintainer may run a second review in a fresh context (e.g. `/code-review`) before approving;
- `CODEOWNERS` assigns every PR to the maintainer automatically.

Agents run **locally** at first. Running them in CI (`claude -p` or `anthropics/claude-code-action`, using the subscription token rather than a pay-per-use API key) may be added later.

## Alternatives considered

- **A single general-purpose agent**: simpler, but no separation between writing and verifying.
- **Code first, tests afterwards**: tests confirm the implementation instead of checking the spec.
- **Rules in prompts only**: an agent can break them; only technical guardrails (hooks, CI) are reliable.

## Consequences

**Positive**
- The spec remains the arbiter: code must satisfy tests written without it.
- The maintainer steps in at the two high-value points: the spec and the final review.

**Negative / risks**
- If the spec is ambiguous, `test-writer` may write wrong tests that `coder` will faithfully satisfy. Spec quality is critical.
- Unit tests written by `coder` may be weak: mutation testing (ADR-0013) is the countermeasure.
- Higher Claude usage than with a single agent.
- Agent prompts will need tuning over the first features.
