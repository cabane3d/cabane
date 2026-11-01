# ADR-0010: Electron security and `platform` abstraction

- **Status**: Accepted
- **Date**: 2026-10-31

## Context

The application opens files from the internet (projects in third-party formats, furniture libraries, 3D models, images), stores API keys and talks to AI services. In Electron, a flaw in the renderer can expose the whole system if the process is not isolated.

In addition, most tests benefit from running in a plain browser, which is faster than Electron, and a web version remains a future option.

## Decision

**Electron security**, mandatory settings verified by a test:
- `contextIsolation: true`, `sandbox: true`, `nodeIntegration: false`, `webSecurity: true`;
- strict **Content Security Policy**: no remote scripts, no `eval` (except `wasm-unsafe-eval`, required for WASM);
- no navigation or window opening to remote content from the main window; external links open in the system browser;
- the **preload** script exposes a minimal API through `contextBridge`;
- **IPC** is limited to a closed list of typed channels, whose arguments are validated with **zod** in `main`;
- untrusted files are parsed in **Workers**, with size limits.

**`platform` abstraction**:
- the renderer accesses the system **only** through a TypeScript interface defined in `packages/platform` (`openFile`, `saveFile`, `listRecentFiles`, `getSecret`, `setSecret`, `onFileOpenedByOS`…);
- the **Electron** implementation goes through IPC;
- an **in-memory fake** implementation is used in tests (Vitest, Playwright in Chromium);
- a **web** implementation (File System Access API) can be added later without touching the rest.

## Alternatives considered

- **Enabling `nodeIntegration` to move faster**: the slightest XSS flaw would give full access to the machine. Unacceptable.
- **Calling `ipcRenderer` directly from the UI**: couples the whole application to Electron and makes browser tests impossible.

## Consequences

**Positive**
- Reduced, auditable attack surface (a single list of IPC channels).
- Most E2E tests run in Chromium, which is fast (ADR-0013).
- A web version remains possible.

**Negative / risks**
- Each new system capability requires a new IPC channel, its validation schema and a fake implementation.
- The CSP may get in the way of some libraries (workers, WASM): it must be configured carefully.
