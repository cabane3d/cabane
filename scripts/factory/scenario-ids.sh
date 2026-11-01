#!/usr/bin/env bash
# Lists the scenario identifiers (e.g. @WALL-012) declared in one or more spec files.
# Usage: scripts/factory/scenario-ids.sh specs/walls/draw-walls.feature [...]
set -euo pipefail

[ "$#" -ge 1 ] || { echo "usage: $0 <spec.feature>..." >&2; exit 64; }
grep -hE '^[[:space:]]*@' "$@" | grep -oE '@[A-Z][A-Z0-9]*-[0-9]{3}\b' | sort -u
