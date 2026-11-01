#!/usr/bin/env bash
# Design tokens guard (ADR-0019): raw colors, arbitrary Tailwind colors, rounded corners and
# shadows are forbidden outside packages/ui/src/theme.css. Use the tokens instead.
set -euo pipefail

root="$(git rev-parse --show-toplevel)"
cd "$root"

patterns=(
  # Hex colors in strings or CSS declarations: '#ff812c', "#fff", color: #292f36
  "['\"\`]#[0-9a-fA-F]{3,8}['\"\`]"
  ':[[:space:]]*#[0-9a-fA-F]{3,8}\b'
  # Functional colors
  '\b(rgba?|hsla?|oklch|oklab|lab|lch|hwb)\('
  # Tailwind arbitrary values that bypass the tokens
  '\b[a-z-]+-\[(#|rgb|hsl|oklch|color:)'
  '\b(rounded|shadow|drop-shadow|inset-shadow)(-[a-z0-9]+)*-\['
)

files="$(git ls-files --cached --others --exclude-standard -- \
  'packages/*/src/**' 'apps/*/src/**' | grep -E '\.(ts|tsx|css)$' | grep -v '^packages/ui/src/theme\.css$' || true)"
[ -z "$files" ] && exit 0

status=0
for pattern in "${patterns[@]}"; do
  # shellcheck disable=SC2086
  if matches="$(grep -nE "$pattern" $files)"; then
    echo "$matches"
    status=1
  fi
done

if [ "$status" -ne 0 ]; then
  echo
  echo "Raw colors, radii or shadows found. Use the design tokens from packages/ui/src/theme.css (ADR-0019)."
fi
exit "$status"
