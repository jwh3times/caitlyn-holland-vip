# Guard

The commands and paths `scripts/guard.mjs` stops in this repository, on top of the rules it applies
everywhere; the format is defined in `.agents/skills/open-pr/settings/guard.md`.

## Deny commands

- `^npx skills update\b` — leaves `.claude/skills/` linked to its source instead of copied; re-run
  the `npx skills add ... --copy -y` install in `AGENTS.md` instead.
- `^git add\b(?=.*\s(-f|--force)\b)(?=.*\sprivate(/|\s|$))` — stages the private companion into the
  public repository; `private/` is its own repository and is committed there.
- `^git submodule add\b(?=.*\sprivate/?(\s|$))` — makes the private companion a submodule of the
  public repository; it stays an ignored, independent clone (`docs/agents/private-workspace.md`).
- `^git add\b(?=.*\s(-f|--force)\b)(?=.*(\s|/)\.env(\.\S*)?(\s|$))` — forces an ignored env file,
  which may hold credentials, into Git; credentials belong in 1Password, and only the unignored
  `.env.example` templates are committed.
- `^(echo|printf|write-output|write-host)\b.*\$\{?(env:)?OP_SERVICE_ACCOUNT_TOKEN\b` — prints the
  1Password service-account token; check the session with `op whoami` instead.

## Ask commands

none

## Protected paths

- `^private/` — the private companion repository, in any form.
- `^\.env(\..*)?$` — local configuration and credentials that are not in Git.
- `^\.claude/settings\.local\.json$` — the maintainer's local Claude Code settings, not in Git.
- `^node_modules/` — the installed dependencies; reinstall with `npm ci` rather than deleting them.
