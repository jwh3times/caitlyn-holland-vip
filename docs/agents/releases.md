# Releases

## Scheme

per-merge — `.github/workflows/version.yml` tags every merge to `main`, and each merge's dated
changelog section names the version it mints (ADR-0003).

## Ask before bumping

when ambiguous

## Next-version command

`bash scripts/next-version.sh`

## Changelog check

`grep -Eq "^## \[$(bash scripts/next-version.sh | sed 's/\./\\./g')\]" CHANGELOG.md` — the
required **Changelog Version** check, inline in `.github/workflows/ci.yml`.
