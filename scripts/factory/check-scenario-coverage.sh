#!/usr/bin/env bash
# Checks spec → test traceability (ADR-0011):
#   - every scenario has exactly one identifier (e.g. @WALL-012) and at least one level tag;
#   - identifiers are unique across all specs;
#   - every @unit scenario is referenced by at least one Vitest test (tests/** or *.test.ts(x)).
# Scenarios tagged @e2e, @electron or @visual run through playwright-bdd, whose generation fails
# when a step has no definition, so they need no extra reference.
# Usage: scripts/factory/check-scenario-coverage.sh [spec.feature...]   (defaults to all specs)
set -euo pipefail

root="$(git rev-parse --show-toplevel)"
cd "$root"

if [ "$#" -eq 0 ]; then
  mapfile -t specs < <(find specs -name '*.feature' 2>/dev/null | sort)
else
  specs=("$@")
fi
[ "${#specs[@]}" -gt 0 ] || { echo "No spec found."; exit 0; }

# One line per scenario: "<file>:<line>\t<tags>", tags gathered from the tag lines above it.
scenarios="$(awk '
  /^[[:space:]]*@/ { tags = tags " " $0; next }
  /^[[:space:]]*(Scenario|Scenario Outline|Example):/ { gsub(/[[:space:]]+/, " ", tags); print FILENAME ":" FNR "\t" tags; tags = ""; next }
  /^[[:space:]]*(#.*)?$/ { next }
  { tags = "" }
' "${specs[@]}")"

errors=0
ids=()
while IFS=$'\t' read -r location tags; do
  [ -z "$location" ] && continue
  mapfile -t found < <(grep -oE '@[A-Z][A-Z0-9]*-[0-9]{3}\b' <<<"$tags" || true)
  if [ "${#found[@]}" -ne 1 ]; then
    echo "$location: expected exactly one scenario identifier, found ${#found[@]}"
    errors=$((errors + 1))
    continue
  fi
  id="${found[0]}"
  ids+=("$id")
  if ! grep -qE '@(unit|e2e|electron|visual|collab)\b' <<<"$tags"; then
    echo "$location: $id has no level tag (@unit, @e2e, @electron, @visual)"
    errors=$((errors + 1))
  fi
  if grep -qE '@unit\b' <<<"$tags" &&
     ! grep -rqF --include='*.test.ts' --include='*.test.tsx' --exclude-dir=node_modules -e "$id" tests packages apps 2>/dev/null; then
    echo "$location: $id is tagged @unit but no Vitest test references it"
    errors=$((errors + 1))
  fi
done <<<"$scenarios"

duplicates="$(printf '%s\n' "${ids[@]}" | sort | uniq -d)"
if [ -n "$duplicates" ]; then
  echo "Duplicate scenario identifiers:"
  echo "$duplicates" | sed 's/^/  /'
  errors=$((errors + 1))
fi

if [ "$errors" -gt 0 ]; then
  echo "$errors traceability error(s)."
  exit 1
fi
echo "${#ids[@]} scenario(s) traced."
