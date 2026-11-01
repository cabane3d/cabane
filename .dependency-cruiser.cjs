/**
 * Architecture boundaries (ADR-0003, ADR-0010). Checked by `pnpm lint`.
 * @type {import('dependency-cruiser').IConfiguration}
 */
module.exports = {
  forbidden: [
    {
      name: 'not-to-unresolvable',
      severity: 'error',
      comment:
        'Every import must resolve; a package may only import what its package.json declares.',
      from: {},
      to: { couldNotResolve: true },
    },
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Circular dependencies make packages impossible to reason about in isolation.',
      from: {},
      to: { circular: true },
    },
    {
      name: 'pure-packages-stay-pure',
      severity: 'error',
      comment:
        'core and geometry are pure: no UI, no Three.js, no Electron, no Node.js built-ins, and no dependency on outer packages.',
      from: { path: '^packages/(core|geometry)/' },
      to: {
        path: [
          '^packages/(ui|renderer|ai|platform|importers)/',
          '^apps/',
          'node_modules/(react|react-dom|three|electron)/',
        ],
      },
    },
    {
      name: 'pure-packages-no-node',
      severity: 'error',
      from: { path: '^packages/' },
      to: { dependencyTypes: ['core'] },
    },
    {
      name: 'geometry-depends-only-on-core',
      severity: 'error',
      from: { path: '^packages/geometry/' },
      to: { path: '^packages/(?!core/|geometry/)' },
    },
    {
      name: 'importers-depend-only-on-core-and-geometry',
      severity: 'error',
      from: { path: '^packages/importers/' },
      to: { path: '^packages/(?!core/|geometry/|importers/)' },
    },
    {
      name: 'only-desktop-knows-electron',
      severity: 'error',
      comment: 'Only apps/desktop may import Electron (ADR-0010).',
      from: { pathNot: '^apps/desktop/src/(main|preload)/' },
      to: { path: 'node_modules/electron/' },
    },
    {
      name: 'renderer-process-goes-through-platform',
      severity: 'error',
      comment:
        'The renderer process reaches the system only through @cabane3d/platform (ADR-0010).',
      from: { path: '^apps/desktop/src/renderer/' },
      to: { path: ['^apps/desktop/src/(main|preload)/', 'node_modules/electron/'] },
    },
    {
      name: 'packages-do-not-depend-on-apps',
      severity: 'error',
      from: { path: '^packages/' },
      to: { path: '^apps/' },
    },
    {
      name: 'no-test-code-in-production',
      severity: 'error',
      from: { pathNot: '\\.test\\.tsx?$' },
      to: {
        path: ['\\.test\\.tsx?$', '^tests/', 'node_modules/(vitest|fast-check|@playwright/test)/'],
      },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: ['/out/', '/dist/', '\\.config\\.ts$', 'vite\\.shared\\.ts$'] },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.base.json' },
    combinedDependencies: true,
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
      mainFields: ['module', 'main', 'types', 'typings'],
    },
  },
};
