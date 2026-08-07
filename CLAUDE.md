# CLAUDE.md

The shared, tool-neutral project guidance lives in `AGENTS.md` and is imported below —
everything under "Claude-specific" applies only to Claude Code.

@AGENTS.md

## Claude-specific

The two kinds of config are authored in **different** trees. Check which one you are in
before editing:

- **Agents — authored under `.claude/`.** The `docs-updater` subagent is defined at
  [.claude/agents/docs-updater.md](.claude/agents/docs-updater.md); `npm run sync:ai`
  generates [.codex/agents/docs-updater.toml](.codex/agents/docs-updater.toml) from it.
  This direction stays `.claude`-first because it is a format conversion
  (markdown + YAML frontmatter → TOML), not a copy.
- **Skills — authored under `.agents/`.** Every skill, including `ship`, is authored at
  `.agents/skills/<name>/**` and mirrored to `.claude/skills/<name>/**` by
  `npm run sync:ai`. The `ship` skill source is
  [.agents/skills/ship/SKILL.md](.agents/skills/ship/SKILL.md).

**Never edit anything under `.claude/skills/` or `.codex/` — both are generated**, and
`npm run sync:ai` will overwrite your changes. Every file in a skill directory is
mirrored, not just `SKILL.md`. The `AI Config Parity` CI job fails if a mirror drifts.
