# Issue tracker: GitHub

**GitHub is the only tracker.** Issues, the project board, and draft security advisories hold every
open work item for this repository and its private companion; **each live action has exactly one
canonical issue**. No Markdown file in either repository is a backlog, a roadmap, a task list, or a
status report — if a document would need editing to stay true as work progresses, that fact belongs
on an issue instead.

Prefer the `gh` CLI; it infers the repo from `git remote -v` when run inside a clone.

Where `gh` is unavailable — a remote or web agent session, for example — the GitHub MCP tools are
the substitute for the same operations (list, view, create, comment, label, close). The commands
below stay the primary form; a missing `gh` means an operation is spelled differently, not that it
is impossible.

## Where a work item goes

| Kind of work                                       | Destination                                                                                         |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Public engineering, site content, docs, CI         | An issue in this repository, added to the board                                                     |
| Work whose description would leak private material | An issue in the private companion, added to the same board — the board itself is private            |
| An unpublished vulnerability                       | A draft security advisory in this repository, never an issue — see [SECURITY.md](../../SECURITY.md) |
| A routine dependency bump                          | Dependabot's own PR. File an issue only when a bump needs a decision the PR cannot carry            |

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

## The project board

[Board 9](https://github.com/users/jwh3times/projects/9) (`gh project view 9 --owner jwh3times`) is
the view over those issues. It is private, and it spans both repositories. Its own README carries
the field definitions; this section is how to drive it.

**Every new issue goes on the board**, in either repository — an issue that is not on it is
invisible to the next session. **The issue is the record; the board is a view.** Durable facts go in the issue body and comments,
never only in a Project field. The fields are deliberately cheap to update, so the board can go
stale without losing anything.

Three single-select fields carry state that labels never could:

- **Status** — `Todo` · `In Progress` · `Blocked` · `Parked` · `Done`.
- **Gate** — why a `Blocked` or `Parked` item cannot start: `Nothing — ready to work`,
  `Owner decision`, `Upstream capability`, `Automation opens it`, `Depends on another item`,
  `Evidence needed`, `Repo admin access`. A `Blocked` or `Parked` item must carry a gate other than
  `Nothing — ready to work`.
- **Area** — which part of the project the work touches.

The triage labels below and the board's Gate answer different questions: a label says who should
pick an issue up, a gate says what must happen first. Both, not one or the other.

Add an issue and set its fields:

```bash
gh project item-add 9 --owner jwh3times --url <issue-url> --format json --jq .id
gh project field-list 9 --owner jwh3times --format json   # field ids and option ids
gh project item-edit --id <item-id> --project-id <project-id> \
  --field-id <field-id> --single-select-option-id <option-id>
```

`gh` needs the `project` scope for those fields to be writable — check with `gh auth status` and
look for `project`, not `read:project`; fix with `gh auth refresh -h github.com -s project`.

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
- **Ready work**: list open issues (`gh issue list --state open`) and drop any with an open blocker (`issue_dependencies_summary.blocked_by > 0`, or an open issue in the `Blocked by` line). The board's `Blocked` status should agree; where it does not, the issue wins and the card is wrong.

## Private work

Private, non-vulnerability actions belong to the companion repository's issues instead — see
[the private workspace runbook](private-workspace.md). That repository stores no task documents of
its own; its issues go on the same private board as this repository's. Genuine unpublished
vulnerabilities belong in a draft security advisory in this public repository.
