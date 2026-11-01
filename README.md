# Cabane

Free 2D/3D interior design software that runs entirely on your machine: no account, no server, no subscription.

> **Status: early development.** Nothing is usable yet.

## Principles

- **Local first.** Cabane is a desktop application. Your projects are files on your disk (`.cabn`), and the app works offline.
- **Open formats.** Projects are ZIP archives with a readable JSON snapshot. Projects from other tools can be imported (Sweet Home 3D first).
- **Bring your own AI.** AI features are optional and use your own provider account or a local model (Ollama). Nothing goes through the project's servers, because there are none.
- **Free software.** Licensed under the [GNU AGPL v3.0 or later](LICENSE).

## Contributions

Cabane is **open source, not open contribution**: the code is public, but external pull requests are not accepted and are closed automatically. Bug reports and ideas are welcome in the Discussions.

## Development

Requirements: Node.js 24 (see `.nvmrc`) and pnpm, enabled through Corepack:

```bash
corepack enable pnpm
pnpm install
pnpm exec playwright install chromium
```

| Command | Purpose |
|---|---|
| `pnpm dev` | Run the desktop application |
| `pnpm dev:web` | Run the UI in a browser on a fake platform (http://localhost:5199) |
| `pnpm check` | Lint, typecheck, unit tests and browser E2E tests |
| `pnpm test:electron` | Build the desktop app and run the Electron E2E tests |

The project is developed by an agent factory from executable specifications: see [AGENTS.md](AGENTS.md), the [specs](specs/) and the [architecture decision records](docs/adr/README.md).
