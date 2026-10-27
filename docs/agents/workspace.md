# Workspace

## Private companion

`private/` — its own Git repository, ignored by this one. Repository:
`discover: git -C private remote get-url origin` (its name stays out of public files; recover it
through `docs/agents/private-workspace.md` when the checkout is absent).

## Workspace status command

`git status --short --branch` and `git -C private status --short --branch`

## Companion commit policy

ship

## Sync with main

`npm run sync:main` — fast-forwards both clean worktrees.

## Safe-to-remove paths

Left in place by default; offer to remove them only when the user wants the disk back:

- `.next/`, `out/`, `coverage/`, `playwright-report/`, `test-results/`, `blob-report/`
- stray scratch files at the repository root or under `private/`, named one by one

## Never-remove paths

- `node_modules/`
- `private/`, in any form
- `.env`, `.env.*`, `.env*.local`
- `.claude/settings.local.json`
- `.claude/worktrees/` — removing one is the user's decision; it may hold unpushed commits

## Dev stack

none

## Generated-config check

`npm run sync:agents:check` (the required **AI Config Parity** check), regenerated with
`npm run sync:agents` — when agent sources changed (`.agents/skills/`, `.claude/agents/`).

## Final portability check

none
