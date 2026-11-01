# Architecture Decision Records

This folder records the project's architecture decisions. Each ADR states **the context**, **the decision**, **the alternatives considered** and **the consequences**.

An accepted ADR is never rewritten in substance. To change a decision, write a new ADR that **supersedes** the old one, and set the old one's status to `Superseded by ADR-XXXX`.

Agents (coder, test-writer, reviewer) must comply with accepted ADRs. A change that contradicts one is rejected unless it comes with a new ADR approved by the maintainer.

## Statuses

- **Proposed**: under discussion, not yet binding
- **Accepted**: in force
- **Superseded**: replaced by a newer ADR
- **Rejected**: dropped without replacement

## Index

| #                                                          | Title                                                        | Status   |
| ---------------------------------------------------------- | ------------------------------------------------------------ | -------- |
| [0000](0000-record-architecture-decisions.md)              | Record architecture decisions                                | Accepted |
| [0001](0001-agpl-license-no-external-contributions.md)     | AGPL-3.0 license, open source without external contributions | Accepted |
| [0002](0002-local-first-electron-desktop-app.md)           | Local-only Electron desktop application                      | Accepted |
| [0003](0003-typescript-monorepo.md)                        | TypeScript monorepo with pnpm and Turborepo                  | Accepted |
| [0004](0004-yjs-document-and-commands.md)                  | Yjs (CRDT) document model and command layer                  | Accepted |
| [0005](0005-threejs-rendering-and-2d-plan.md)              | Imperative Three.js 3D rendering and dedicated 2D plan       | Accepted |
| [0006](0006-geometry-kernel.md)                            | Geometry kernel: manifold-3d, clipper2, earcut in Workers    | Accepted |
| [0007](0007-sweet-home-3d-import.md)                       | Sweet Home 3D import only, via a clean-room implementation   | Accepted |
| [0008](0008-native-file-format.md)                         | Native file format (`.cabn`)                                 | Accepted |
| [0009](0009-bring-your-own-ai.md)                          | Bring-your-own AI provider                                   | Accepted |
| [0010](0010-electron-security-and-platform-abstraction.md) | Electron security and `platform` abstraction                 | Accepted |
| [0011](0011-executable-gherkin-specs.md)                   | Executable Gherkin specifications                            | Accepted (amended by 0018) |
| [0012](0012-agent-factory.md)                              | Agent factory and human review                               | Accepted |
| [0013](0013-testing-strategy.md)                           | Testing strategy                                             | Accepted |
| [0014](0014-ci-cd.md)                                      | CI/CD with GitHub Actions                                    | Accepted |
| [0015](0015-distribution.md)                               | Distribution: Linux and Windows first, at no cost            | Accepted |
| [0016](0016-ui-framework.md)                               | UI framework: React                                          | Accepted |
| [0017](0017-units-and-coordinate-systems.md)               | Units and coordinate systems                                 | Accepted |
| [0018](0018-plain-gherkin-feature-files.md)                | Plain Gherkin `.feature` files                               | Accepted |

## Template

Copy [`template.md`](template.md) and use the next number.
