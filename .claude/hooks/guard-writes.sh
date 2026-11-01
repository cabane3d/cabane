#!/usr/bin/env bash
# PreToolUse hook (Edit|Write|NotebookEdit): restricts which paths a factory agent may write to.
# Usage: guard-writes.sh <test-writer|coder>
# Exit 2 blocks the tool call; stderr is shown to the agent.
set -euo pipefail

role="${1:?usage: guard-writes.sh <role>}"
command -v jq >/dev/null || { echo "guard-writes.sh requires jq" >&2; exit 2; }

input="$(cat)"
path="$(jq -r '.tool_input.file_path // .tool_input.notebook_path // empty' <<<"$input")"
[ -z "$path" ] && exit 0

root="${CLAUDE_PROJECT_DIR:-$(pwd)}"
rel="$(realpath -m --relative-to="$root" "$path")"

deny() {
  echo "Blocked for $role: $1 ($rel). If you believe this file must change, stop and report it to the maintainer." >&2
  exit 2
}

case "$rel" in
  ..*) deny "path is outside the repository" ;;
esac

# Paths no factory agent may touch.
case "$rel" in
  specs/*) deny "specs belong to the maintainer (ADR-0011)" ;;
  docs/adr/*) deny "ADRs are changed only by the maintainer" ;;
  AGENTS.md | CLAUDE.md) deny "agent instructions are changed only by the maintainer" ;;
  .claude/*) deny "factory configuration is changed only by the maintainer" ;;
  .github/*) deny "CI configuration is changed only by the maintainer" ;;
  scripts/factory/*) deny "factory scripts are changed only by the maintainer" ;;
esac

case "$role" in
  test-writer)
    case "$rel" in
      tests/*) exit 0 ;;
      packages/*.test.ts | packages/*.test.tsx | apps/*.test.ts | apps/*.test.tsx) exit 0 ;;
      *) deny "test-writer may only write to tests/** and *.test.ts(x) files" ;;
    esac
    ;;
  coder)
    case "$rel" in
      tests/*) deny "acceptance tests, step definitions and fixtures are frozen during implementation (ADR-0012)" ;;
      */__snapshots__/*) deny "snapshots are owned by test-writer; a snapshot mismatch must be reported, not overwritten" ;;
      *) exit 0 ;;
    esac
    ;;
  *)
    deny "unknown role"
    ;;
esac
