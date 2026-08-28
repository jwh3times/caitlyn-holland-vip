# Issue tracker: GitHub

Issues and specs for this repo live as GitHub issues, and **each live action has exactly one
canonical issue**. Prefer the `gh` CLI; it infers the repo from `git remote -v` when run inside a
clone.

Where `gh` is unavailable — a remote or web agent session, for example — the GitHub MCP tools are
the substitute for the same operations (list, view, create, comment, label, close). The commands
below stay the primary form; a missing `gh` means an operation is spelled differently, not that it
is impossible.

## Conventions

- **Create**: `gh issue create --title "..." --body "..."`. Use a heredoc for multi-line bodies.
- **Read**: `gh issue view <number> --comments`.
- **List**: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'`, with `--label` / `--state` filters as needed.
- **Comment**: `gh issue comment <number> --body "..."`
- **Label**: `gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **Close**: `gh issue close <number> --comment "..."`

When a skill says "publish to the issue tracker", create a GitHub issue. When it says "fetch the
relevant ticket", run `gh issue view <number> --comments`.

GitHub shares one number space across issues and PRs, so a bare `#42` may be either — resolve with
`gh pr view 42` and fall back to `gh issue view 42`.

## Triage labels

The skills speak in terms of five triage roles; these are the label strings that carry them here.

| Label             | Meaning                                  |
| ----------------- | ---------------------------------------- |
| `needs-triage`    | Maintainer needs to evaluate this issue  |
| `needs-info`      | Waiting on reporter for more information |
| `ready-for-agent` | Fully specified, ready for an AFK agent  |
| `ready-for-human` | Requires human implementation            |
| `wontfix`         | Will not be actioned                     |

When a skill mentions a role — "apply the AFK-ready triage label" — use the matching string above.
Topic labels (`enhancement`, `documentation`, `dependencies`, `github-actions`, …) are additive and
independent of triage state.

## Grouping and blocking tickets

Used by `/to-tickets` when publishing a set of tickets that hang off a parent or block each other.

- **Parent / child**: link a child to a parent as a GitHub **sub-issue** — `gh api --method POST repos/<owner>/<repo>/issues/<parent>/sub_issues -F sub_issue_id=<child-db-id>`, where `<child-db-id>` is the child's numeric **database id** (`gh api repos/<owner>/<repo>/issues/<n> --jq .id`), _not_ its `#number`. Where sub-issues aren't enabled, add the child to a task list in the parent body and put `Part of #<parent>` at the top of the child body.
- **Blocking**: GitHub's **native issue dependencies** — the canonical, UI-visible representation. Add an edge with `gh api --method POST repos/<owner>/<repo>/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-db-id>`, using the blocker's database id the same way. GitHub reports `issue_dependencies_summary.blocked_by` (open blockers only — the live gate). Where dependencies aren't available, fall back to a `Blocked by: #<n>, #<n>` line at the top of the child body. A ticket is unblocked when every blocker is closed.
- **Ready work**: list open issues (`gh issue list --state open`) and drop any with an open blocker (`issue_dependencies_summary.blocked_by > 0`, or an open issue in the `Blocked by` line).

## Private work

Private, non-vulnerability actions belong to the companion repository's issues instead — see
[the private workspace runbook](private-workspace.md). Genuine unpublished vulnerabilities belong in
a draft security advisory in this public repository.
