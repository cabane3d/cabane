# Reference screenshots

References of the `@visual` scenarios (ADR-0013), one PNG per scenario, named after its identifier (`WALL-021.png`). They are committed here, not in `.features-gen/`, which is generated and git-ignored.

- Generate or update them **only in the official Playwright Docker image**, so that the text and the anti-aliasing do not depend on the machine. There is no platform suffix in the names.
- Inside the image: `pnpm test:visual -- --update-snapshots`, then check each new image by eye before committing it. References are validated by the maintainer: an agent never creates or updates them.
- A scenario without its reference fails with "A snapshot doesn't exist".
