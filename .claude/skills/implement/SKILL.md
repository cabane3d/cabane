---
name: implement
description: Runs the Cabane agent factory on a spec (test-writer → coder → draft PR → reviewer on GitHub ↔ maintainer ↔ coder) for maintainer review.
argument-hint: <specs/<domain>/<feature>.feature>
disable-model-invocation: true
---

# /implement

Run the agent factory (ADR-0012, ADR-0020) on the spec: `$ARGUMENTS`.

You are the **orchestrator**. You do not write code or tests yourself: you delegate to the `test-writer`, `coder` and `reviewer` subagents, check their work with the factory scripts, commit, publish the review on the pull request, and report. Stop and ask the maintainer whenever a step below says so.

Reviews happen **on the GitHub pull request**: reviewer findings are posted there, the maintainer adds their own comments there, and coder only starts fixing once the maintainer says so. Write the JSON files these steps exchange to a temporary directory outside the working tree (`mktemp -d`), never into the repository.

## 0. Preconditions

Stop and report if any of these fails:
- The spec file exists and is under `specs/`.
- The working tree is clean (`git status --porcelain` is empty).
- The project is scaffolded: `package.json` defines a `check` script.
- `scripts/factory/scenario-ids.sh <spec>` returns at least one identifier.
- An `origin` remote exists, and `gh auth status` succeeds; `jq` is installed.

Then:
- Derive `<feature>` from the spec file name (without `.feature`).
- If the branch `feat/<feature>` does not exist, create it from `main` and go to step 1.
- If it exists, stop and ask whether to resume or start over. To resume, check it out and find where the factory stopped:
  - no open PR for the branch: resume at the first step whose commit is missing (step 1, 2 or 3);
  - an open PR: run `scripts/factory/fetch-pr-feedback.sh <pr> --all`; the latest `<!-- cabane-reviewer round=N -->` review gives the last round. If a `<!-- cabane-factory answers round=N -->` comment exists, resume at step 4 with round N+1; otherwise resume at step 4.3 (maintainer gate) of round N.
- Record the base ref: `main`.

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

## 3. Draft pull request

1. Push the branch and open a **draft** PR to `main`:
   - title: `feat: <feature>`;
   - body: the spec path; the table of scenarios → tests; a summary of the implementation; new dependencies with licenses; doubts and shortcuts reported by coder. End with the PR attribution line from the session instructions.
2. Record the PR number.

## 4. Review loop (reviewer → maintainer → coder)

Round `n` starts at 1. Each round:

1. **Review.** Run `scripts/factory/fetch-pr-feedback.sh <pr> --all` and launch the `reviewer` subagent with: the spec path, the base ref, the PR number, the round number `n`, and that JSON (previous findings, coder's answers, maintainer comments; empty in round 1).
2. **Publish.** Extract the JSON object from reviewer's answer into `review.json` and run `scripts/factory/post-review.sh <pr> review.json`. If the script rejects the file as invalid, send reviewer back once with the script's error; if it fails again, stop and report. The script posts findings on their lines when they are in the diff, the others in the review body, and resolves the reviewer threads reviewer declared resolved.
3. **Maintainer gate: stop.** Report to the maintainer, in French, and end your turn:
   - the link to the review, the verdict and the number of findings per severity;
   - that they can now add their own comments on the PR (inline on the Files changed tab, or in the conversation), resolve the threads they consider settled, and, if they used "Start a review", **submit** it so the comments are visible;
   - that they should then answer here: **continuer** (coder handles every open comment), **finaliser** (go to step 5), or **arrêter**.
   Never go past this point without the maintainer's answer. If they answer with instructions instead, they apply on top of the PR comments.
4. **Fixes.** On "continuer":
   1. Run `scripts/factory/fetch-pr-feedback.sh <pr>` (without `--all`): the threads with `needsAction: true` and the `general` items are what is left to handle.
   2. If there is nothing to handle, say so to the maintainer and go back to the gate (4.3) without a new review round.
   3. Launch `coder` with: the spec path, the base ref, that JSON, and the maintainer's instructions from the gate, if any.
   4. If coder reports a blocker, stop and report it, as in step 2.
   5. Re-run the step 2 checks, commit `fix(<scope>): address review round <n>`, and push.
   6. Build `answers.json` from coder's answer block, adding `round` (`n`) and `commit` (the new HEAD), and run `scripts/factory/reply-pr-feedback.sh <pr> answers.json`. Every handled item must have an answer: if coder skipped one, send it back before committing.
   7. Increment `n` and start the next round.

If reviewer has not approved after round 3, do not start a fourth round on your own: at the gate, add a summary of the open findings and coder's position, and let the maintainer decide (one more round, finalize, or stop).

## 5. Finalization

1. Final checks: `pnpm check`, `scripts/factory/check-scenario-coverage.sh <spec>`, `scripts/factory/check-acceptance-frozen.sh main`.
2. Update the PR body (`gh pr edit --body-file`): keep the step 3 content, and add the number of review rounds, the open minor findings and the reviewer's notes, and the questions for the maintainer. Leave the PR as a draft.
3. Final report to the maintainer, in French:
   - the PR link;
   - the number of review rounds;
   - what deserves particular attention during their final review (risky areas, disputed findings, shortcuts reported by coder).

Never merge, and never mark the PR ready for review. Both are the maintainer's decisions.
