# CLAUDE.md

The shared, tool-neutral project guidance lives in `AGENTS.md` and is imported below —
everything under "Claude-specific" applies only to Claude Code.

@AGENTS.md

## Claude-specific

The two kinds of config are authored in **different** trees. Check which one you are in
before editing:

- **Agents — authored under `.claude/`.** A subagent is defined at `.claude/agents/<name>.md`, and
  `npm run sync:agents` generates `.codex/agents/<name>.toml` from it; none is defined today.
  This direction stays `.claude`-first because it is a format conversion
  (markdown + YAML frontmatter → TOML), not a copy.
- **Skills — under `.agents/`.** Every skill lives at `.agents/skills/<name>/**` and is mirrored
  to `.claude/skills/<name>/**` by `npm run sync:agents`. `ship`, `end-session`, `handoff`,
  `lets-go` and `docs-updater` are installed from `jwh3times/skills` and never edited here
  (ADR-0011); the rest are forked and edited in place.

**Never edit anything under `.claude/skills/` or `.codex/agents/` — both are generated**, and
`npm run sync:agents` will overwrite your changes. Every file in a skill directory is
mirrored, not just `SKILL.md`. The `AI Config Parity` CI job fails if a mirror drifts.

The one exception under `.codex/` is [.codex/config.toml](.codex/config.toml) — hand-authored
Codex configuration (the context7 MCP server) with no generating source. Edit it directly.
