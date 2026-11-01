# ADR-0002: Local-only Electron desktop application

- **Status**: Accepted
- **Date**: 2026-10-31

## Context

The project is software you download and that runs entirely on the user's machine, with no account and no server. The maintainer does not want to host or operate anything.

The application revolves around real-time 3D: rendering must be identical and fast on every platform. Development happens on Linux.

## Decision

- The application is an **Electron desktop application**, distributed as binaries on GitHub Releases.
- **Everything runs locally**: rendering, geometry, import, AI (with the user's own key or a local model, see ADR-0009). No user data goes through any project infrastructure.
- Projects are **real files** on the user's disk.
- The application works **offline**.
- Tooling: **electron-vite** for development and build, **electron-builder** for packaging and publishing, **electron-updater** for updates from GitHub Releases.

## Alternatives considered

- **PWA served from GitHub Pages**: nothing to operate and no security warnings, but installation and updates depend on a URL, rendering depends on the user's browser, and advanced features (files, file associations) vary across browsers. Rejected in favor of standalone, archivable software.
- **Tauri**: lighter binaries, but it uses the system web engine. On Linux that is WebKitGTK, whose WebGL performance is poor and which lacks WebGPU. This is a deal-breaker for a 3D application developed on Linux.
- **Native application (Qt, Java, etc.)**: a 3D and UI ecosystem less rich and less modern than the web, and no code sharing with a possible web version.
- **Web application with a backend**: contradicts the "nothing to host" requirement.

## Consequences

**Positive**
- Identical Chromium rendering on every platform, WebGL2 then WebGPU.
- Full system access: files, native dialogs, OS keychain, file associations.
- No infrastructure to run or pay for.

**Negative / risks**
- Large installers (~100–150 MB).
- Only the latest three major Electron versions receive security fixes: regular upgrades are mandatory (Renovate, see ADR-0014).
- Distributing executables triggers OS protections (SmartScreen, Gatekeeper) when unsigned (see ADR-0015).
- UI code remains browser-compatible thanks to the `platform` abstraction (ADR-0010): a web version remains possible later.
