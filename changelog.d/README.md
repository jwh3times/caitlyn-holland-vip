# Changelog fragments

Each branch writes its changelog entries here, in one file named for the branch with each `/`
replaced by `-` (`feat/42-dark-mode` → `feat-42-dark-mode.md`). `/open-pr` writes it; never edit
`CHANGELOG.md` on a branch.

A fragment holds only Keep a Changelog category headings and their bullets, with no version or
date:

```markdown
### Added

- The contact section links to the résumé PDF.

### Fixed

- The theme toggle no longer flashes on first load.
```

Name a file in backticks rather than linking it: a relative link resolves from `changelog.d/` on
the branch but from the repository root once stamped into `CHANGELOG.md`, so it breaks in one place
or the other.

After the merge, `.github/workflows/version.yml` runs `scripts/stamp-changelog.mjs`, which moves
the fragments that merge added into its dated section of `CHANGELOG.md`, deletes them, and tags
the merge. A merge with no fragment gets one `### Changed` bullet from its PR title. A fragment
already on `main` belongs to the merge that added it: never edit or delete it, and the
`Changelog Version` check rejects a branch that does. This README is not a fragment.
