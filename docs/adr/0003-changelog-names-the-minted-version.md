# The changelog names the version the merge will mint

Every merge to `main` is auto-tagged by `.github/workflows/version.yml`, so a branch's changelog section is written for the version its own merge will create — computed by `scripts/next-version.sh` — rather than accumulated under `[Unreleased]`. An `[Unreleased]` section is wrong the moment it lands, because by then the release it describes already has a number.

`## [Unreleased]` survives as a placeholder heading with `No unreleased changes.` beneath it, so the file's shape stays stable and the newest real section is always directly below it.

## Consequences

- `scripts/next-version.sh` is the single source of truth. The tag workflow, the `Changelog Version` CI guard, and the `ship` skill all call it — never compute the version by hand.
- The guard runs at PR time, not merge time. If another PR merges ahead of yours, your entry is numbered for a version someone else took, the guard may still show green from its earlier run, and the section has to be renumbered.
- Because both land directly under `## [Unreleased]`, a PR that merges ahead of yours will conflict there.
