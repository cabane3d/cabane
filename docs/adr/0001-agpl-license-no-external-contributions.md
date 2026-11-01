# ADR-0001: AGPL-3.0 license, open source without external contributions

- **Status**: Accepted
- **Date**: 2026-10-31

## Context

The code must be available to everyone. The project does not, however, seek contributors: it is developed by a single maintainer assisted by agents. A collaborative server edition is considered for later; a third party must not be able to turn it into a closed hosted service.

Some formats we import are produced by software under licenses incompatible with AGPL-3.0 (e.g. Sweet Home 3D, GPL v2).

## Decision

- The project is published under **AGPL-3.0-or-later**.
- The model is **"open source, not open contribution"**: external contributions (pull requests) are not accepted. The README states this clearly, and a GitHub Action automatically closes external PRs with an explanatory message.
- The maintainer remains the **sole copyright holder**, which preserves the ability to relicense or to offer a commercial dual license.
- Every added dependency must have a **license compatible with AGPL-3.0** (MIT, BSD, Apache-2.0, ISC, MPL-2.0, LGPL, GPL-3.0, AGPL-3.0…). An automated CI check enforces this (see ADR-0014).
- No code from third-party software whose formats we import is copied or adapted when its license is incompatible (see ADR-0007).

## Alternatives considered

- **MIT / Apache-2.0**: maximum adoption, but does not prevent a modified version from being run as a closed SaaS.
- **GPL-3.0**: protects binary distribution, but not use over a network (the "SaaS loophole").
- **Source-available licenses (FSL, BSL, PolyForm)**: would allow forbidding competing commercial use, but they are not OSI open source and muddy the message.

## Consequences

**Positive**
- The code is free and will remain so, including the future collaboration server.
- Dual licensing (AGPL + commercial) is possible thanks to sole copyright ownership.
- No governance, CLA or external contribution review process to manage.

**Negative / risks**
- Some companies avoid AGPL software.
- If external contributions are ever accepted, a CLA will be required to keep the freedom to relicense.
- Imported 3D models carry their own licenses, independent of the code license (see ADR-0007).
