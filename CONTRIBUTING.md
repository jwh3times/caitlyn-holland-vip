# Contributing to caitlyn.holland.vip

This is a personal website, so most content changes are reserved for the site's
owner — but bug reports, accessibility fixes, dependency bumps, and small
correctness improvements are very welcome. Thanks for helping!

By participating, you agree to abide by our [Code of Conduct](./CODE_OF_CONDUCT.md).

## Getting set up

Follow the [Getting started](./README.md#getting-started) section of the README
(Node version pinned in `.nvmrc` — run `nvm use` — then `npm ci`, `npm run dev`).

## Workflow

1. **Open an issue first** for anything non-trivial so we can agree on the approach.
2. Create a branch and make your change in small, focused commits.
3. Ensure everything is green locally — these mirror the CI jobs:

   ```bash
   npm run format:check   # Format Check job
   npm run coverage       # Coverage job (80% gate)
   npm run lint && npm run build   # Build & Lint job
   npm test               # Playwright Tests job (CI runs Chromium only)
   ```

4. Open a Pull Request and fill in the template. CI (format, coverage, build &
   lint, Playwright, changelog) and the dependency-review check must pass.

   The `Changelog Version` check requires [`CHANGELOG.md`](CHANGELOG.md) to have
   a `## [x.y.z]` section for the version your merge will mint — every merge to
   `main` is auto-tagged, so an `[Unreleased]` heading alone will not pass. Run
   `bash scripts/next-version.sh` to see that version, or say "ship it" to
   Claude Code and the `ship` skill writes the entry for you. Dependabot PRs are
   exempt.

## Standards

- **Formatting** — Prettier owns formatting; run `npm run format` before
  committing. A PR fails CI if formatting drifts.
- **Tests** — unit coverage is gated at **80%** (statements/branches/functions/
  lines), so new components generally need a test under `test/` mirroring the
  source path.
- **Conventions** — use the CSS-variable utility classes and the `cn()` helper;
  never hardcode colors. The full conventions live in [CLAUDE.md](./CLAUDE.md)
  (theme/hydration patterns, static-export constraints, styling rules).

## Security issues

Do not report vulnerabilities in public issues — see [SECURITY.md](./SECURITY.md)
for the private disclosure process.
