# Vendored skills are forked and localized, not tracked upstream

The agent skills under `.agents/skills/` were vendored from [`mattpocock/skills`](https://github.com/mattpocock/skills) and pinned by content hash in `skills-lock.json`. An audit found that many carried assumptions this repo does not satisfy — a backend domain model, a `src/` tree, `pnpm`, `.env` and CI secrets, POSIX file modes, and a review flow that ends at "committed" rather than at an open PR. We treat the vendored set as a **starting point we own** rather than a dependency we track, and edit the sources in place.

Nothing reads `skills-lock.json` — no CI job, no script, no npm command — so it is provenance metadata, not a verified constraint. Forking therefore costs nothing at build time. The real risk is a future installer run silently overwriting local edits, which the lock file now records against.

## Considered options

Leaving the vendored files pristine and putting repo-specific corrections in `AGENTS.md` was the alternative. It keeps upstream diffs clean, but a skill loaded into a subagent's context does not necessarily carry `AGENTS.md` with it, so the correction would not reliably reach the place the wrong instruction is read.

## Consequences

- Skill count went from 26 to 15. Removed: `setup-matt-pocock-skills` (already run; re-running duplicates config), `teach`, `wayfinder`, `to-questionnaire`, `improve-codebase-architecture`, `triage`, `wizard`, `implement`, and `code-review` (duplicates and name-collides with Claude Code's built-in). The `grill-me` and `grill-with-docs` shims folded into `grilling`.
- `grilling` absorbed the doc-writing behavior that only `grill-with-docs` had. Because `grilling` is model-invocable and both shims were human-only, the `CONTEXT.md` / `docs/adr/` paper trail is reachable autonomously for the first time — which is why neither artifact existed before this change.
- Upstream improvements no longer arrive by re-running the installer. Adopting one means reading the upstream diff and applying it by hand.
- `ask-matt` routes only the surviving set and must be updated whenever a skill is added or removed, or it will describe a graph that does not exist.
