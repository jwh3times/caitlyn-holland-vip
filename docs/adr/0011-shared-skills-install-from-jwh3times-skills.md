# Shared skills install from jwh3times/skills, not forked here

`end-session`, `handoff`, `lets-go`, `ship` and `docs-updater` install from the shared
[`jwh3times/skills`](https://github.com/jwh3times/skills) repository and are never edited here.
What they need to know about this repository lives in its settings files under `docs/agents/`
(`workspace.md`, `issue-tracker.md`, `human-follow-up.md`, `docs.md`, `releases.md`, `ship.md`,
`handoffs.md`), which each skill reads when it runs and proposes on its first run. Re-running the
install command is the update:

```bash
npx skills add jwh3times/skills -s end-session -s handoff -s lets-go -s ship -s docs-updater -a codex --copy -y
npm run sync:agents
```

[ADR-0006](0006-vendored-skill-policy.md) still governs the skills vendored from
`mattpocock/skills`: those are forked and edited in place. This decision covers only the five
shared skills, which the owner writes for every repository at once.

The problem was drift. Each of the owner's repositories carried its own hand-copied `ship`,
`end-session`, `handoff` and `lets-go`, and every copy had diverged: a fix made in one repository
reached none of the others. ADR-0006's reason to fork — that a correction in `AGENTS.md` does not
reliably reach a skill loaded into a subagent — does not apply here, because the settings files are
read by the skill itself, wherever it runs.

## Considered options

Keeping the four skills forked here, as ADR-0006 does for the vendored set, was the alternative. It
lets this repository word them exactly as it likes, but every fix has to be carried by hand to each
copy, which is how the copies drifted in the first place.

## Consequences

- A local edit to one of the five skills is lost on the next install. Repository-specific behavior
  goes into a setting instead; a fix to the skill goes to `jwh3times/skills`.
- `skills-lock.json` records the five as installed from `jwh3times/skills`; `handoff`, which was
  vendored from `mattpocock/skills`, is replaced by the shared skill of the same name.
- `.prettierignore` lists the five, so `npm run sync:agents`' formatting pass never rewrites them.
- The `docs-updater` agent (`.claude/agents/docs-updater.md`) becomes the shared `docs-updater`
  skill, and its documents table and triggers become the `Doc map` in `docs/agents/docs.md`.
- `scripts/sync-agents.mjs` and `scripts/lint-agent-neutrality.mjs` are copies of the canonical
  ones in `jwh3times/skills`; fix them there, then copy them here.
