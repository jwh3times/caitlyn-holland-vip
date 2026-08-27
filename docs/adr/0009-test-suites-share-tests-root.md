# Unit and end-to-end suites share the tests root

Vitest tests live under `tests/unit/` and Playwright specs under `tests/e2e/`, with explicit runner
configuration keeping their distinct `*.test.*` and `*.spec.*` conventions disjoint. This
supersedes [ADR-0004](0004-test-split-vitest-playwright.md): the extra nesting is preferable to the
easy-to-miss `tests/unit/` versus `tests/` distinction, while retaining source mirroring for unit tests
and a clear browser-test boundary.
