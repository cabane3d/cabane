#!/usr/bin/env bash
# SubagentStop hook for coder: refuses to let the agent finish while `pnpm check` fails.
# Skipped until the project defines a `check` script.
# A second stop attempt (stop_hook_active) is allowed through, so a stuck agent can report its blocker.
set -uo pipefail

command -v jq >/dev/null || exit 0
input="$(cat)"
[ "$(jq -r '.stop_hook_active // false' <<<"$input")" = "true" ] && exit 0

root="${CLAUDE_PROJECT_DIR:-$(pwd)}"
cd "$root" || exit 0
[ -f package.json ] && jq -e '.scripts.check' package.json >/dev/null 2>&1 || exit 0

if ! out="$(pnpm check 2>&1)"; then
  echo "pnpm check is failing. Fix it before finishing, or, if you are blocked, stop again and describe the blocker precisely." >&2
  echo "$out" | tail -n 80 >&2
  exit 2
fi
exit 0
