---
name: end-session
description: End the work session cleanly — flush what you learned into memory, private/ docs, and GitHub issues, then tidy the local workspace.
disable-model-invocation: true
---

# End Session

> Clean up the local workspace, update any private/ docs and/or github issues that need it from this session.

**Announce at start:** "I'm using the end-session skill to close out this session."

## Why this exists

A session's most perishable output is not the code — that's in git. It's the things you
_learned_: the config that turned out to be different from what the docs said, the
decision the user made and the reason behind it, the follow-up nobody wrote down. Those
live only in the conversation until something durable captures them, and the next session
starts blind without them.

This skill is the flush. Work steps 1–5 in order; each has a **"nothing to do" exit** —
say so and move on rather than inventing work. It is a **read-and-record pass, not a
refactor**: do not start new code changes here.

Git / `gh` commands run in a bash/POSIX shell (git-bash on this Windows machine), not
PowerShell.

## 1. Take stock of the session

Before writing anything, list — for yourself — what this session actually produced:

- **Facts discovered** about the repo, its tooling, GitHub config, or the deployment that
  were not already written down (candidates for memory or `private/`).
- **Decisions the user made**, and the reasoning (candidates for memory or an ADR).
- **Work completed or abandoned** that an issue is tracking (candidates for issue updates).
- **Loose ends** — anything found but deliberately not fixed.
- **Files created** that were never meant to be permanent.

Then check what the session already committed, so you don't re-record what git holds:

```bash
git status --porcelain
git log --oneline origin/main..HEAD
```

If the session produced nothing durable — a question answered, a doc read — say exactly
that, do step 5, and stop.

## 2. Update memory

Memory files live **outside the repo**, in the per-project memory directory
`~/.claude/projects/<project-slug>/memory/` — for this repo the slug is
`C--Users-jerry-OneDrive-Documents-VSCodeProjects-caitlyn-holland-vip`. Each file is one
fact with `name` / `description` / `metadata.type` frontmatter, and `MEMORY.md` is the
one-line-per-memory index loaded every session.

Read `MEMORY.md` first. Today it holds `main-branch-protection` and
`dependency-automation` — **check whether the fact belongs in an existing file before
creating a new one**, and prefer updating that file (correcting it counts, and a memory
proved wrong should be deleted, not left standing).

Record only what is durable and **not derivable from the repo**: GitHub settings and
rulesets, external service configuration, the user's standing preferences and the
corrections they gave you, ongoing goals and constraints. Do **not** memorize code
structure, CI job names, or conventions — `AGENTS.md`, `CLAUDE.md`, and the ADRs already
carry those, and a memory that duplicates them goes stale silently. Convert relative
dates ("last week") to absolute ones. Link related memories with `[[name]]`.

Every new file needs its pointer line appended to `MEMORY.md`. A memory that isn't in the
index is invisible.

## 3. Update `private/` docs

`private/` is **gitignored** (see `.gitignore`) — untracked working notes that never reach
a commit, a PR, or CI. Prettier's default ignore path includes `.gitignore`, so
`npm run format:check` does not see these files and an edit here cannot break a build.
Three documents live there today:

| File                                          | What it holds                                                                               |
| --------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `private/todo.md`                             | Follow-through status on `repo-analysis.md` findings — open / in progress / done / won't do |
| `private/repo-analysis.md`                    | The dated deep-dive review, with a per-finding status table                                 |
| `private/dependency-modernization-2026-08.md` | The dated dependency-currency audit and its four follow-ups                                 |

Update the one the session touched:

- Landed something an entry tracks → flip its status and name the **PR number**, matching
  the existing legend (`⬜ open · 🔄 in progress · ✅ done (merged)`) and table style.
- Decided _not_ to do something → move it to the "intentionally not doing" section **with
  the reason**. That section is the point of the file; a silent deletion loses it.
- Found a new follow-up too small or too speculative for an issue → add it as an open item.
- Any file with a "Last updated" line gets today's date when you edit it.

Dated audit documents (`repo-analysis.md`, `dependency-modernization-2026-08.md`) are
snapshots — amend their status sections, don't rewrite their findings as if the original
review had said something else. A genuinely new audit is a new dated file.

**Know the boundary.** `private/` is for working notes only. If what you learned is a fact
about the codebase, it belongs in tracked docs instead, and those are edited on a branch:
`AGENTS.md` / `README.md` (owned by the `docs-updater` subagent, which `/ship` runs), an
ADR under `docs/adr/` for a decision, `docs/research/` for a sourced investigation, and
`CHANGELOG.md` only via `/ship`. Say which of those is needed; don't smuggle a repo fact
into `private/` because it's the file that doesn't need a PR.

## 4. Update GitHub issues

Conventions are in [`docs/agents/issue-tracker.md`](../../../docs/agents/issue-tracker.md);
the label vocabulary is in [`docs/agents/triage-labels.md`](../../../docs/agents/triage-labels.md)
(`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). Start from
what's open:

```bash
gh issue list --state open --json number,title,labels \
  --jq '.[] | "\(.number) \(.title) [\([.labels[].name] | join(","))]"'
```

For each issue this session touched:

- **Learned something material** → `gh issue comment <n> --body "..."`. Comment when the
  session changed what a reader would conclude — a root cause, a blocker, a rejected
  approach. Don't narrate that you looked at it.
- **Fixed it** → do **not** close it by hand if a PR is open; put `Fixes #<n>` in the PR
  body and let the merge close it. Close directly only for work that will never have a PR,
  and always with `--comment` explaining why.
- **Triage state moved** → adjust labels with `gh issue edit <n> --add-label / --remove-label`.
- **Found a new, self-contained follow-up** → `gh issue create` with a heredoc body, and
  label it `needs-triage`. One issue per follow-up. Speculation stays in `private/todo.md`
  instead.

Remember GitHub shares one number space across issues and PRs, so resolve a bare `#42`
with `gh pr view 42` before falling back to `gh issue view 42`.

**Ask before creating or closing anything.** Comments and labels are cheap and reversible;
new issues and closures are the user's call — list what you propose and wait for a yes.

## 5. Clean the local workspace

Inspect before deleting. Anything you can't account for gets reported, not removed.

```bash
git status --porcelain --ignored -uall | grep -v '^!! \(node_modules\|\.next\|\.git\)/'
git worktree list
```

### Files and artifacts

- **Uncommitted tracked changes** → never discard them. If the branch is finished, hand
  off to `/ship`; otherwise stop and ask. `git checkout --`, `git reset --hard`, and
  `git stash drop` are off-limits in this skill.
- **Scratch files you created this session** — probe scripts, one-off `.mjs`/`.sh` files,
  dumps at the repo root, stray files under `private/` — delete them, naming each one.
  Anything of lasting value moves to `private/` or a tracked doc _first_.
- **The session scratchpad directory** (under the OS temp tree) — safe to leave; it is
  outside the repo and self-clearing. Empty it only if the user asks.
- **Build and test artifacts** — `.next/`, `out/`, `coverage/`, `playwright-report/`,
  `test-results/`, `blob-report/`. All gitignored and regenerated on the next run. Leave
  them by default; offer to remove them only if the user wants the disk back.
- **`node_modules/`** — never touch.
- **Stale agent worktrees** under `.claude/worktrees/` — report any that `git worktree list`
  shows; removing one is a user decision because it may hold unpushed commits.
- **Generated mirrors** — if the session edited `.agents/skills/**` or `.claude/agents/**`,
  run `npm run sync:ai` and confirm `git status --porcelain -- .codex .claude/skills .agents`
  prints nothing, so the `AI Config Parity` gate stays green. A hand-edit under
  `.claude/skills/` or `.codex/agents/` is the real bug — fix the source and re-sync.

### Branches

Finish by leaving the checkout on an up-to-date `main` with the spent branches gone. Do this
**last** — after the file tidying above, so nothing you still need is sitting on the branch you
are about to leave — and start from what the tree says:

```bash
git branch --show-current
git status --porcelain
```

Two things stop the switch. Neither is a failure; report it and leave the checkout where it is:

- **Uncommitted tracked changes.** Switching would carry them onto `main` or fail outright, and
  step 5's first bullet already rules out discarding or stashing them. Stay on the branch.
- **The user said they are continuing on this branch.** Ending the session is not ending their
  work; don't move the checkout out from under them.

Unpushed commits are not a stop — they ride along on the branch — but they do mean the branch is
unfinished. Return to `main`, keep that branch, and name `/ship` in the report.

Otherwise return to `main` and bring it up to date:

```bash
git switch main
git fetch origin --prune
git pull --ff-only origin main
```

`--prune` drops remote-tracking refs for branches deleted on GitHub after their PR merged.
`--ff-only` keeps the pull a fast-forward: if it refuses, local `main` carries commits of its
own — report that and leave `main` alone rather than merging, rebasing, or resetting it.

Then delete the local branches whose work is already in `main`:

```bash
git branch --merged main --format='%(refname:short) %(worktreepath)' | grep -v '^main '
```

Every name that prints is fully contained in the refreshed `main` — delete each with
`git branch -d <name>`, naming them in the report. A second column means the branch is checked
out in a worktree and git will refuse; report those with the stale worktrees above instead of
forcing them. Never `git branch -D`: the capital form discards unmerged commits without asking,
and a branch `-d` refuses is telling you it still holds work.

That list misses **squash- or rebase-merged branches**: their commits were rewritten on the way
in, so git still calls them unmerged even though the change is on `main`. This repo merges PRs
with merge commits today, so the case is rare — check the PR state before assuming a leftover
branch is live:

```bash
for b in $(git branch --format='%(refname:short)' | grep -vx main); do
  echo "$b -> $(gh pr list --head "$b" --state merged --json number -q '.[0].number')"
done
```

A branch that prints a merged PR number can go. Still delete it with `-d`, not `-D` — if `-d`
refuses one whose PR merged, the branch has commits that never reached the PR, so leave it and
say so.

**Pushed is not merged.** A branch with an open or unmerged PR stays, however green it is —
deleting it strands the review. Only a branch whose work is on `main` goes.

## 6. Report

Give the user a short close-out: memories written or updated, `private/` edits, issues
commented / labelled / proposed, files deleted, branches deleted, and which branch the
checkout is sitting on. Note anything left dirty on purpose. If a branch is still unshipped,
say so and name `/ship` as the next step. State plainly what you deliberately left alone.

## Do not

- Write code, fix bugs, or refactor. This skill records and tidies; new work is a new session.
- Delete, revert, or stash uncommitted work — ask instead.
- Run `git clean -x` or any bulk delete of ignored files.
- Commit, push, or merge. Fast-forwarding local `main` onto `origin/main` in step 5 is the
  one exception; anything needing a PR goes through `/ship`.
- Force-delete a branch (`git branch -D`), or delete one whose PR has not merged.
- Close issues or open new ones without the user's go-ahead.
- Record in memory or `private/` what `AGENTS.md`, the ADRs, or git history already say.
