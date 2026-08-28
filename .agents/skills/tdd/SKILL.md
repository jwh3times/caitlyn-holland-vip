---
name: tdd
description: Test-driven development. Use when the user wants to build features or fix bugs test-first, mentions "red-green-refactor", or wants integration tests.
---

# Test-Driven Development

TDD is the red → green loop. This skill is the reference that makes that loop produce tests worth keeping: what a good test is, where tests go, the anti-patterns, and the rules of the loop. Every section applies on every cycle — consult them before and during the loop, not after.

When exploring the codebase, read `CONTEXT.md` so test names and interface vocabulary match the project's domain language, and respect ADRs in the area you're touching.

## Where tests go in this repo

Both suites live under `tests/`, in sibling directories the two runners discover explicitly. See [ADR-0009](../../../docs/adr/0009-test-suites-share-tests-root.md).

| Layer          | Directory     | Discovery                                           | Command             |
| -------------- | ------------- | --------------------------------------------------- | ------------------- |
| Unit/component | `tests/unit/` | Vitest `include: tests/unit/**/*.test.{ts,tsx}`     | `npm run test:unit` |
| End-to-end     | `tests/e2e/`  | Playwright `testDir: ./tests/e2e`, `*.spec.ts` here | `npm test`          |

The directory is what separates the runners; the suffix is what decides whether a file runs at all. Both failure modes are still live, in opposite directions:

- A `.spec.ts` under `tests/unit/` misses Vitest's `include` and is outside Playwright's `testDir`, so it is collected by **neither** and **silently never runs**. Nothing goes red and it reads as passing coverage — this is the one to watch for.
- A Vitest-style `.test.ts` under `tests/e2e/` **is** picked up, because Playwright's default `testMatch` accepts `.test.` as well as `.spec.`, and then fails against a browser runner. Noisy, but at least it fails.
- `tests/unit/` mirrors the source path — a component at `components/ui/button.tsx` is tested at `tests/unit/components/ui/button.test.tsx`. A test for a repo-root file such as `next.config.ts` sits at `tests/unit/` root, not in a subdirectory.

**Gates this repo enforces**, so a red-green loop that ignores them produces a branch CI will reject:

- Unit coverage is gated at **80%** (statements, branches, functions, lines) across `app/`, `components/`, `lib/`, and `scripts/**/*.mjs`. A new component generally needs a matching file under `tests/unit/`.
- Typechecking is `npx tsc --noEmit` — there is no `typecheck` script.
- `npm test` is the **Playwright** suite: it boots a dev server and runs five browser projects locally. Don't reach for it as the quick inner-loop command; `npm run test:unit` is that.

## What a good test is

Tests verify behavior through public interfaces, not implementation details. Code can change entirely; tests shouldn't. A good test reads like a specification — "user can checkout with valid cart" tells you exactly what capability exists — and survives refactors because it doesn't care about internal structure.

See [tests.md](tests.md) for examples and [mocking.md](mocking.md) for mocking guidelines.

## Seams — where tests go

A **seam** is the public boundary you test at: the interface where you observe behavior without reaching inside. Tests live at seams, never against internals.

**Test only at pre-agreed seams.** Before writing any test, write down the seams under test and confirm them with the user. No test is written at an unconfirmed seam. You can't test everything — agreeing the seams up front is how testing effort lands on the critical paths and complex logic instead of every edge case.

Ask: "What's the public interface, and which seams should we test?"

When the shape of that interface is itself in question — how deep the module is, where the seam belongs, what the interface should expose — use the `/codebase-design` skill for the vocabulary. It is the shared source of the module, interface, depth, seam, adapter, leverage and locality terms, and it is a reference to consult, not a session to run.

## Anti-patterns

- **Implementation-coupled** — mocks internal collaborators, tests private methods, or verifies through a side channel (querying the database instead of using the interface). The tell: the test breaks when you refactor but behavior hasn't changed.
- **Tautological** — the assertion recomputes the expected value the way the code does (`expect(add(a, b)).toBe(a + b)`, a snapshot derived by hand the same way, a constant asserted equal to itself), so it passes by construction and can never disagree with the code. Expected values must come from an independent source of truth — a known-good literal, a worked example, the spec.
- **Horizontal slicing** — writing all tests first, then all implementation. Bulk tests verify _imagined_ behavior: you test the _shape_ of things rather than user-facing behavior, the tests go insensitive to real changes, and you commit to test structure before understanding the implementation. Work in **vertical slices** instead — one test → one implementation → repeat, each test a **tracer bullet** that responds to what the last cycle taught you.

## Rules of the loop

- **Red before green.** Write the failing test first, then only enough code to pass it. Don't anticipate future tests or add speculative features.
- **One slice at a time.** One seam, one test, one minimal implementation per cycle.
- **Refactoring is not part of the loop.** It belongs to the review stage — Claude Code's built-in `/code-review`; this repo does not vendor a review skill — not the red → green implementation cycle.
