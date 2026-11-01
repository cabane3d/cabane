#!/usr/bin/env bash
# PostToolUse hook (Edit|Write): formats the edited file with Biome and reports remaining lint errors.
# Does nothing until the project is scaffolded (no local Biome binary).
# Exit 2 sends stderr back to the agent as feedback; the edit itself is kept.
set -uo pipefail

command -v jq >/dev/null || exit 0
root="${CLAUDE_PROJECT_DIR:-$(pwd)}"
biome="$root/node_modules/.bin/biome"
[ -x "$biome" ] || exit 0

path="$(jq -r '.tool_input.file_path // empty' <<<"$(cat)")"
[ -z "$path" ] && exit 0
case "$path" in
  *.ts | *.tsx | *.js | *.jsx | *.mjs | *.cjs | *.json | *.jsonc | *.css) ;;
  *) exit 0 ;;
esac

if ! out="$("$biome" check --write --no-errors-on-unmatched "$path" 2>&1)"; then
  echo "Biome reports issues in $path:" >&2
  echo "$out" | tail -n 40 >&2
  exit 2
fi
exit 0
