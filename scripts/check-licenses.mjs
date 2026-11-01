#!/usr/bin/env node
// Fails if any installed dependency has a license that is not known to be compatible with
// AGPL-3.0-or-later (ADR-0001). Extend ALLOWED only after checking compatibility.
import { execFileSync } from 'node:child_process';

const ALLOWED = new Set([
  '0BSD',
  'AGPL-3.0',
  'AGPL-3.0-only',
  'AGPL-3.0-or-later',
  'Apache-2.0',
  'BlueOak-1.0.0',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'CC-BY-4.0',
  'CC0-1.0',
  'GPL-3.0',
  'GPL-3.0-only',
  'GPL-3.0-or-later',
  'ISC',
  'LGPL-2.1-or-later',
  'LGPL-3.0',
  'LGPL-3.0-only',
  'LGPL-3.0-or-later',
  'MIT',
  'MIT-0',
  'MPL-2.0',
  // Fonts (e.g. Inter) are bundled as separate works; OFL allows distribution with any software.
  'OFL-1.1',
  'Python-2.0',
  'Unlicense',
  'Zlib',
]);

/** Packages whose license field is missing or non-standard, checked by hand. */
const REVIEWED = new Map([
  // ['package-name', 'reason it is acceptable'],
]);

function isAllowed(expression) {
  // SPDX "OR": one acceptable option is enough. "AND": every part must be acceptable.
  const cleaned = expression.replace(/[()]/g, '').trim();
  return cleaned
    .split(/\s+OR\s+/)
    .some((option) => option.split(/\s+AND\s+/).every((part) => ALLOWED.has(part.trim())));
}

const output = execFileSync('pnpm', ['licenses', 'list', '--json'], { encoding: 'utf8' });
const byLicense = JSON.parse(output);

const violations = [];
for (const [license, packages] of Object.entries(byLicense)) {
  if (isAllowed(license)) continue;
  for (const pkg of packages) {
    if (REVIEWED.has(pkg.name)) continue;
    violations.push(`${pkg.name}@${(pkg.versions ?? [pkg.version]).join(', ')}: ${license}`);
  }
}

if (violations.length > 0) {
  console.error('Dependencies with a license not known to be AGPL-3.0 compatible:');
  for (const violation of violations) console.error(`  ${violation}`);
  console.error(
    '\nReplace them, or review them and add them to REVIEWED in scripts/check-licenses.mjs.',
  );
  process.exit(1);
}
console.log(`All licenses are compatible (${Object.keys(byLicense).length} distinct licenses).`);
