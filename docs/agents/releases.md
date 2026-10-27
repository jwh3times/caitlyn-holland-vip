# Releases

## Scheme

per-merge — `.github/workflows/version.yml` tags every merge to `main`, and each merge's dated
changelog section names the version it mints (ADR-0003).

## Skipped tags

backfill — a merged Dependabot PR (exempt from the changelog check) or a PR opened in the web UI
gets its section on the next ship.

- **Ignore:** the 4-part `v1.0.0.x` tags, which predate the changelog.

## Version file

`package.json` (with `package-lock.json` beside it)

## Bump command

`npm version <version> --no-git-tag-version`

## Ask before bumping

when ambiguous

## Next-version command

`bash scripts/next-version.sh`

## Unreleased placeholder

`No unreleased changes.`

## Changelog check

`grep -Eq "^## \[$(bash scripts/next-version.sh | sed 's/\./\\./g')\]" CHANGELOG.md` — the
required **Changelog Version** check, inline in `.github/workflows/ci.yml`.

## Release commit message

`chore: prepare release v<version>`
