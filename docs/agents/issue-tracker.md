# Issue tracker: GitHub

**GitHub is the only tracker.** Issues, the project board, and draft security advisories hold every
open work item for this repository and its private companion; **each live action has exactly one
canonical issue**. No Markdown file in either repository is a backlog, a roadmap, a task list, or a
status report — if a document would need editing to stay true as work progresses, that fact belongs
on an issue instead. The private wiki’s `human-todo` page is the required exception: it supplies
step-by-step instructions for human follow-ups while their issues retain canonical status.

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

- **Create an issue**: `gh issue create --title "..." --body "..."`. Use a heredoc for multi-line bodies.
- **Read an issue**: `gh issue view <number> --json number,title,body,labels,comments`.
- **List issues**: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'` with appropriate `--label` and `--state` filters.
- **Make an issue a sub-issue of a parent**: `gh issue create --parent <parent> ...`, or `gh issue edit <parent> --add-sub-issue <child>` afterwards (`gh` 2.94+). Older `gh`: `gh api --method POST repos/<owner>/<repo>/issues/<parent>/sub_issues -F sub_issue_id=<child-db-id>` (database id, as in **Blocking** below). Without sub-issues, put `Part of #<parent>` at the top of the child body.
- **Blocking**: GitHub's **native issue dependencies**, the canonical, UI-visible representation. Add an edge with `gh issue create --blocked-by <n>,<n> ...` or `gh issue edit <child> --add-blocked-by <blocker>` (`gh` 2.94+). Older `gh`: `gh api --method POST repos/<owner>/<repo>/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-db-id>`, where `<blocker-db-id>` is the blocker's numeric **database id** (`gh api repos/<owner>/<repo>/issues/<n> --jq .id`, _not_ the `#number` or `node_id`). Where dependencies aren't available, fall back to a `Blocked by: #<n>, #<n>` line at the top of the child body. A ticket is unblocked when every blocker is closed.
- **Count open blockers**: `gh api repos/<owner>/<repo>/issues/<n> --jq .issue_dependencies_summary.blocked_by` (open blockers only; 0 means startable). `gh issue view <n> --json blockedBy` also lists closed blockers, so filter it: `--jq '[.blockedBy.nodes[] | select(.state == "OPEN")] | length'`.
- **Comment on an issue**: `gh issue comment <number> --body "..."`
- **Apply / remove labels**: `gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **Close**: post the explanation with `gh issue comment <number> --body "..."`, then `gh issue close <number>`. On an already-closed issue, `gh issue close --comment` drops the comment and still exits 0.

Infer the repo from `git remote -v`; `gh` does this automatically when run inside a clone.

File issues only into the user's own repo. Never file into `mattpocock/skills` (the repo these skills come from) unless the user owns it. In a fork, `gh` can default to the upstream parent, so before the first `gh issue create` of a session, check the target with `gh repo view --json nameWithOwner` and confirm it with the user if it is not their repo.

## Pull requests as a triage surface

**PRs as a request surface: no.** _(Set to `yes` if this repo treats external PRs as feature requests; `/triage` reads this flag.)_

When set to `yes`, PRs run through the same labels and states as issues, using the `gh pr` equivalents:

- **Read a PR**: `gh pr view <number>`, then `gh pr view <number> --comments` (off a TTY, `--comments` prints only the comments, not the body), and `gh pr diff <number>` for the diff.
- **List external PRs for triage**: `gh api --paginate 'repos/{owner}/{repo}/pulls?state=open' --jq '.[] | select(.author_association | IN("OWNER","MEMBER","COLLABORATOR") | not) | {number, title, author: .user.login, author_association, labels: [.labels[].name]}'`.
- **Comment / label / close**: `gh pr comment`, `gh pr edit --add-label`/`--remove-label`, `gh pr close`.

GitHub shares one number space across issues and PRs, so a bare `#42` may be either: resolve with `gh pr view 42` and fall back to `gh issue view 42`.

## When a skill says "publish to the issue tracker"

Create a GitHub issue.

## When a skill says "fetch the relevant ticket"

Read it as in **Read an issue** above.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a single issue with **child** issues as tickets.

- **Map**: a single issue labelled `wayfinder:map`, holding the Notes / Decisions-so-far / Fog body. `gh issue create --label wayfinder:map`.
- **Child ticket**: an issue linked to the map as a GitHub sub-issue (see **Make an issue a sub-issue of a parent**). Where sub-issues aren't enabled, add the child to a task list in the map body and put `Part of #<map>` at the top of the child body. Labels: `wayfinder:<type>` (`research`/`prototype`/`grilling`/`task`). Once claimed, the ticket is assigned to the driving dev.
- **Blocking**: see **Blocking** under Conventions.
- **Frontier query**: list the map's open children (`gh issue list --state open`, scoped to the map's sub-issues / task list), drop any with an open blocker (see **Count open blockers**, or an open issue in the `Blocked by` line) or an assignee; first in map order wins.
- **Claim**: `gh issue edit <n> --add-assignee @me`, the session's first write.
- **Resolve**: `gh issue comment <n> --body "<answer>"`, then `gh issue close <n>`, then append a context pointer (gist + link) to the map's Decisions-so-far.

The board's `Blocked` status should agree with an issue's blockers; where it does not, the issue wins
and the card is wrong.

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

The [triage labels](triage-labels.md) and the board's Gate answer different questions: a label says who should
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

## Required human follow-ups from completed agent work

Required human actions left by completed agent work follow `docs/agents/human-follow-up.md`. This
standing instruction authorizes creating and updating those follow-up issues, adding them to the
board, and publishing the private wiki instructions without asking again. It authorizes
documentation, not the underlying account changes, purchases, or secret disclosure.

## Private work

Private, non-vulnerability actions belong to the companion repository's issues instead — see
[the private workspace runbook](private-workspace.md). Required human follow-ups use its issues and the linked `human-todo` wiki instructions above;
other task documents are not stored in the ordinary repository, and its issues go on the same private board as this repository's. Genuine unpublished
vulnerabilities belong in a draft security advisory in this public repository.

## Public repository

jwh3times/caitlyn-holland-vip

## Board

jwh3times 9

## Board fields

- `Status`: `Todo` / `In Progress` / `Blocked` / `Parked` / `Done`.
- `Gate`: why a `Blocked` or `Parked` item cannot start — `Nothing — ready to work`,
  `Owner decision`, `Upstream capability`, `Automation opens it`, `Depends on another item`,
  `Evidence needed`, `Repo admin access`. A `Blocked` or `Parked` item never carries
  `Nothing — ready to work`.
- `Area`: `Site content and sections`, `Design system and theming`, `Build and static export`,
  `Testing and coverage`, `CI and release`, `Dependencies and runtime`, `AI config and skills`,
  `Docs and process`, `Security`, `Defect`.
