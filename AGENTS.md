# Cabane

Free (AGPL-3.0) 2D/3D interior design software. An Electron desktop application that runs **entirely locally**: no server, no account.

Code is written by agents from Gherkin specs and reviewed by the maintainer. This file holds the rules to follow. The _why_ behind each rule lives in `docs/adr/`: **read the relevant ADR before working on a domain.**

## Non-negotiable rules

1. **Comply with accepted ADRs** (`docs/adr/README.md`). A change that contradicts one is rejected unless it comes with a new ADR approved by the maintainer.
2. **Clean-room importers** (ADR-0007): importers for third-party formats are written from the observed file structure and public format documentation only. Never read, copy or adapt the source code of the software that produces those formats when its license is incompatible with AGPL-3.0 (e.g. Sweet Home 3D, GPL v2).
3. **Licenses** (ADR-0001): only add dependencies compatible with AGPL-3.0. When in doubt, ask before adding.
4. **Specs belong to the maintainer** (ADR-0011): never modify `specs/**`. If a spec is ambiguous, contradictory or incomplete, stop and report it.
5. **Every document change goes through a `core` command** (ADR-0004). No direct writes to the Yjs document from the UI, the renderer, the AI or the importer.
6. **Units** (ADR-0017): millimeters (`Mm` type) and radians throughout the model. Conversions (imported formats, Three.js meters, display) happen **only at boundaries**, in the dedicated functions. Geometric comparisons use the `core` tolerance, never `===`.
7. **Design tokens only** (ADR-0019): no raw colors, arbitrary Tailwind colors, radii or shadows outside `packages/ui/src/theme.css`. Use token utilities (`bg-background`, `text-accent-text`…) or `var(--token)`. A new visual need means a new token, documented in `docs/design/visual-identity.md`. Target WCAG 2.2 AA; never convey a state by color alone.
8. **Electron security** (ADR-0010): `contextIsolation`, `sandbox`, no `nodeIntegration`. The renderer accesses the system **only** through `packages/platform`. Every new IPC channel is typed and validated with zod.
9. **Nothing without tests.** A task is done only when `pnpm check` passes.

## Architecture (ADR-0003)

```
packages/
  core/          Yjs document, commands, units, versioned schema, migrations
  geometry/      wall joints, openings, triangulation (Workers + WASM), pure and deterministic
  importers/     third-party formats → core model, one module per format (in a Worker)
  renderer/      imperative Three.js (3D) + Canvas 2D (plan)
  ai/            Vercel AI SDK; the AI acts only through core commands
  platform/      system access interface + fake implementation for tests
  ui/            React components
apps/
  desktop/       Electron: main, preload, renderer
specs/           Gherkin specs (.feature): read-only for agents
tests/           acceptance tests, fixtures (including import corpora)
docs/adr/        architecture decisions
```

Boundaries, enforced by dependency-cruiser:
- `core` depends on neither the UI, Three.js, Electron nor the DOM;
- `geometry` depends on neither Three.js nor the DOM;
- `importers` depends only on `core` (and `geometry` if needed);
- only `apps/desktop` knows about Electron; only the `main` process uses Node.js.

## Stack

TypeScript `strict` · pnpm + Turborepo · Electron (electron-vite, electron-builder, electron-updater) · React + Zustand + shadcn/ui (Radix) + Tailwind · Three.js (no react-three-fiber) · Yjs · manifold-3d, clipper2, earcut · Vercel AI SDK · zod · Biome · Vitest, fast-check, Playwright + playwright-bdd, Stryker.

## Commands

| Command | Purpose |
|---|---|
| `pnpm install` | Install dependencies |
| `pnpm dev` | Run the desktop application in development mode |
| `pnpm dev:web` | Run the renderer in a browser on the fake platform (port 5199) |
| `pnpm lint` | Biome (lint + format) and dependency-cruiser |
| `pnpm format` | Apply Biome formatting and safe fixes |
| `pnpm typecheck` | TypeScript check across the monorepo |
| `pnpm test` | Unit, property-based and import corpus tests (Vitest) |
| `pnpm test:e2e` | `@e2e` scenarios in Chromium (Playwright) |
| `pnpm test:electron` | Build the desktop app, then run `@electron` scenarios in Electron |
| `pnpm test:visual` | `@visual` scenarios (reference screenshots) |
| `pnpm check` | lint + typecheck + test + test:e2e: **must pass before handing over** |
| `pnpm knip` | Unused files, exports and dependencies |
| `pnpm licenses:check` | Every dependency license is AGPL-3.0 compatible |

To target a package: `pnpm --filter @cabane3d/<package> <command>`.

## Specs and tests (ADR-0011, ADR-0013, ADR-0018)

- Specs live in `specs/<domain>/<feature>.feature` (ADR-0018), in English. Context and business rules are in the `Feature` description.
- Each scenario has exactly one identifier (`@WALL-012`) and at least one level tag (`@unit`, `@e2e`, `@electron`, `@visual`). `@unit` scenarios are referenced by a Vitest test; the others run through playwright-bdd. `scripts/factory/check-scenario-coverage.sh` checks this.
- UI names in specs, accessible names in the UI and locators in E2E tests follow the glossary in `docs/design/main-window.md`.
- Visual rules (palette, states, plan rendering, typography) are in `docs/design/visual-identity.md`.
- Acceptance step definitions use the `appPage` fixture from `tests/support/fixtures.ts`, never `page` directly, so one scenario can run in the browser and in Electron.
- Step definitions use `core` **commands** and the fake `platform` implementation, never internal details.
- Geometric invariants are tested with fast-check.
- No network calls in tests. The AI is always mocked (AI SDK mock model).
- Files in the import corpora (`tests/fixtures/import/<format>/`) must be redistributable; their origin and license are documented in each folder's README.

## Agent workflow (ADR-0012, ADR-0020)

Mandatory order: `test-writer` → `coder` → draft PR → `reviewer` → maintainer → `coder` (`/implement`).

- **test-writer**: turns the spec into tests, then **proves they fail** before committing (`test: red tests for <ID>`). Writes only to `tests/**` and step definitions.
- **coder**: implements until `pnpm check` passes. **Never modifies acceptance tests.** If a test looks wrong, stop and report it instead of working around it.
- **reviewer**: read-only. Checks coverage of every scenario, compliance with ADRs and this file, security and simplicity. Returns a JSON verdict whose findings each give a severity, the problem and a proposed fix, anchored to lines when possible.
- **Review happens on the pull request**: the orchestrator posts the reviewer's findings there (inline when the lines are in the diff), then **stops** until the maintainer has added their own comments and says to continue. Coder then handles every open comment; maintainer comments take precedence. Only the orchestrator talks to GitHub, through `scripts/factory/post-review.sh`, `fetch-pr-feedback.sh` and `reply-pr-feedback.sh`.
- After **3 review rounds** without approval, no new round starts without the maintainer's decision.

## Code conventions

- Everything is in **English**: code, identifiers, comments, commit messages, specs, ADRs and documentation.
- No `any`, no unjustified `as`, no `!` (non-null assertion) without a comment.
- External data (imported files, IPC, AI responses, preferences) is validated with zod at the boundary.
- `core` and `geometry` functions are pure whenever possible. No global state.
- Three.js resources (geometries, materials, textures) are explicitly disposed when their object is removed.
- No frequently changing state (pointer, camera, hover) in React: it stays in the renderer.
- One feature = one Git worktree = one `feat/<id-or-name>` branch = one PR.

## Commits and PRs

- **Conventional Commits** (`feat:`, `fix:`, `test:`, `refactor:`, `docs:`, `chore:`…), used by release-please.
- A PR states the spec it addresses, the scenario identifiers covered, and any deviations or questions.
- No merge without the maintainer's approval.

## When to stop and ask

- A spec is ambiguous or contradictory.
- An ADR seems to need revisiting.
- A new dependency is needed and its license or maintenance is questionable.
- An acceptance test looks wrong.
- The same error keeps coming back after several attempts.
