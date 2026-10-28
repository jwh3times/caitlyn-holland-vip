# Ship

## Fast checks

All from the repository root; together they cover the required checks that run locally.

- `npm run format:check` (**Format Check**), fixed by `npm run format`
- `npm run lint` (**Build & Lint**)
- `npx tsc --noEmit` (the type errors **Build & Lint**'s build would hit)
- `npm run sync:agents:check` (**AI Config Parity**), fixed by `npm run sync:agents`, committing
  the regenerated mirrors
- `npm run lint:agents` (**AI Config Parity**)
- only when `scripts/` changed: `node --test scripts/sync-agents.test.mjs scripts/lint-agent-neutrality.test.mjs`
  (**AI Config Parity**)
- only when `app/`, `components/`, `lib/`, `public/`, `scripts/`, `tests/unit/`,
  `vitest.config.ts`, `vitest.setup.ts`, `next.config.ts`, `.nvmrc`, `.gitignore`, `package.json` or
  `package-lock.json` changed: `npm run coverage` (**Coverage**) — the unit suite under the 80% gate,
  a few seconds here; it counts `scripts/*.mjs`, so a new script without tests drops it under the
  gate, and unit tests assert on the manifest, so a dependency change can fail it too

The production build, **Playwright Tests**, **CodeQL** and **Dependency Review** run only in CI.

## Issue link

- **Branch pattern:** `<type>/<issue#>-<slug>`, `<type>` the Conventional Commit type (`feat`,
  `fix`, `docs`, `chore`, `refactor`, `test`, `ci`). Exempt work drops the number
  (`docs/dev-flow`); Dependabot names its own.
- **Link line:** `Closes #<n>` when the PR finishes the issue (a ticket, a one-PR spec, a bug);
  `Part of #<n>` for one slice of a spec that stays open. It sits above the summary.
- **Waiver line:** `Flow waived by the user: <reason>`.
- **Exempt:**
  - dependency bumps
  - changes touching only docs and agent config
  - release prep (the `docs: update docs and changelog for v<x.y.z>` commit)
- **Defined in:** `docs/agents/dev-flow.md`.
