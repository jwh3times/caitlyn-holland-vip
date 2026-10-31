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
2. Create a branch named `<type>/<issue#>-<slug>`, where `<type>` is the
   Conventional Commit type of the change (`feat`, `fix`, `docs`, `chore`,
   `refactor`, `test`, `ci`) — for example `fix/236-braces-advisory`. A change
   with no issue drops the number (`docs/fix-typo`). Make your change in small,
   focused commits.
3. Ensure everything is green locally — these mirror the CI jobs:

   ```bash
   npm run format:check   # Format Check job
   npm run coverage       # Coverage job (80% gate)
   npm run lint && npm run build   # Build & Lint job
   npm test               # Playwright Tests job (CI runs the desktop Chromium
                          # and Mobile Chrome projects)
   ```

4. Open a Pull Request and fill in the template. Its first line links the issue:
   `Closes #<n>` when the PR finishes it, or `Part of #<n>` when it is one slice
   of a larger issue that stays open. An issue number in the title alone does not
   link it. AI coding agents follow the stricter
   [development flow](docs/agents/dev-flow.md).

   Eight checks are required to merge: the six CI jobs (`Format Check`, `Coverage`, `Build & Lint`,
   `Playwright Tests`, `AI Config Parity`, `Changelog Version`), plus `CodeQL`
   and `Dependency Review`. The `Cloudflare Pages` check reports the deployment
   build but does not block the merge.

   The `Changelog Version` check requires [`CHANGELOG.md`](CHANGELOG.md) to have
   a `## [x.y.z]` section for the version your merge will mint — every merge to
   `main` is auto-tagged, so an `[Unreleased]` heading alone will not pass. Run
   `node scripts/next-version.mjs` to see that version, or say "ship it" to
   Claude Code and the `ship` skill writes the entry for you. Dependabot PRs are
   exempt.

## Standards

- **Formatting** — Prettier owns formatting; run `npm run format` before
  committing. A PR fails CI if formatting drifts.
- **Tests** — unit coverage is gated at **80%** (statements/branches/functions/
  lines), so new components generally need a test under `tests/unit/` mirroring the
  source path.
- **Conventions** — use the CSS-variable utility classes and the `cn()` helper;
  never hardcode colors. The full conventions live in [AGENTS.md](./AGENTS.md)
  (theme/hydration patterns, static-export constraints, styling rules); Claude
  Code reads them through an `@AGENTS.md` import in [CLAUDE.md](./CLAUDE.md).

## Security issues

Before publishing, review staged files for credentials and run the
[local secret-scanning checks](docs/agents/secret-prevention.md). Environment templates must use
sanitized placeholders; ignore rules do not protect secrets copied into tracked files.

Do not report vulnerabilities in public issues — see [SECURITY.md](./SECURITY.md)
for the private disclosure process.
