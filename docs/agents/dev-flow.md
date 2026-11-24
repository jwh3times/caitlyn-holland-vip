# Development flow

The flow itself is `.agents/skills/open-pr/settings/dev-flow.md`, and `AGENTS.md` summarizes it. This file holds what this repository
adds.

## Docs and agent config

- `LICENSE`
- `docs/`

## Exemption details

- **Dependency bumps** are Dependabot's PRs, and hand-made bumps committed as `chore(deps): …` or, for
  an advisory patch, `fix(deps): …`.
- **Release prep** is the `docs: update docs and changelog fragment` commit `/open-pr` makes, which
  writes the branch's `changelog.d/` fragment and, for a new major or minor line, moves the
  `package.json` floor. The `CHANGELOG.md` sections and tags come later, from `version.yml`.

## Research

`/research` saves public-safe findings under `docs/research/<slug>.md`, never at the repository root,
which deploys and is format-checked; run `npm run format` afterwards. Credentials and repository
locators go in neither repository: use placeholders and leave the real values in 1Password.
[The destination policy](issue-tracker.md#where-a-work-item-goes) decides when a document straddles.
