#!/usr/bin/env bash
# Checks that nothing under tests/ changed after the "red tests" commit of the current branch (ADR-0012).
# Usage: scripts/factory/check-acceptance-frozen.sh [base-ref]   (default base: origin/main, then main)
set -euo pipefail

root="$(git rev-parse --show-toplevel)"
cd "$root"

base="${1:-}"
if [ -z "$base" ]; then
  if git rev-parse --verify -q origin/main >/dev/null; then base=origin/main; else base=main; fi
fi

red="$(git log --format=%H --grep='^test: red tests for' "$base..HEAD" | tail -n 1)"
if [ -z "$red" ]; then
  echo "No 'test: red tests for ...' commit on this branch since $base: nothing to check."
  exit 0
fi

changed="$(git diff --name-only "$red" HEAD -- tests)"
if [ -n "$changed" ]; then
  echo "Files under tests/ changed after the red tests commit ${red:0:10}:"
  echo "$changed" | sed 's/^/  /'
  exit 1
fi
echo "tests/ unchanged since the red tests commit ${red:0:10}."
