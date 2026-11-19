# Stamp each merge's changelog section when it is tagged, not when it ships

A branch no longer names the version its merge will mint. `ship` writes the branch's entries to its
own `changelog.d/<branch-slug>.md` fragment and never edits `CHANGELOG.md`; after the merge,
`.github/workflows/version.yml` runs `scripts/stamp-changelog.mjs`, which turns each untagged
merge's fragments (or, with none, its PR title) into a dated section, commits the sections with
`[skip ci]`, and tags the merge commit. The version is still `scripts/next-version.mjs`'s
computation, now made once, at tag time, over the merges in the order they landed. This supersedes
[ADR-0003](0003-changelog-names-the-minted-version.md).

ADR-0003 predicted the version at ship time, so every merge invalidated every open PR's changelog
section: branches shipped one at a time, a PR that merged ahead of another conflicted under
`## [Unreleased]`, and tags minted by Dependabot merges needed backfilling. Fragments cannot
collide, and a merge that wrote none still gets a section, so none of that survives.

The stamp commit goes straight to `main`, which the `No Push to Main` ruleset otherwise forbids, so
`version.yml` pushes it with a token from a release GitHub App listed as the ruleset's one bypass
actor (`GITHUB_TOKEN` cannot be one). Every first-parent commit on `main` is a release, so rebase
and squash merging stay off. The `Changelog Version` check keeps its name, which the ruleset
requires, and now checks the fragments instead of a predicted version. The scheme and its
operating rules are `stamp-on-tag` in `jwh3times/skills`, which holds the canonical scripts.
