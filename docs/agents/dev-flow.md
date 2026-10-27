# Development flow

The binding process for changing code in this repository. The flow map itself — which skill
follows which, and how to cross a phase boundary — is the
[`ask-matt` router](../../.agents/skills/ask-matt/SKILL.md) and its
[phase-boundary tree](../../.agents/skills/ask-matt/PHASE-BOUNDARIES.md). This doc adds what the
router leaves open: the gate, the routes into it, the exemptions, and how work links to its issue.

## The gate

A code change starts from a **ready issue**, one of:

- An open issue labelled `ready-for-agent` whose body is a `/to-spec` spec (it carries
  `## Problem Statement` and `## User Stories`) or a `/to-tickets` ticket (`## What to build` and
  `## Acceptance criteria`), with no open blocker — see
  [Ready work](issue-tracker.md#grouping-and-blocking-tickets).
- An open `bug` issue, worked through `/diagnosing-bugs`. The issue number is required; a spec is
  not.

Check with `gh issue view <n> --comments` before the first edit to a [code path](#what-counts-as-code).
When no issue qualifies, stop there, route the user with the table below, and wait. A
`ready-for-agent` label on a free-form body is a raw issue, not a ready one.

The gate covers edits only. Reading code, running tests and checks, and answering questions need
no issue.

## Routes to a ready issue

| Situation                        | The human runs                                                                                                                                                                                                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| An idea one session can hold     | `/grilling`, then `/to-spec`; add `/to-tickets` when the build spans sessions                                                                                                                                                                                                   |
| A huge, foggy, multi-session ask | `/grilling` one session at a time. Settled terms and decisions land in `CONTEXT.md` and `docs/adr/`; the open questions go on a GitHub issue the next session resumes from. `/research` and `/prototype` settle what conversation cannot. `/to-spec` once the frontier is empty |
| A raw issue someone else filed   | `/grilling` seeded with the issue, then `/to-spec`. The spec names the raw issue, which is closed with a comment linking the spec                                                                                                                                               |
| A ready issue nobody has started | `/clear` (or a fresh session), then `/tdd #<n>`                                                                                                                                                                                                                                 |
| Something broken                 | File a `bug` issue and add it to the board, then `/diagnosing-bugs #<n>`                                                                                                                                                                                                        |

The upstream flow names `/grill-with-docs`, `/wayfinder`, `/triage`, and `/implement`. This repo
removed them ([ADR-0006](../adr/0006-vendored-skill-policy.md)); `/grilling` is the folded
`/grill-with-docs`, and the table routes the other three through the surviving skills.

## Phases

The human starts every phase by typing its command: `/grilling`, `/to-spec`, `/to-tickets`,
`/tdd #<n>`, `/diagnosing-bugs #<n>`, `/ship`. `/to-spec` and `/to-tickets` carry
`disable-model-invocation: true`, so the harness holds that line. `/grilling`, `/tdd`,
`/diagnosing-bugs`, and `/ship` are model-invocable, so for them this rule is the only gate.

At a phase boundary, name the next command, give the reason in one line, and wait:

> Next: `/to-spec` — the frontier is empty and every decision is still fresh in this context.

Inside a phase the human has started, reach for these yourself wherever they fit: `/tdd`,
`/code-review`, `/diagnosing-bugs`, `/domain-modeling`, `/codebase-design`, `/prototype`,
`/research`. `/code-review` is Claude Code's built-in; under Codex, review the diff by hand
before naming `/ship`.

## Exemptions

These changes need no ready issue:

- **Dependency bumps** — Dependabot's PRs, and hand-made bumps committed as `chore(deps): …` or,
  for an advisory patch, `fix(deps): …`.
- **Docs and agent config only** — a branch whose every changed path is in the docs list under
  [What counts as code](#what-counts-as-code).
- **Release prep** — the `chore: prepare release v<x.y.z>` commit `/ship` makes, which moves the
  `package.json` floor and writes `CHANGELOG.md` on a branch that already passed the gate or is
  exempt.
- **User waiver** — the user explicitly waives the flow for this change. Record it in the PR body
  as `Flow waived by the user: <reason>`.

### What counts as code

Docs and agent config are:

- Markdown and `LICENSE` at the repository root (`AGENTS.md`, `CLAUDE.md`, `README.md`,
  `CONTEXT.md`, `CHANGELOG.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`)
- `docs/`
- `.agents/`, `.claude/`, `.codex/`, and `skills-lock.json`
- `.github/pull_request_template.md`

Code is every other tracked path: `app/`, `components/`, `lib/`, `public/`, `scripts/`, `tests/`,
`benchmarks/`, `.github/workflows/`, `.github/dependabot.yml`, and the root config files
(`package.json`, `package-lock.json`, `next.config.ts`, `tsconfig.json`, `vitest.config.ts`,
`vitest.setup.ts`, `playwright.config.ts`, `.oxlintrc.json`, `.prettierrc`, `.prettierignore`,
`.gitignore`, `.gitattributes`, `.nvmrc`). Agent tooling written as code —
`scripts/sync-agents.mjs`, `scripts/handoff-map.mjs` — is code. A branch that touches any code
path is gated, whatever else it touches.

## Linking work to its issue

**Branch:** `<type>/<issue#>-<slug>`, where `<type>` is the Conventional Commit type the work
carries (`feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `ci`) — for example
`chore/230-drop-compression-override` or `fix/236-braces-advisory`. Exempt work with no issue uses
`<type>/<slug>` (`docs/dev-flow`); Dependabot names its own. The older `agent/…` and `jwh3times/…`
branches predate this pattern.

**PR body:** the first line links the issue, above the summary `/ship` derives from the changelog:

- `Closes #<n>` — the PR finishes the issue: a ticket, a spec built in one PR, or a bug.
- `Part of #<n>` — the PR is one slice of a spec that stays open.
- `Flow waived by the user: <reason>` — a waived change with no issue.

GitHub closes an issue only from a keyword in the body. A `#<n>` in the title alone links nothing,
and `Part of` deliberately closes nothing.
