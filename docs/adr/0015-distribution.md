# ADR-0015: Distribution: Linux and Windows first, at no cost

- **Status**: Accepted
- **Date**: 2026-10-31

## Context

The application is distributed as Electron binaries (ADR-0002). The project must incur no recurring cost until it has found its audience. The maintainer develops on Linux and has no Mac to test on.

- **macOS**: without an Apple Developer account ($99/year), Gatekeeper blocks the app; users must go through System Settings or the Terminal. Automatic updates also require a signed app.
- **Windows**: without signing, SmartScreen shows a warning that can be bypassed in two clicks, and automatic updates work. Smart App Control, enabled on some Windows 11 PCs, blocks unsigned apps entirely.
- **Linux**: no signing needed.

## Decision

| Platform    | Formats                  | Channel                           | Signing                                                                                                   |
| ----------- | ------------------------ | --------------------------------- | --------------------------------------------------------------------------------------------------------- |
| **Linux**   | AppImage, `.deb`         | GitHub Releases, then **Flathub** | None                                                                                                      |
| **Windows** | NSIS installer, portable | GitHub Releases, then **winget**  | None at first; apply to **SignPath Foundation** (free for open source) as soon as the project is eligible |
| **macOS**   | —                        | **Postponed**                     | —                                                                                                         |

- Automatic updates go through **electron-updater** (AppImage and NSIS).
- The download page documents the SmartScreen warning, with screenshots.
- **Cost: €0.**

**Criteria to revisit macOS:** recurring user requests, or access to a Mac for testing. We would then take the Apple Developer account ($99/year) and add signing and notarization to CI. electron-builder supports this without architectural changes.

**Criteria to revisit Windows signing:** if SignPath declines the project and user feedback shows real friction, evaluate Azure Trusted Signing or publishing on the Microsoft Store (free individual developer account, signing handled by Microsoft).

## Alternatives considered

- **Shipping unsigned macOS builds too**: very poor experience ("app is damaged" message), no automatic updates, and no way to test without a Mac.
- **Paying for signing from day one**: recurring cost ($99/year for Apple, up to several hundred euros for Windows) before any traction.
- **A PWA as the macOS channel**: rejected by ADR-0002, but remains technically possible later thanks to `platform` (ADR-0010).

## Consequences

**Positive**
- No cost, no infrastructure.
- Fewer platforms to test and maintain at first.

**Negative / risks**
- Mac users, numerous among designers and interior architects, are not served at launch.
- The SmartScreen warning will deter some Windows users until the app is signed.
- Some antivirus products may flag unsigned Electron installers as false positives.
