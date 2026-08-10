# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

No unreleased changes.

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
