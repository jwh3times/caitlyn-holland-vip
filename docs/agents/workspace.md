# Workspace

## Private companion

`private/` — its own Git repository, ignored by this one. Repository:
`discover: git -C private remote get-url origin` (its name stays out of public files; recover it
through `docs/agents/private-workspace.md` when the checkout is absent).

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
`npm run sync:agents`, which runs Prettier first — always: it is quick, and it also catches an orphaned mirror.
