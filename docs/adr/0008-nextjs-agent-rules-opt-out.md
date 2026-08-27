# Next.js agent-rules auto-generation is disabled, not committed

Next.js 16.3 added a `next dev` step that appends a managed `<!-- BEGIN:nextjs-agent-rules -->` block to `AGENTS.md` when it detects a coding agent in the environment (`node_modules/next/dist/server/lib/generate-agent-files.js`, called from `start-server.js`). Every agent-driven `npm run dev` — and every local Playwright run, since `playwright.config.ts` starts the dev server — left `AGENTS.md` dirty, and that noise landed in unrelated pull requests. We set `agentRules: false` in `next.config.ts`, the documented opt-out, and re-authored the block's advice by hand in `AGENTS.md`.

`AGENTS.md` is the canonical hand-authored guidance per [ADR-0002](0002-agents-md-canonical-two-sync-directions.md), and this repo's convention is that generated content lives in a designated tree, carries an `AUTO-GENERATED` banner, and is drift-checked. A tool writing an unbannered block into the one file every agent session loads as project instruction inverts that. Note the block never was a `AI Config Parity` failure — `npm run sync:ai` touches only `.agents/`, `.claude/skills/`, and `.codex/agents/` — so the entire cost was the dirty tree, and the entire fix is one config line.

## Considered options

Committing the block once was the alternative, and it works today: Prettier leaves the block unmodified at `printWidth: 100`, and `.gitattributes` normalizes EOLs, so `hasCurrentAgentRules()` keeps matching and `next dev` stops rewriting. It was rejected for what happens next. That match is exact-string, so any wording change in a future `next` release re-dirties the tree for everyone until someone commits the new text — recurring churn on a dependency Dependabot bumps on a weekly schedule. It also lets Vercel edit the instructions this project hands its agents, in a file where a reader cannot tell authored guidance from vendored guidance.

Disabling costs the pointer to the version-matched bundled docs, which is the block's one genuinely useful claim. Re-stating it by hand recovers that, and the hand-written version can be more specific than the generic text.

## Consequences

- `agentRules: false` is load-bearing. Removing it silently restores the dirty-tree behavior on the next agent-run `next dev`, so `tests/unit/next-config.test.ts` asserts the flag is present and that no `nextjs-agent-rules` marker has been committed into `AGENTS.md` or `CLAUDE.md`.
- The bundled-docs guidance is now this repo's to maintain. On a major `next` upgrade, re-read `node_modules/next/dist/docs/01-app/02-guides/ai-agents.md` and refresh the quoted paragraph in `AGENTS.md` if upstream's advice has moved on.
- The opt-out is a `next.config.ts` key, validated by Next's config schema. Downgrading below 16.3 would make it an unknown key and produce a config warning.
- Only agent-detected environments were ever affected — `@vercel/detect-agent` keys off `CLAUDECODE`, `CODEX_*`, `CURSOR_*` and similar. CI never set them, so this changes nothing about GitHub Actions.
