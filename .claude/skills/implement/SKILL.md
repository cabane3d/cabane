---
name: implement
description: Runs the Cabane agent factory on a spec (test-writer → coder → reviewer) and opens a draft PR for maintainer review.
argument-hint: <specs/<domain>/<feature>.feature>
disable-model-invocation: true
---

# /implement

Run the agent factory (ADR-0012) on the spec: `$ARGUMENTS`.

You are the **orchestrator**. You do not write code or tests yourself: you delegate to the `test-writer`, `coder` and `reviewer` subagents, check their work with the factory scripts, commit, and report. Stop and ask the maintainer whenever a step below says so.

## 0. Preconditions

Derive `<feature>` from the spec file name (without `.feature`). The spec is written by the maintainer and lands in the same PR as its implementation, so the factory runs on the branch `feat/<feature>`, which normally already exists and holds the committed spec.

Stop and report if any of these fails:
- The spec file exists and is under `specs/`.
- The working tree is clean (`git status --porcelain` is empty).
- The project is scaffolded: `package.json` defines a `check` script.
- `scripts/factory/scenario-ids.sh <spec>` returns at least one identifier.

Then choose the branch:
- **Current branch is `feat/<feature>`** and the spec is committed on it: work on it.
- **Current branch is `main`** and `feat/<feature>` does not exist: create it from `main`, commit the spec on it if it is not committed yet (`docs(spec): add <feature> specification`), and work on it.
- **Anything else** (another branch, or `feat/<feature>` exists but is not checked out): stop and ask.

If the branch already contains a `test: red tests for <feature>` commit, a previous run started: stop and ask whether to resume from the next step or start over.

Record the base ref: `main`.

## 1. Red tests (test-writer)

1. Launch the `test-writer` subagent with: the spec path, the scenario identifiers, and a reminder to report any ambiguity instead of guessing.
2. If it reports spec ambiguities, **stop**: show the questions to the maintainer and end.
3. Check its work yourself:
   - `scripts/factory/check-scenario-coverage.sh <spec>` passes;
   - the new tests fail, and for the reason test-writer stated (run the relevant `pnpm test` / `pnpm test:e2e` commands and read the failures).
     If a check fails, send test-writer back with the precise problem (at most 2 times, then stop and report).
4. Commit: `test: red tests for <feature>` (Conventional Commits; body: the scenario identifiers).

## 2. Implementation (coder)

1. Launch the `coder` subagent with: the spec path, the list of test files, and the base ref.
2. If coder reports a blocker (a wrong test, an ambiguous spec, a missing decision), **stop**: show the blocker to the maintainer and end. Do not let anyone change the tests.
3. Check yourself:
   - `pnpm check` passes;
   - `scripts/factory/check-acceptance-frozen.sh main` passes.
4. Commit: `feat(<scope>): <summary>` (scope = main package touched).

## 3. Review loop (reviewer ↔ coder)

Repeat at most **3 rounds**:
1. Launch the `reviewer` subagent with: the spec path, the base ref, and, from round 2 onward, its previous findings with coder's answers.
2. If the verdict is `APPROVED`, go to step 4.
3. Otherwise, launch `coder` with the full list of findings. After it finishes, re-run the step 2 checks and commit: `fix(<scope>): address review round <n>`.

If the reviewer has not approved after 3 rounds, **stop**: summarize the open findings and coder's position for the maintainer, leave the branch as is, and end.

## 4. Finalization

1. Final checks: `pnpm check`, `scripts/factory/check-scenario-coverage.sh <spec>`, `scripts/factory/check-acceptance-frozen.sh main`.
2. If an `origin` remote exists and `gh` is authenticated: push the branch and open a **draft** PR to `main`. Otherwise, skip this step and say so.
   - PR title: `feat: <feature>`.
   - PR body: the spec path; the table of scenarios → tests; a summary of the implementation; new dependencies with licenses; the reviewer's minor findings and notes; the questions for the maintainer. End with the PR attribution line from the session instructions.
3. Final report to the maintainer, in French:
   - the outcome (PR link, or branch name);
   - the number of review rounds;
   - what deserves particular attention during their manual review (risky areas, reviewer notes, shortcuts reported by coder).

Never merge. Merging is the maintainer's decision, after their own review.
