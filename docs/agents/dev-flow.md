# Development flow

The flow itself is `.agents/skills/ship/settings/dev-flow.md`, and `AGENTS.md` summarizes it. This file holds what this repository
adds.

## Docs and agent config

- `LICENSE`
- `docs/`

## Exemption details

- **Dependency bumps** are Dependabot's PRs, and hand-made bumps committed as `chore(deps): …` or, for
  an advisory patch, `fix(deps): …`.
- **Release prep** is the `docs: update docs and changelog for v<x.y.z>` commit `/ship` makes, which
  moves the `package.json` floor and writes `CHANGELOG.md`.

## Research

`/research` saves public-safe findings under `docs/research/<slug>.md`, never at the repository root,
which deploys and is format-checked; run `npm run format` afterwards. Credentials and repository
locators go in neither repository: use placeholders and leave the real values in 1Password.
[The destination policy](issue-tracker.md#where-a-work-item-goes) decides when a document straddles.
