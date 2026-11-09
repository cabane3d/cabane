# ADR-0020: Review on the pull request, with a maintainer gate

- **Status**: Accepted
- **Date**: 2026-11-04
- **Amends**: ADR-0012 (orchestration and human review)

## Context

In ADR-0012, the reviewer's findings go straight back to coder, for up to three rounds, and the pull request is only opened at the end. The maintainer sees neither the findings nor coder's answers, and cannot add their own feedback until every agent round is over, when it would take a new run to address it.

## Decision

**The pull request is the review surface.** `/implement` opens a **draft** PR right after the first green implementation, before any review.

**Each review round**:
1. `reviewer` returns its verdict as a JSON object. Every finding has a **severity** (`blocker`, `major`, `minor`), a **problem** and a **proposed fix**, and the location it concerns, with optional replacement code;
2. the orchestrator posts it with `scripts/factory/post-review.sh`, as one GitHub review: findings on lines of the PR diff become **inline comments** (replacement code becomes a GitHub suggestion), the others go to the review body;
3. **maintainer gate**: the orchestrator stops. The maintainer adds their own comments on the PR, resolves the threads they consider settled, then tells the orchestrator to continue, finalize or stop;
4. on "continue", the orchestrator collects the open feedback (`scripts/factory/fetch-pr-feedback.sh`) and hands it to `coder`. Maintainer comments take precedence over reviewer findings. The orchestrator commits, pushes, and posts coder's answers in each thread, plus a summary comment that closes the round (`scripts/factory/reply-pr-feedback.sh`).

**Roles stay as in ADR-0012**: `reviewer` stays read-only and has no GitHub access; `coder` has no GitHub access either. Only the orchestrator talks to GitHub, through the factory scripts. Every comment is posted from the maintainer's account, so hidden HTML markers (`<!-- cabane-reviewer -->`, `<!-- cabane-finding -->`, `<!-- cabane-factory -->`) tell the factory's comments from the maintainer's.

**The review is a `COMMENT` review.** GitHub refuses approvals and change requests on one's own pull request, so the verdict is written in the review body. The merge approval required by branch protection remains the maintainer's alone.

**Round limit**: after three rounds without approval, the orchestrator no longer proposes another round on its own; the maintainer decides.

## Alternatives considered

- **Reviewer posts on GitHub itself**: it would need `gh` and write access, while ADR-0012 keeps it read-only; and its Bash allowlist would have to accept arbitrary Markdown in command arguments.
- **Review in the terminal, then copied to the PR at the end**: the maintainer still could not weigh in before coder's fixes.
- **Formal `REQUEST_CHANGES` / `APPROVE` reviews**: impossible from the PR author's account; it would require a separate bot account and token.

## Consequences

**Positive**
- The maintainer reads, completes and steers each review round where they already review code, and every exchange is kept on the PR.
- Findings are structured and anchored to lines, and simple fixes can be applied in one click.

**Negative / risks**
- The factory needs `gh` (authenticated) and `jq`, and a GitHub remote: it can no longer run fully offline.
- Each round now waits for the maintainer, so a feature takes longer end to end.
- Markers can be removed by editing a comment by hand; the factory then treats it as maintainer feedback.
- A finding on a line outside the diff cannot be inline, and goes to the review body.
