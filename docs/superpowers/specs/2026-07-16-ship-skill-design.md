# Ship skill + enforced changelog — design

**Date:** 2026-07-16
**Status:** Approved (design), pending implementation plan
**Branch:** `agent/ship-skill`

## Goal

Replace the docs-freshness `Stop` hook in `.claude/settings.json` with an explicit
`ship` skill, ported from the guardiantracker repo and adapted to this repo. Achieve
full guardiantracker parity: a real `CHANGELOG.md`, a CI guard that verifies the
changelog names the version each merge will mint, and a single shared version script
used by both the release workflow and the guard.

## Background / current state

- **Static-export Next.js site**, no backend. Deployed to Cloudflare Pages.
- **Versioning:** `.github/workflows/version.yml` tags every merge to `main` as
  `v<major>.<minor>.<build>`. It reads the `x.y.z` floor from `package.json`
  (`version` is `1.1.0`), finds the highest existing `v<major>.<minor>.*` tag, and
  increments `build`. It computes this **inline** today.
- **Tag history is mixed:** legacy 4-part tags `v1.0.0.1`–`v1.0.0.6` plus the current
  3-part line `v1.1.0`–`v1.1.5`. The inline logic filters tag suffixes with
  `grep -E '^(0|[1-9][0-9]*)$'`, so the 4-part legacy suffixes (`0.1`, `0.2`, …) are
  excluded and only the `v1.1.x` builds count. **Next mint today = `v1.1.6`.** Any
  replacement script MUST reproduce this filtering exactly or it will compute a wrong
  or colliding tag.
- **CI (`ci.yml`):** four jobs — `Format Check` (`npm run format:check`, which is
  `prettier --check .` at repo root), `Coverage` (`npm run coverage`, 80% gate),
  `Build & Lint` (`npm run lint` + `npm run build`), `Playwright Tests` (Chromium).
  No changelog guard exists.
- **Branch protection:** `main` requires PRs + 5 status checks via the "No Push to
  Main" ruleset. Direct pushes to `main` are forbidden.
- **Docs automation today:** a read-only `Stop` hook (agent type) runs after every
  turn, runs `git status --porcelain`, spot-checks whether CLAUDE.md/README.md drifted
  from changed source, and blocks the stop with specifics when they have. The
  `docs-updater` subagent (`.claude/agents/docs-updater.md`) owns CLAUDE.md + README.md
  and does the actual edits.
- **No `CHANGELOG.md`, no `scripts/` directory** exist yet.

## Approved decisions

1. **Introduce `CHANGELOG.md`** (Keep a Changelog format), managed by the ship skill.
2. **Add a CI guard** ("Changelog Version") that enforces the changelog names the
   predicted version; dependabot-exempt.
3. **Seed the initial changelog by backfilling recent tags** (the `v1.1.x` line) plus
   an `[Unreleased]` header and an entry for the version this first ship mints.
4. **Report the predicted version** in the skill's final output.
5. **Lightweight local checks:** `format:check`, `lint`, `tsc --noEmit`. Build,
   coverage, and Playwright stay in CI.
6. **Share one version script:** refactor `version.yml` to call `scripts/next-version.sh`;
   the guard calls the same script. (Single source of truth — the guardiantracker
   principle.)

## Components

### 1. `scripts/next-version.sh`

- Prints a **bare** SemVer (e.g. `1.1.6`) to stdout — no `v` prefix, no extra output on
  the success path.
- Logic, reproducing `version.yml` exactly:
  1. Read `version` from `package.json`. **Avoid a `jq` dependency** (jq may be absent
     on the user's Windows/local Bash) — extract with `grep`/`sed`. Validate it is
     plain `x.y.z`.
  2. `IFS=. read -r major minor requested_build`.
  3. `last_build` = highest suffix of `git tag --list "v${major}.${minor}.*"` after
     stripping the `v${major}.${minor}.` prefix and keeping only single-integer
     suffixes (`grep -E '^(0|[1-9][0-9]*)$'`), `sort -n | tail -1`. **This filter is
     load-bearing** — it is what excludes the legacy 4-part tags.
  4. If no matching build: `build=requested_build`. Else `build=last_build+1`, but not
     below `requested_build`.
  5. Print `${major}.${minor}.${build}`.
- Must run under CI bash (ubuntu) and locally via the Bash tool (git-bash). POSIX-ish,
  no bashisms that git-bash lacks.
- **Acceptance:** running it now prints `1.1.6`, matching what `version.yml` computes
  today.

### 2. `.github/workflows/version.yml` (refactor)

- Replace the inline "Compute next SemVer build tag" step body with a call to
  `scripts/next-version.sh`, then derive `tag=v<version>`, `build`, `requested_version`
  for the existing outputs. Keep the "tag already exists" guard.
- The tag-and-release step is unchanged.
- **Acceptance:** for the current repo state the workflow still computes `v1.1.6`;
  behavior is byte-identical to today for the clean 3-part case. Legacy 4-part tags
  remain ignored.

### 3. "Changelog Version" guard (new job in `ci.yml`)

- Runs on `pull_request` to `main`.
- Steps: checkout with tags (`fetch-depth: 0`), compute the target version via
  `scripts/next-version.sh`, then assert `CHANGELOG.md` contains a `## [<version>]`
  section. Fail with an actionable message naming the expected version if absent.
- **Dependabot-exempt:** skip (pass) when the PR actor is `dependabot[bot]` — bots do
  not write changelog entries; the ship skill backfills those later.
- Job name is `Changelog Version` so it can be added to the ruleset as a required check.
- **Ruleset note (out of band):** for the guard to _block_ merges it must be added to
  the "No Push to Main" ruleset's required checks (currently 5). The workflow is added
  here; making it required is a separate ruleset edit — offered as a final step (via
  `gh api` or the GitHub UI), not assumed.

### 4. `CHANGELOG.md` (created on this branch)

- Keep a Changelog structure:
  - `## [Unreleased]` with a `No unreleased changes.` placeholder.
  - `## [1.1.6] - 2026-07-16` — the entry for what this branch will mint, describing
    the ship skill + changelog + guard work (this branch dogfoods the guard).
  - Backfilled dated sections for the recent released `v1.1.x` tags (`v1.1.5` down to
    `v1.1.0`), derived from `git show --stat` / release notes. Factual, concise. Legacy
    `v1.0.0.x` tags are not backfilled (pre-changelog history stays in git tags).
- Dates are `YYYY-MM-DD`. One heading of each Keep-a-Changelog kind (Added/Changed/
  Fixed/Removed/Security) per section.

### 5. `.claude/skills/ship/SKILL.md`

Ported from guardiantracker, adapted. Announce at start:
"I'm using the ship skill to open a PR for this branch." Steps:

1. **Preconditions — stop if any fail:** not on `main` (offer `git checkout -b`);
   clean working tree (`git status --porcelain`; if dirty, ask — never commit
   silently); `gh auth status` succeeds.
2. **Backfill undocumented released versions:** compare `git tag -l "v*"` (3-part
   `v1.1.x` line) against `## [x.y.z]` sections in `CHANGELOG.md`; add dated sections
   for any released tag missing one (in practice merged dependabot PRs, which the guard
   exempts). This is what keeps the bot exemption safe.
3. **Compute target version:** `bash scripts/next-version.sh` (never hand-compute).
4. **Refresh docs:** invoke the `docs-updater` subagent scoped to this branch's diff
   (`git diff $(git merge-base main HEAD)..HEAD --stat`); tell it what changed and to
   **leave `CHANGELOG.md` alone** (the skill owns that file in step 5).
5. **Write the CHANGELOG entry:** insert/rewrite a `## [<version>] - <today>` section
   immediately below `## [Unreleased]` (keep the `No unreleased changes.` placeholder).
   Idempotent — rewrite in place on re-ship; renumber if the target version changed
   because someone merged first.
6. **Fast checks — refuse to push if any fail:** `npm run format:check`,
   `npm run lint`, `npx tsc --noEmit`. (Root `prettier --check .` already covers
   `CHANGELOG.md` + docs, so no separate markdown run is needed.) Fix formatting with
   `npm run format`. Build/coverage/Playwright stay in CI.
7. **Commit** docs + changelog: `git add -A && git commit -m "docs: update docs and
changelog for v<version>"`.
8. **Push and open/update PR:** `git push -u origin <branch>`; if a PR exists for the
   branch, `gh pr edit` the body; else `gh pr create --base main` with a title/body
   derived from the changelog entry.
9. **Report:** PR URL, the version this merge will mint, anything backfill/checks
   surfaced. State plainly that build/coverage/e2e run in CI, not locally.

**Do not:** merge the PR (this repo does not self-merge; ship stops at "PR open"), push
to `main`, run full test suites, or invent the version number.

Windows note: the skill invokes `next-version.sh` and git/gh via the **Bash** tool
(git-bash), not PowerShell.

### 6. `.claude/settings.json`

- **Remove the `Stop` hook** entirely.
- Keep `permissions`. Optionally add allow-entries so ship runs with fewer prompts:
  `Bash(gh auth status)`, `Bash(git fetch:*)`, `Bash(bash scripts/next-version.sh)`.
  (Sensitive ops like `git push`/`git commit`/`gh pr create` are left to prompt.)
- `docs-updater` agent is unchanged and is now invoked explicitly by the skill.

### 7. Docs (CLAUDE.md / README.md)

Updated on this branch via `docs-updater`:

- "Agents & docs automation" section: Stop hook → the ship skill (docs are refreshed at
  ship time, not after every turn).
- "CI/CD" section: add the `Changelog Version` job and note `CHANGELOG.md`.
- Commands/architecture as needed (e.g. mention `scripts/next-version.sh`).

## Data flow

```
develop on branch ── /ship ──> next-version.sh ──> target version (1.1.x)
                                     │
   docs-updater (branch diff) ───────┤
   write CHANGELOG [target] ─────────┤
   fast checks (fmt/lint/tsc) ───────┤
                                     ▼
                          commit ──> push ──> PR open
                                                 │
                                    CI: 4 jobs + Changelog Version guard
                                                 │  (guard reruns next-version.sh,
                                                 │   greps CHANGELOG for [target])
                                                 ▼
                                   merge ──> version.yml ──> next-version.sh
                                                 ──> tag v<target> + release
```

The guard and the release use the **same** `next-version.sh`, so the version the guard
checks for is exactly the tag that gets minted.

## Risks / edge cases

- **Version script must match legacy filtering.** Verified acceptance: prints `1.1.6`
  now. A regression here mis-tags releases — highest priority to get right and to test.
- **Race between PRs.** If another PR merges first, the predicted build increments and
  an open PR's changelog entry goes stale; the guard catches it and re-running `/ship`
  renumbers. Documented in the skill (step 5, idempotent/renumber).
- **Guard not required until ruleset updated.** Until added to "No Push to Main", the
  guard runs but does not block. Called out as an explicit final step, not silent.
- **Dependabot PRs** intentionally skip the guard; the skill's backfill (step 2) is what
  keeps the changelog complete afterward. Skipping backfill would let the changelog lose
  versions — the skill treats it as mandatory.
- **`main` is protected.** All of this lands via a PR from `agent/ship-skill`; nothing
  is pushed to `main` directly.

## Out of scope

- Auto-merge / self-merge (this repo merges manually).
- Backfilling the legacy 4-part `v1.0.0.x` tags into the changelog.
- Running build/coverage/Playwright locally in the skill.
