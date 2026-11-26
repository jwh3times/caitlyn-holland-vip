### Changed

- The Tailwind pairing check in `tests/unit/tailwind-config.test.ts` now reads `package-lock.json`
  instead of comparing `package.json` ranges: `tailwindcss` and `@tailwindcss/webpack` must both be
  installed at the top level at one version, with no second, nested `tailwindcss`. A Dependabot
  bump that raises only the loader's range now passes **Coverage** with no alignment commit, while a
  Tailwind major arriving as two PRs still fails each one alone. The merging guide and the
  Dependabot settings drop the manual range-alignment step. No site behavior changes (#266).
