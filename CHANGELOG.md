# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

No unreleased changes.

## [1.11.6] - 2026-09-06

### Security

- Ignore environment files and common credential exports at root and nested paths, with explicit
  exceptions for sanitized environment templates and regression tests for the ignore behavior.
- Document local secret scanning before publication, including staged changes, repository history,
  and separate wiki checkouts, with clear limits on manual scanning and ignore-rule protection.

## [1.11.5] - 2026-09-05

### Security

- Pinned external GitHub Actions to verified full commit SHAs, retaining readable version
  comments and existing Dependabot updates so CI and release jobs use reviewed revisions.
- Locked the local preview server to `serve` 14.2.6 and invoke its installed executable, so
  `npm run preview` no longer resolves and installs an unlocked package through `npx`.

## [1.11.4] - 2026-09-04

### Changed

- Made GitHub the single tracker for every work item across the public repository and its private
  companion: issues carry the record, a private project board views them with Status, Gate, and
  Area fields, and draft security advisories carry unpublished vulnerabilities. No Markdown file in
  either repository is a backlog, a roadmap, or a status report any more, and `docs/research/` is
  now explicitly for standing research that backs a live decision rather than assessments of what
  work remains.

### Removed

- Removed the two superseded repository assessment reports from `docs/research/`. Both described
  closed issues as open work, and the newer one duplicated the tracker it was assessing.

## [1.11.3] - 2026-09-04

### Changed

- Bumped `next` and `@next/eslint-plugin-next` from 16.3.3 to 16.3.4 in the grouped minor/patch
  dependabot update.

## [1.11.2] - 2026-09-03

### Changed

- Bumped `lucide-react` from 1.37.0 to 1.38.0 in the grouped minor/patch dependabot update.

## [1.11.1] - 2026-09-02

### Added

- Added a public-safe assessment of the public and private repositories, their documentation,
  GitHub issues, and project boards that confirms portability work is complete and prioritizes the
  next available work.

## [1.11.0] - 2026-09-02

### Added

- Added `npm run sync:main` to switch both the public repository and optional private companion
  to `main` and fast-forward them from `origin/main` in one command, while refusing dirty or
  diverged worktrees rather than stashing changes or creating merge commits.

## [1.10.0] - 2026-09-02

### Added

- Added dedicated Skills and Experience sections with desktop and mobile navigation anchors, improving the page's content hierarchy and scanability while preserving existing deep links.

## [1.9.0] - 2026-09-02

### Added

- Added richer search and social metadata plus script-safe Person JSON-LD so search engines can understand Caitlyn's professional profile from the static site.

## [1.8.0] - 2026-09-02

### Added

- Added `npm run preview` for serving and inspecting the completed static export locally, with documentation distinguishing content preview from deployed Cloudflare-header verification.

### Removed

- Removed the misleading `npm start` command because `next start` cannot serve this project's static-export output.

## [1.7.7] - 2026-09-02

### Changed

- Expanded CI browser coverage from desktop Chromium to both desktop Chromium and Mobile Chrome (Pixel 5), exercising the full Playwright suite with mobile user-agent, touch, and viewport emulation on every change.

## [1.7.6] - 2026-09-02

### Changed

- Centralized navigation, timeline, badge, skip-link, and footer accent styling behind variant-compatible semantic theme utilities while preserving the established light and dark palette values.

## [1.7.5] - 2026-09-02

### Changed

- Documented why the static export's CSP permits inline scripts for the `next-themes` pre-paint script and cannot use a per-request nonce, without changing the deployed security-header policy.

## [1.7.4] - 2026-09-02

### Added

- Added deterministic cross-browser end-to-end coverage proving that a user-selected theme and its accessible toggle state survive a page reload.

## [1.7.3] - 2026-09-02

### Added

- Added a public-safe repository-state assessment that reconciles the public and private companion documentation, Issues, milestones, and project-board state into an ordered backlog.

### Fixed

- Made the shipping and session-close workflows portable to remote environments by using GitHub MCP operations when the `gh` CLI is unavailable and removing machine-specific shell assumptions.
- Prevented older remote Node/npm toolchains from silently rewriting lockfile metadata by enforcing Node 26/npm 11 before npm commands, with regression coverage binding the runtime, typings, and package-manager policy.
- Added `AI Config Parity` to the active main-branch ruleset while preserving its seven existing required checks, and corrected the documented inventory.

## [1.7.2] - 2026-09-01

### Changed

- Updated `lucide-react` from 1.35.0 to 1.37.0 (dependabot, `npm-minor-and-patch` group).

## [1.7.1] - 2026-08-31

### Changed

- Updated `lucide-react` from 1.34.0 to 1.35.0, `next` and `@next/eslint-plugin-next` from 16.3.2 to 16.3.3, `@testing-library/react` from 16.3.2 to 16.3.3, `@types/node` from 26.3.0 to 26.4.0, and `@vitejs/plugin-react` from 6.1.0 to 6.1.1 (dependabot, `npm-minor-and-patch` group).

## [1.7.0] - 2026-08-30

### Added

- Added daily and on-demand post-deployment smoke checks for the live homepage, expected content, security headers, sitemap, and robots file so delivery failures surface independently of build-time CI.

## [1.6.4] - 2026-08-28

### Fixed

- Corrected the test-driven-development skill, which still described the superseded split test layout and told agents unit tests belong in `test/`; it now documents `tests/unit/` and `tests/e2e/` against the runners' actual discovery configuration, including which misplaced-file mistake fails loudly and which one silently never runs.
- Corrected the end-of-session skill, which described the private companion directory as untracked notes that never reach a commit and named documents that have since been reorganized; it now describes an independent private repository with its own remote, and routes new follow-ups to an issue instead of a private markdown list.
- Corrected the skill provenance counts in the agent guidance: sixteen skills, fourteen vendored, and two authored in this repository rather than one.

### Changed

- Replaced the multi-context glossary and decision-record boilerplate in the domain-modeling skill with this repository's actual single-context layout.
- Added a changelog item to the pull request template, covering the required check most likely to be missed.

## [1.6.3] - 2026-08-28

### Added

- Added ADR-0010 recording the two-repository private-workspace architecture — the public repository, its independent private companion, and 1Password as the credential manager and bootstrap index — which previously existed only as an implementation plan and a research note.
- Documented CodeQL default setup and the seven checks the `No Push to Main` ruleset requires, including why no `codeql.yml` belongs in the repository.

### Changed

- Consolidated the agent documentation: the triage-label vocabulary and the sub-issue/blocking mechanics now live in one issue-tracker reference that also names the GitHub MCP fallback where the `gh` CLI is unavailable, and the domain-docs guide describes this repository's single-context layout instead of a multi-context one it never had.
- Pointed the contributing guide's conventions at `AGENTS.md`, where they are authored, rather than at the `CLAUDE.md` import wrapper.

### Removed

- Removed the completed implementation plans and design specs under `docs/superpowers/`, the derived backlog in `docs/IMPLEMENTATION_PLAN.md`, and the research note ADR-0010 supersedes. The backlog's live proposals became issues #148–#153 so that every open action has exactly one canonical tracker.

## [1.6.2] - 2026-08-28

### Changed

- Generalized the owner recovery runbook so it documents restoring the project on Linux, macOS, and Windows rather than Windows alone, pairing POSIX and PowerShell commands only where the shell syntax differs, naming the per-platform 1Password CLI installation paths, recording the GitHub MCP substitute where the `gh` CLI is unavailable, and directing recovery to match the pinned Node version before installing dependencies.

## [1.6.1] - 2026-08-28

### Changed

- Updated `lucide-react` from 1.33.0 to 1.34.0, `@types/node` from 26.2.0 to 26.3.0, and `oxlint` from 1.79.0 to 1.80.0 (dependabot, `npm-minor-and-patch` group).

## [1.6.0] - 2026-08-27

### Added

- Added an idempotent `npm run bootstrap:private` command that retrieves the optional companion repository locator from 1Password or an explicit argument, validates credential-free GitHub URLs, verifies private visibility, and safely clones it into `private/`.

### Changed

- Consolidated automated tests under `tests/unit/` and `tests/e2e/`, with explicit Vitest and Playwright discovery boundaries and updated project guidance.

## [1.5.13] - 2026-08-25

### Changed

- Updated `next` and `@next/eslint-plugin-next` from 16.3.1 to 16.3.2 and `@testing-library/user-event` from 14.6.5 to 14.6.6.

## [1.5.12] - 2026-08-25

### Added

- Added a public-safe owner recovery runbook and supporting analysis for restoring the public site repository and its independent private working-document companion with scoped 1Password automation.

### Changed

- Made the root private-workspace and machine-local agent-settings boundaries portable through repository-owned ignore rules and concise agent/human recovery pointers.

### Fixed

- Stopped Next.js from dirtying clean development and production checkouts by ignoring and untracking its generated `next-env.d.ts` file, as required by the installed Next.js documentation.

## [1.5.11] - 2026-08-24

### Changed

- Expanded Oxlint's React Compiler coverage, enabled unused-disable reporting, and applied the JavaScript/TypeScript rules to `.mjs` files.
- Updated `lucide-react` from 1.31.0 to 1.33.0, `@vitejs/plugin-react` from 6.0.5 to 6.1.0, `@vitest/coverage-v8` and `vitest` from 4.1.10 to 4.1.11, and `oxlint` from 1.78.0 to 1.79.0.

### Fixed

- Preserved the original error as the cause when the Tailwind development benchmark reports captured server output.

## [1.5.10] - 2026-08-21

### Changed

- Bumped the development dependency `@testing-library/user-event` from 14.6.4 to 14.6.5 (dependabot, `npm-minor-and-patch` group).

## [1.5.9] - 2026-08-21

### Changed

- The `end-session` skill's workspace cleanup now covers git branches, not just files: once the checkout is clean it returns to `main`, fast-forwards it from `origin` (pruning remote-tracking refs for branches deleted after their PR merged), and deletes the local branches whose work already landed on `main` — including squash- or rebase-merged ones, confirmed against merged PR state. Branches with an open or unmerged PR, branches held by another worktree, and any branch `git branch -d` refuses are reported and kept; force-deletion is now explicitly off-limits. The close-out report names the branches deleted and the branch the checkout is left on.

## [1.5.8] - 2026-08-20

### Added

- Added the `end-session` agent skill, a close-out pass for a work session: it flushes what the session learned into the per-project memory files, updates the gitignored `private/` working notes, brings GitHub issue tracking current, and tidies stray local files. It records and tidies only — it never commits, pushes, or merges, so a finished branch still goes through `ship`.

## [1.5.7] - 2026-08-17

### Changed

- Bumped three dependencies in the `npm-minor-and-patch` group (dependabot): `next` and `@next/eslint-plugin-next` from 16.3.0 to 16.3.1, and `@testing-library/user-event` from 14.6.3 to 14.6.4.

## [1.5.6] - 2026-08-16

### Added

- Added automated WCAG 2.1 A/AA accessibility audits to the Playwright suite for the homepage's default state, open mobile navigation, and dark theme.

### Fixed

- Increased light-theme muted-text contrast to meet WCAG AA and made theme-toggle browser tests target the visible accessible control consistently on mobile viewports.

## [1.5.5] - 2026-08-14

### Security

- Updated the transitive `nanoid` dependency from 3.3.17 to 3.3.18, resolving a high-severity advisory where custom generators can loop indefinitely when the requested size is zero. `nanoid` reaches the tree through `postcss` under both `next` and `@vitejs/plugin-react`, and both declare ranges the patched release already satisfies, so this is a lockfile-only change with no dependency overrides. The site is a static export, so the affected code only ever ran in the build toolchain and was never served to visitors.

## [1.5.4] - 2026-08-14

### Added

- Documented the research behind keeping the `@next/eslint-plugin-next` lint bridge: Oxlint 1.78.0 still ships no native `nextjs/no-location-assign-relative-destination`, so the write-up records the no-go decision, the configuration to adopt once the native rule lands, the Next.js behavior a replacement must match, the dependency cleanup that removal would trigger, and the conditions for revisiting it.

## [1.5.3] - 2026-08-14

### Changed

- Bumped the development linter `oxlint` from 1.77.0 to 1.78.0 (dependabot, `npm-minor-and-patch` group).

## [1.5.2] - 2026-08-13

### Changed

- Bumped `lucide-react` from 1.30.0 to 1.31.0 and the development dependency `@testing-library/jest-dom` from 7.0.0 to 7.0.1 (dependabot, `npm-minor-and-patch` group).

## [1.5.1] - 2026-08-12

### Changed

- Removed the redundant Next.js `experimental.useTypeScriptCli` setting now that Next.js 16.3 defaults production builds to the project-local TypeScript 7 CLI, retaining type-error enforcement while documenting and testing the upstream default.

## [1.5.0] - 2026-08-12

### Added

- Added a repeatable Tailwind integration benchmark that records cold and warm production/development timings plus emitted CSS hashes, with the first controlled comparison and its primary-source research captured in the repository.

### Changed

- Replaced the Tailwind PostCSS integration with Tailwind's first-party webpack loader through Turbopack. The measured medians improved by 14–27% across the recorded scenarios while the minified production CSS remained byte-for-byte identical, and the unused PostCSS configuration and direct dependencies were removed.

## [1.4.3] - 2026-08-11

### Changed

- Removed the obsolete global PostCSS override now that Next.js directly requires a patched release, allowing the framework to use its exact tested PostCSS version while the Tailwind pipeline continues to use the current compatible release.

## [1.4.2] - 2026-08-11

### Changed

- Simplified the Tailwind CSS v4 PostCSS pipeline by removing the redundant direct Autoprefixer dependency and its orphaned packages, aligning the Tailwind package floors, and moving class-based dark-mode selection into CSS so the existing theme toggle continues to control `dark:` utilities.

## [1.4.1] - 2026-08-11

### Changed

- Disabled the Next.js 16.3 agent-rules generator with `agentRules: false`, so starting the dev server — directly or through the Playwright end-to-end suite — no longer appends a tool-written block to `AGENTS.md` and leaves the working tree dirty. `AGENTS.md` stays entirely hand-authored, and the block's pointer to the version-matched bundled Next.js docs is now re-stated there by hand, alongside the reasoning and a regression test.

## [1.4.0] - 2026-08-11

### Added

- An architecture decision record covering the Node runtime pin: why the runtime moved up to 26 rather than the typings moving back to 24, and the three consequences worth remembering — the pre-LTS support window, Cloudflare Pages resolving `.nvmrc` on its own, and a future `@types/node` major only being mergeable alongside a matching `.nvmrc` bump.

### Changed

- The Node version required to develop, test, and build the site moved from 24 to 26. `.nvmrc` is the single source for all five CI jobs, the Cloudflare Pages build, and local development, so contributors should run `nvm use` after pulling. Node 26 is currently a _Current_ release rather than Active LTS; because the site is a static export, Node runs only in CI, on the Pages builder, and on developer machines, and never serves production traffic.
- `.nvmrc` and `@types/node` now name the same major. Previously the runtime was pinned to 24 while the typings resolved to 26.x, which let the compiler advertise Node 26 APIs that neither CI nor the Cloudflare build could execute. The two are treated as one decision from here on and move together in either direction.

## [1.3.1] - 2026-08-11

### Changed

- Dependency updates from dependabot's grouped minor/patch pull request: `lucide-react` 1.29.0 → 1.30.0 and `@types/node` 26.1.2 → 26.2.0.

## [1.3.0] - 2026-08-09

### Added

- The ship workflow now evaluates every branch as a major, minor, or standard build-number release before computing its tag. It adjusts the package-version floor for new release lines, remains idempotent when re-run, and includes the decision and rationale in the pull request and final report.

## [1.2.1] - 2026-08-09

### Changed

- Updated the direct `lucide-react` dependency from 1.28.0 to 1.29.0 via Dependabot.

## [1.2.0] - 2026-08-09

### Changed

- Upgraded the project from TypeScript 6 to the TypeScript 7 native compiler and explicitly configured Next.js to use its local TypeScript CLI for production type-checking.
- Replaced the remaining TypeScript-dependent React lint compatibility plugins with Oxlint's native React, Hooks, and React Compiler rules, removing ESLint and the incompatible `typescript-eslint` dependency chain while retaining the one Next.js rule that still requires a compatibility bridge.

## [1.1.30] - 2026-08-09

### Changed

- Replaced ESLint as the project's lint runner with Oxlint while preserving the existing rule contract through native rules and compatibility bridges for the remaining React and Next.js checks. This removes the lint workflow's dependency on `typescript-eslint` and its TypeScript parser ahead of the planned TypeScript 7 transition; the compiler itself remains on TypeScript 6 in this release.
- Added a safe-autofix command, moved the lint configuration to `.oxlintrc.json`, and updated dependency automation for the new toolchain. ESLint remains installed only as a peer dependency of the compatibility plugins until Oxlint implements those rules natively.

## [1.1.29] - 2026-08-09

### Removed

- Eleven of the twenty-six vendored agent skills, leaving fifteen. The set was written for a backend product with a real domain model, and on a statically exported personal site the unused majority cost context and made skill selection ambiguous rather than helpful. Three removals fixed active hazards: a setup skill that had already run and would duplicate configuration into a second file if run again, a wizard skill reachable automatically whose entire purpose is credential and environment-variable provisioning this site has none of, and a review skill that both duplicated and name-collided with the editor's built-in review command.
- The two one-line interview shims, folded into the interview skill itself. The variant that recorded terminology and decisions as it went was the one a human had to invoke by name, so the record was never written automatically — which is why the glossary and decision records did not exist until this release. The surviving skill is automatically reachable and now carries that behavior.

### Changed

- The surviving skills now describe this repository rather than a generic one: where unit tests and end-to-end tests each live and how a file in the wrong directory fails, the coverage threshold and typecheck command a build must satisfy, that a prototype page becomes publicly reachable once merged because the site is statically exported, and the package manager actually in use. Several pointed at files and commands that do not exist here — a script path that resolved nowhere, a skill deleted in this release, and a promise of research running in the background while you keep working, which the tooling does not do.
- The issue tracker guide dropped the pull-request triage flag, whose only reader was a removed skill, and narrowed its dependency section to the parent-child and blocking-edge mechanics that still have a consumer.
- Skill provenance is now recorded as history rather than as a constraint: the lock file marks which skills have deliberately diverged from what was originally fetched, so a future re-install cannot quietly overwrite local edits without that being a visible choice.

### Added

- A decision record for the vendored-skill policy, covering why these are forked and owned locally rather than tracked upstream, what was removed, and the cost that choice carries — upstream improvements now have to be read and applied by hand.

## [1.1.28] - 2026-08-09

### Added

- A `CONTEXT.md` glossary at the repo root defining the project's vocabulary — the site's terms (section, profile, CTA tone, theme token, mounted guard) and the configuration machinery's terms (source versus mirror, skill versus agent, parity, minted version, floor) — so agent output stops drifting between synonyms for the same concept.
- Architecture decision records under `docs/adr/` covering the five decisions a reader would otherwise reverse-engineer or re-litigate: the static-export deployment and everything it forbids, the two opposite directions the AI-config trees sync in, the changelog naming the version its own merge will mint, the one-letter difference between the unit and end-to-end test directories, and the theme access seam. Both artifacts were already described as existing in the project guidance; they now do.

### Fixed

- The project guidance described continuous integration as five jobs when it defines six, omitting the job that regenerates the AI-config mirrors and fails on drift. A branch touching skill or agent definitions could therefore be prepared with no indication that a gate would reject it. The guidance now also records that the same job fails on an unformatted source file, which previously surfaced as an unexplained failure in a job that appeared unrelated.
- The documentation-maintenance subagent detected theme work by searching for a hook no component has called since the theme interface was introduced, so it silently matched nothing and could not see the components it exists to keep documented. It now matches the real interface, and recognizes edits to skill and agent definitions as requiring a mirror regeneration.
- The same subagent enumerated continuous-integration jobs with a search that also matches every step within them, giving no way to separate the two — the likely origin of the incorrect job count. It now reads job keys directly.
- Guidance stated that no file under the Codex configuration directory may be edited because all of it is generated, which forbade maintaining the one file there that is hand-authored and has no source to regenerate from.
- Versioning documentation claimed a new major/minor line begins at build zero; it begins at whatever build the manifest's version names. The manifest version is also now described as the lower bound it is, rather than implying it tracks the current release.
- Authored skill sources were marked as generated content, collapsing them by default in review and hiding real edits. The marking now applies to the generated mirrors instead.
- Added the mirror-regeneration command to the README command table, and pointed a script comment at the ship skill's authored source rather than its generated copy.

## [1.1.27] - 2026-08-09

### Changed

- Replaced repeated CTA-link styling at six call sites with a semantic `CtaLink` interface that owns link rendering, class composition, tone, and size mapping. Button CTA variants are now constrained to their padding-based sizes, making invalid gradient/standard-size combinations unrepresentable in TypeScript.

## [1.1.26] - 2026-08-09

### Changed

- Centralized the site's shared name, URL, description, and biography behind one profile interface. Metadata, sitemap, navigation, footer, page sections, and their tests now read the same facts, preventing identity and biography copy from drifting while single-reader contact and résumé details remain local.
- Added a parity test for the static web manifest so its unavoidable duplicate profile fields cannot silently diverge from the shared profile.

## [1.1.25] - 2026-08-09

### Changed

- Deepened the theme module behind a single public interface: `<Theme>` now owns the `next-themes` provider policy, while `useThemeToggle()` encapsulates the mounted guard, resolved theme state, and toggle action so consumers remain rendering-focused without duplicating hydration-sensitive behavior.

## [1.1.24] - 2026-08-09

### Changed

- Deepened the `scripts/sync-ai.mjs` module around a single `syncAll({ root, write })` interface. Discovery, mirroring, and orphan pruning now stay beneath the supplied repository root, making destructive cleanup testable against isolated temporary trees instead of the real checkout; script coverage now participates in the existing 80% gate.

## [1.1.23] - 2026-08-08

### Added

- Agent-skill configuration scaffolding from the `setup-matt-pocock-skills` skill: a new `## Agent skills` section in `AGENTS.md`, plus `docs/agents/issue-tracker.md` (GitHub Issues via the `gh` CLI), `docs/agents/triage-labels.md` (the default five-role label vocabulary), and `docs/agents/domain.md` (single-context `CONTEXT.md`/`docs/adr/` layout). Skills like `triage`, `to-tickets`, `to-spec`, and `/wayfinder` now read these instead of falling back to unconfigured defaults.

## [1.1.22] - 2026-08-07

### Added

- Vendored 25 third-party agent skills from [`mattpocock/skills`](https://github.com/mattpocock/skills) — including `tdd`, `code-review`, `diagnosing-bugs`, `codebase-design`, `domain-modeling`, `research`, and `wizard`. Sources live in `.agents/skills/`, and `skills-lock.json` records each skill's upstream path and content hash.

### Changed

- **Skills are now authored under `.agents/skills/` and mirrored into `.claude/skills/`** — the reverse of the previous direction. `.agents/` is the single source of truth for every skill, including the repo's own `ship` skill, which moved from `.claude/skills/ship/` to `.agents/skills/ship/`. Agent definitions are unaffected and still go `.claude/agents/*.md` → `.codex/agents/*.toml`, because that direction is a format conversion rather than a copy.
- `npm run sync:ai` now mirrors the **entire** skill directory instead of `SKILL.md` alone, so auxiliary files (`agents/openai.yaml`, `scripts/*.sh`, reference docs) are covered by drift detection for the first time. Markdown and YAML mirrors carry an `AUTO-GENERATED` banner naming their source; shell scripts are copied verbatim so their shebang stays on line 1 and are drift-checked by content.
- `npm run sync:ai` now prunes mirrors whose source no longer exists, so deleting a skill from `.agents/` removes its `.claude/` copy instead of leaving an orphan that drift detection could not see.
- The `AI Config Parity` CI job now checks `.codex`, `.claude/skills`, and `.agents`.
- Applied `npm run format` across the repository. Only the newly vendored skill files changed; no previously tracked file was reformatted.

## [1.1.21] - 2026-08-07

### Security

- Resolved the open Dependabot alerts for `postcss` (GHSA-6g55-p6wh-862q and its incomplete-fix follow-up), where an attacker-controlled `sourceMappingURL` could read arbitrary `.map` files when `from` is unset. The `postcss` devDependency and the `overrides` pin both move from `^8.5.15` to `^8.5.23`; the lockfile now resolves `postcss` 8.5.26 everywhere.
- Cleared the remaining advisories reported by `npm audit`: `brace-expansion` (two DoS advisories, via `eslint` → `minimatch`) and `sharp` < 0.35.0 (inherited libvips CVEs, via `next`). `next` moves from 16.2.9 to 16.3.0 and `sharp` to 0.35.3, both within the existing semver ranges. `npm audit` now reports 0 vulnerabilities.

## [1.1.20] - 2026-08-07

### Changed

- Bumped `next` and `@next/eslint-plugin-next` from 16.2.12 to 16.3.0, `@testing-library/user-event` from 14.6.1 to 14.6.3, and `@types/react` in the npm-minor-and-patch group (dependabot, PR #84).

## [1.1.19] - 2026-08-03

### Changed

- Bumped `@playwright/test` from 1.62.0 to 1.62.1, `@types/react` from 19.2.17 to 19.2.18, and `@vitejs/plugin-react` from 6.0.4 to 6.0.5 in the npm-minor-and-patch group (dependabot, PR #83).

## [1.1.18] - 2026-07-30

### Changed

- Bumped `lucide-react` from 1.27.0 to 1.28.0 in the npm-minor-and-patch group (dependabot, PR #82).

## [1.1.17] - 2026-07-29

### Changed

- Bumped `@eslint-react/eslint-plugin` from 5.13.1 to 5.18.0, `eslint` from 10.6.0 to 10.8.0, `typescript-eslint` from 8.63.0 to 8.65.0, and `@types/node`, `globals`, `jsdom` in the npm-minor-and-patch group (dependabot, PR #81).

## [1.1.16] - 2026-07-27

### Changed

- Bumped `jsdom` from 29.1.1 to 30.0.0 (dependabot, PR #79).

## [1.1.15] - 2026-07-27

### Changed

- Bumped `next` and `@next/eslint-plugin-next` from 16.2.11 to 16.2.12, `lucide-react` from 1.26.0 to 1.27.0, and `@playwright/test` from 1.61.1 to 1.62.0 in the npm-minor-and-patch group (dependabot, PR #78).

## [1.1.14] - 2026-07-23

### Added

- Single source of truth for AI coding-tool configuration. `AGENTS.md` is now the canonical, tool-neutral project guide, and `CLAUDE.md` imports it via `@AGENTS.md` plus a short Claude-specific section, so shared guidance is authored once. A new `scripts/sync-ai.mjs` generator (`npm run sync:ai`) derives the Codex mirrors `.codex/agents/docs-updater.toml` and `.agents/skills/ship/SKILL.md` from the authored `.claude/` agent and skill sources.
- `AI Config Parity` CI job that regenerates the Codex mirrors and fails if the committed copies have drifted from their `.claude/` sources, so the two tools' configuration can no longer silently diverge.

### Changed

- The `docs-updater` agent and the `ship` skill now maintain `AGENTS.md` instead of `CLAUDE.md`, and `ship` regenerates and verifies Codex mirror parity as part of its pre-push fast checks. `README.md` now points developers to `AGENTS.md` for conventions and lists the new parity check among the CI gates.

## [1.1.13] - 2026-07-23

### Changed

- Bumped `lucide-react` from 1.25.0 to 1.26.0 in the npm-minor-and-patch group (dependabot, PR #76).

## [1.1.12] - 2026-07-22

### Changed

- Bumped `next` and `@next/eslint-plugin-next` from 16.2.10 to 16.2.11, `react` and `react-dom` from 19.2.7 to 19.2.8, and `@vitejs/plugin-react` from 6.0.3 to 6.0.4 in the npm-minor-and-patch group (dependabot, PR #75).

## [1.1.11] - 2026-07-21

### Changed

- Bumped `prettier` from 3.9.5 to 3.9.6 in the npm-minor-and-patch group (dependabot, PR #72).

## [1.1.10] - 2026-07-21

### Fixed

- The `Changelog Version` CI job now decides the dependabot exemption from the PR author (`github.event.pull_request.user.login`) instead of `github.actor`. `github.actor` is whoever triggered the run, so clicking "Update branch" on a dependabot PR — or re-running its checks — made the actor a human and revoked the exemption, failing a required check on a PR that by policy carries no changelog entry. The exemption now holds for the life of the PR regardless of who triggers the run.
- `.prettierignore` now excludes `.claude/settings.local.json`. The file is gitignored so CI never saw it, but `prettier --check .` did, so every local `npm run format:check` — including the one the `ship` skill runs as a gate before pushing — failed on a file that is not part of the repository.
- The `ship` skill's backfill step (step 2) now identifies a dependabot release from the merge's second parent (`git log -1 --format=%an "v<version>^2"`) rather than the merge commit itself. A merge commit is always authored by the human who clicked Merge, so the old check never matched `dependabot[bot]` and would have attributed every bot release to a human. Step 2 also now spells out the commands for reading what a tag changed, and notes that an empty `package.json` diff means a lockfile-only transitive bump.

## [1.1.9] - 2026-07-21

### Changed

- Bumped the transitive dependency `brace-expansion` from 5.0.6 to 5.0.7 in `package-lock.json` (dependabot, PR #73).

## [1.1.8] - 2026-07-21

### Changed

- Bumped `@testing-library/jest-dom` from 6.9.1 to 7.0.0 (dependabot, PR #71).

## [1.1.7] - 2026-07-17

### Changed

- Bumped `lucide-react` from 1.24.0 to 1.25.0, `@tailwindcss/postcss` from 4.3.2 to 4.3.3, and `autoprefixer` from 10.5.3 to 10.5.4 in the npm-minor-and-patch group; `tailwindcss` also moved to 4.3.3 within the existing `^4.3.1` range, so only the lockfile changed for it (dependabot, PR #70).

## [1.1.6] - 2026-07-16

### Added

- `ship` skill (`.claude/skills/ship/SKILL.md`) that refreshes docs, computes the version the merge will mint, writes the CHANGELOG entry, runs fast checks, and opens or updates the PR.
- `scripts/next-version.sh` — single source of truth for the next SemVer build, shared by the version workflow, the changelog CI guard, and the ship skill.
- `Changelog Version` CI job that fails a PR whose `CHANGELOG.md` does not name the version the merge will mint (dependabot PRs exempt). It is a required check on the "No Push to Main" ruleset, so it blocks the merge.
- This `CHANGELOG.md`, seeded with the `v1.1.x` release history.
- `.gitattributes` normalizing text files to LF, matching the `endOfLine: "lf"` policy in `.prettierrc`. Previously `core.autocrlf=true` checked files out as CRLF, so `prettier --check .` failed on a fresh clone and `git status` reported unmodified files as changed on Windows.

### Changed

- `.github/workflows/version.yml` now computes the build number via `scripts/next-version.sh` instead of an inline script.
- `AGENTS.md` and `CLAUDE.md` now document the ship skill and the `Changelog Version` job in place of the removed Stop hook.
- `.prettierignore` now excludes the gitignored `.superpowers/` agent scratch directory, which `prettier --check .` was failing on.
- `.claude/settings.json` now allowlists the read-only commands the ship skill runs (`npx tsc --noEmit`, `git tag -l`, `git merge-base`, `git branch --show-current`, `gh pr list`/`view`), so shipping prompts only for the operations that change something.

### Removed

- The docs-freshness `Stop` hook in `.claude/settings.json`; docs are now refreshed at ship time by the ship skill instead of after every response turn.

## [1.1.5] - 2026-07-15

### Changed

- Added `npm` and `github-actions` labels to the respective Dependabot update groups in `.github/dependabot.yml` (PR #68).

## [1.1.4] - 2026-07-15

### Changed

- Changed the Dependabot schedule time from 07:00 to 05:00 (`America/New_York`) for both the npm and GitHub Actions update groups in `.github/dependabot.yml` (PR #67).

## [1.1.3] - 2026-07-15

### Changed

- Bumped `autoprefixer` from 10.5.2 to 10.5.3 in the npm-minor-and-patch group (dependabot, PR #66).

## [1.1.2] - 2026-07-14

### Changed

- Bumped `actions/setup-node` from v6 to v7 across all four jobs in `.github/workflows/ci.yml` (dependabot, PR #65).

## [1.1.1] - 2026-07-10

### Changed

- Bumped `lucide-react` from 1.23.0 to 1.24.0 and `prettier` from 3.9.4 to 3.9.5 in the npm-minor-and-patch group (dependabot, PR #64).

## [1.1.0] - 2026-07-09

### Added

- `AGENTS.md`, a coding-agent guidance file mirroring `CLAUDE.md`, covering project overview, commands, CI/CD, architecture, theming, styling, and development patterns.

### Changed

- `.github/workflows/version.yml` now tags merges to `main` with standard three-part SemVer `v<major>.<minor>.<build>` release tags and creates a GitHub Release for each tag, replacing the previous 4-part build-tag scheme (PR #63).
