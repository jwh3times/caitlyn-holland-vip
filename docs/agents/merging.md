# Merging

From an open pull request to a finished merge. What CI runs and what the ruleset requires are in
`AGENTS.md` ("CI/CD"); this file holds the steps around it and what has gone wrong.

## When to merge

`open-pr` stops when the PR opens. The owner hands the merge over explicitly ("merge the PR", "merge
when all checks are green", "merge and complete all follow ups"), and that authorization covers the
PRs named in that turn only: never infer it from an earlier PR in the session. Merge only once every
required check on the current head reports green, never on a pending or failing one.

## Merging

`gh pr merge <n> --merge --delete-branch`. Merge commits are the only method the repository offers.

- **Auto-delete on merge is on** (`delete_branch_on_merge: true`), so GitHub removes the head
  branch from `origin` when the PR merges; `--delete-branch` also removes the local one.
- **Deleting a merged branch with `git push origin --delete <branch>` prints
  `remote: - Cannot delete this branch`** (from the "Block delete branches" ruleset) **and still
  succeeds.** Confirm with `git ls-remote --heads origin` rather than trusting the message.
- **To tell whether a branch is spent, ask GitHub:** `gh pr list --head <branch> --state merged`.
  Some PRs merged before 2026-09-18 were squashed, so their branches aren't ancestors of `main` and
  `git branch --merged` doesn't list them. Cut new work from a fresh `origin/main` branch rather than
  reusing a merged one, and never force-push.
- **Open PRs merge in any order.** No branch names a version, so a merge ahead of yours changes
  nothing in your changelog fragment. Catching up is only the strict required checks: merge
  `origin/main` into the branch or use "Update branch".
- **Never edit or delete a fragment already on `main`.** It belongs to the merge that added it, and
  `version.yml` releases that merge's copy, so `Changelog Version` rejects the change. A correction
  to a released entry is a new fragment.

## The release

- **`version.yml` stamps and tags asynchronously.** Each run pushes one stamp commit,
  `chore(release): v<x.y.z>[, ...] [skip ci]`, for every merge it releases, and tags each merge
  commit. Pull before cutting the next branch so it starts from the stamped changelog, and update
  another open PR only after the stamp commit lands: it moves `main` again, so a PR updated before
  it is behind once more.
- **A run that ends "main moved during this run" is not a failure**: the run queued behind it
  releases both merges. Any other failed run leaves its merges untagged until a later run succeeds,
  so re-run it once the cause is fixed. A release GitHub App token that fails to mint means the
  `RELEASE_APP_CLIENT_ID` variable, the `RELEASE_APP_PRIVATE_KEY` secret or the App's installation
  on this repository is gone.

## Dependency pull requests

- **A grouped bump can leave a partner range behind.** Dependabot raised `@tailwindcss/webpack` (and
  once `@vitest/coverage-v8`) in `package.json` but not `tailwindcss` (`vitest`), and
  `tests/unit/tailwind-config.test.ts` requires the Tailwind ranges to match. Before merging, diff
  `package.json` and push a one-line alignment commit to the PR branch: the lockfile already resolves
  the new version, so only the range strings change.
- **A conflicting group PR showing "Dependabot is rebasing" may be closed and replaced** by a new PR
  with a different number and more updates. Re-list open PRs rather than waiting on the old number.
- A Dependabot PR writes no fragment and passes `Changelog Version`; `version.yml` gives its merge a
  one-bullet section from its PR title.
