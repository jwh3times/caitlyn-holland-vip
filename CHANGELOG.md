# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

No unreleased changes.

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
