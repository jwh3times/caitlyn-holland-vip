# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

No unreleased changes.

## [1.1.6] - 2026-07-16

### Added

- `ship` skill (`.claude/skills/ship/SKILL.md`) that refreshes docs, computes the version the merge will mint, writes the CHANGELOG entry, runs fast checks, and opens or updates the PR.
- `scripts/next-version.sh` — single source of truth for the next SemVer build, shared by the version workflow, the changelog CI guard, and the ship skill.
- `Changelog Version` CI job that fails a PR whose `CHANGELOG.md` does not name the version the merge will mint (dependabot PRs exempt).
- This `CHANGELOG.md`, seeded with the `v1.1.x` release history.
- `.gitattributes` pinning shell scripts to LF so `scripts/next-version.sh` runs under git-bash on Windows.

### Changed

- `.github/workflows/version.yml` now computes the build number via `scripts/next-version.sh` instead of an inline script.

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
