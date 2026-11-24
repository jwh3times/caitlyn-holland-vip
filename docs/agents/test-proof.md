# Test proof

How `test-prover` runs one test on its own here, and how it tells a run that tested nothing from a
pass.

## Test commands

- repo root: Vitest unit and component tests, `tests/unit/**/*.test.{ts,tsx}` (the `include` in
  `vitest.config.ts`; a `.spec.ts` there never runs).
  - One file: `npx vitest run <file>`; one test by name: `npx vitest run <file> -t "<name>"`.
  - The count is Vitest's `Tests  N passed (N)` line, which `mutate.mjs` reads already.
  - The scratch worktree links `node_modules`.
- repo root: `scripts/*.test.mjs`, node's built-in test runner (the canonical scripts' suites).
  - One file: `node --test <file>`; one test by name:
    `node --test --test-name-pattern="<name>" <file>`, with `<name>` regex-escaped.
  - The count is node's `ℹ tests N` line, which `mutate.mjs` reads already.
  - The scratch worktree links `node_modules`.
- repo root: Playwright, `tests/e2e/*.spec.ts`: not provable in a scratch worktree. Its
  `webServer` runs `npm run dev`, and Next's dev server never comes up on a `node_modules` linked
  from outside the worktree, so the run times out waiting for it. From the checkout itself, one
  test is `npx playwright test <file> --project=chromium -g "<name>"`, counted by Playwright's
  `Running N test using` line.

## Guide

none
