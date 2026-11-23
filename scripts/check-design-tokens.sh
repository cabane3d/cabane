#!/usr/bin/env bash
# Design tokens guard (ADR-0019, ADR-0021): raw colors, arbitrary Tailwind values, rounded corners,
# shadows and raw stacking numbers are forbidden outside packages/ui/src/theme.css. Use the tokens.
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
  # Arbitrary values that bypass the spacing, size, type and layer scales (ADR-0021):
  # p-[13px], h-[30px], text-[15px], z-[5]… Use a scale step or add a token.
  "(^|[[:space:]\"'\`:!])-?(p[xytrblse]?|m[xytrblse]?|gap(-[xy])?|space-[xy]|w|h|size|min-[wh]|max-[wh]|inset(-[xy])?|top|right|bottom|left|start|end|translate-[xy]|text|leading|tracking|font|z)-\["
  # Raw stacking numbers: use z-(--layer-…)
  "(^|[[:space:]\"'\`:!])-?z-[0-9]+\b"
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
  echo "Raw colors, arbitrary values, radii, shadows or z-index found. Use the design tokens from packages/ui/src/theme.css (ADR-0019, ADR-0021)."
fi
exit "$status"
