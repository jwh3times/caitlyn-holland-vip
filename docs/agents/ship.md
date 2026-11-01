# Ship

## Fast checks

All from the repository root; together they cover the required checks that run locally.

- `npm run format:check` (**Format Check**), fixed by `npm run format`
- `npm run lint` (**Build & Lint**)
- `npx tsc --noEmit` (the type errors **Build & Lint**'s build would hit)
- `npm run sync:agents:check` (**AI Config Parity**), fixed by `npm run sync:agents`, committing
  the regenerated mirrors
- `npm run lint:agents` (**AI Config Parity**)
- `node scripts/check-docs.mjs` (**AI Config Parity**)
- `node scripts/check-skills.mjs` (**AI Config Parity**)
- only when `scripts/` changed: `node --test scripts/sync-agents.test.mjs scripts/lint-agent-neutrality.test.mjs scripts/sync-main.test.mjs scripts/next-version.test.mjs scripts/check-changelog.test.mjs scripts/check-docs.test.mjs scripts/check-skills.test.mjs`
  (**AI Config Parity**)
- only when `app/`, `components/`, `lib/`, `public/`, `scripts/`, `tests/unit/`,
  `vitest.config.ts`, `vitest.setup.ts`, `next.config.ts`, `.nvmrc`, `.gitignore`, `package.json` or
  `package-lock.json` changed: `npm run coverage` (**Coverage**) — the unit suite under the 80% gate,
  a few seconds here; it counts `scripts/*.mjs`, so a new script without tests drops it under the
  gate, and unit tests assert on the manifest, so a dependency change can fail it too

The production build, **Playwright Tests**, **CodeQL** and **Dependency Review** run only in CI.
