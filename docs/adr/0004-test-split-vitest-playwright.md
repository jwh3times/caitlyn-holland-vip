---
status: superseded by ADR-0009
---

# Unit tests live in test/, end-to-end tests in tests/

Vitest collects `test/**/*.test.{ts,tsx}` (`vitest.config.ts`) and Playwright collects `./tests` (`playwright.config.ts`). The two directory names differ by a single letter. Each follows its own tool's default convention, and renaming either now would churn every path and CI reference for cosmetic gain.

## Consequences

- A Vitest-style test placed in `tests/` is matched by Playwright's default `testMatch` and fails against a browser runner.
- A `.spec.ts` placed in `test/` matches **neither** config and silently never runs. This is the dangerous direction: nothing fails, and it reads as passing coverage.
- `npm test` is Playwright — it boots a dev server and runs five browser projects locally. `npm run test:unit` is Vitest. The unqualified command is the slow one.
- Unit coverage is gated at 80% across `app/`, `components/`, `lib/`, and `scripts/**/*.mjs`, so a new component generally needs a matching file under `test/`, mirroring the source path.
