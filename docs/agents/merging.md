# Merging

From an open pull request to a finished merge. What CI runs and what the ruleset requires are in
`AGENTS.md` ("CI/CD"); this file holds the steps around it and what has gone wrong.

## When to merge

`ship` stops when the PR opens. The owner hands the merge over explicitly ("merge the PR", "merge
when all checks are green", "merge and complete all follow ups"), and that authorization covers the
PRs named in that turn only: never infer it from an earlier PR in the session. Merge only once every
required check on the current head reports green, never on a pending or failing one.

## Merging

`gh pr merge <n> --merge --delete-branch`. Merge commits are the only method the repository offers.

- **Auto-delete on merge is off** (`delete_branch_on_merge: false`), so a merged branch stays on
  `origin` unless `--delete-branch` or a later delete removes it.
- **Deleting a merged branch with `git push origin --delete <branch>` prints
  `remote: - Cannot delete this branch`** (from the "Block delete branches" ruleset) **and still
  succeeds.** Confirm with `git ls-remote --heads origin` rather than trusting the message.
- **To tell whether a branch is spent, ask GitHub:** `gh pr list --head <branch> --state merged`.
  Branches merged before 2026-09-18 were squashed and aren't ancestors of `main`, so
  `git branch --merged` doesn't list them. Cut new work from a fresh `origin/main` branch rather than
  reusing a merged one, and never force-push.

## Dependency pull requests

- **A grouped bump can leave a partner range behind.** Dependabot raised `@tailwindcss/webpack` (and
  once `@vitest/coverage-v8`) in `package.json` but not `tailwindcss` (`vitest`), and
  `tests/unit/tailwind-config.test.ts` requires the Tailwind ranges to match. Before merging, diff
  `package.json` and push a one-line alignment commit to the PR branch: the lockfile already resolves
  the new version, so only the range strings change.
- **A conflicting group PR showing "Dependabot is rebasing" may be closed and replaced** by a new PR
  with a different number and more updates. Re-list open PRs rather than waiting on the old number.
- Dependabot PRs are exempt from `Changelog Version`; the next human PR backfills their sections.
