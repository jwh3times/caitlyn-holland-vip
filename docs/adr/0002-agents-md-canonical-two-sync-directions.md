# AGENTS.md is canonical, and the two config kinds sync in opposite directions

`AGENTS.md` holds the tool-neutral project guidance and `CLAUDE.md` is a thin `@AGENTS.md` import plus a Claude-only section, so each fact is authored once. The two kinds of AI configuration then flow in **opposite** directions: Skills are authored under `.agents/skills/<name>/` and mirrored into `.claude/skills/`, while Agents are authored at `.claude/agents/*.md` and generated into `.codex/agents/*.toml`.

The directions differ because the operations differ. Mirroring a skill is a copy, so the tool-neutral tree owns it. Producing a Codex agent is a format conversion — markdown plus YAML frontmatter into TOML — so the richer source format owns it.

## Consequences

- `npm run sync:ai` regenerates both trees, and the `AI Config Parity` CI job fails if any mirror drifts. It also fails on a drifted `.agents/` **source**, because the sync prettier-formats sources on the way through.
- Never hand-edit `.claude/skills/` or `.codex/agents/`. Deleting a skill from `.agents/` prunes its mirror automatically.
- `.codex/config.toml` is the exception to "everything under `.codex/` is generated" — it is hand-authored Codex configuration with no generating source.
