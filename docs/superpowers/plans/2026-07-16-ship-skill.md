# Ship Skill + Enforced Changelog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the docs-freshness `Stop` hook with an explicit `ship` skill, backed by a real `CHANGELOG.md`, a CI guard that enforces it, and a single shared version script.

**Architecture:** A portable `scripts/next-version.sh` becomes the single source of truth for the next SemVer build. `version.yml` (release) and a new `Changelog Version` job in `ci.yml` (PR guard) both call it, so the version the guard checks for is exactly the tag that gets minted. The `ship` skill orchestrates docs refresh + changelog write + fast checks + PR open, replacing the automatic Stop hook.

**Tech Stack:** Bash (git-bash locally / ubuntu bash in CI), GitHub Actions, Next.js 16 tooling (`prettier`, `eslint`, `tsc`), `gh` CLI, Claude Code skills/agents.

## Global Constraints

- `scripts/next-version.sh` prints a **bare** SemVer to stdout (no `v` prefix). **Acceptance: it prints `1.1.6` against the current repo state**, matching what `version.yml` computes today.
- Legacy 4-part tags (`v1.0.0.1`–`v1.0.0.6`) MUST stay excluded — their stripped suffix (`0.1`) fails the single-integer build filter `grep -E '^(0|[1-9][0-9]*)$'`. This filter is load-bearing.
- Every invocation of the script is `bash scripts/next-version.sh` (never `./scripts/...`) to avoid Windows exec-bit issues.
- All git / gh / script commands run via the **Bash** tool (git-bash), never PowerShell.
- `main` is protected: **never push to `main`.** All work lands via a PR from branch `agent/ship-skill`.
- The guard job name is exactly `Changelog Version`; it runs on `pull_request` only and is **dependabot-exempt**.
- Ship's fast checks are exactly: `npm run format:check`, `npm run lint`, `npx tsc --noEmit`. Build / coverage / Playwright stay in CI.
- Changelog uses Keep a Changelog format; dates are `YYYY-MM-DD` (today = `2026-07-16`); one heading of each kind (Added/Changed/Fixed/Removed/Security) per version section.
- Work is already on branch `agent/ship-skill` (created during brainstorming). Commit after each task.

## File Structure

- Create: `.gitattributes` — pin `*.sh` to LF (autocrlf=true would otherwise break git-bash).
- Create: `scripts/next-version.sh` — computes next SemVer build (source of truth).
- Modify: `.github/workflows/version.yml` — call the script instead of inline compute.
- Create: `CHANGELOG.md` — Keep a Changelog file, seeded with `v1.1.x` history + `[1.1.6]` entry.
- Modify: `.github/workflows/ci.yml` — add the `Changelog Version` guard job.
- Modify: `.claude/settings.json` — remove the `Stop` hook; add a few allow-entries.
- Create: `.claude/skills/ship/SKILL.md` — the ship skill.
- Modify: `CLAUDE.md` — "Agents & docs automation" + "CI/CD" sections.

---

### Task 1: `scripts/next-version.sh` (single source of truth)

**Files:**

- Create: `scripts/next-version.sh`
- Create: `.gitattributes`

**Interfaces:**

- Produces: an executable-via-`bash` script that prints `<major>.<minor>.<build>\n` to stdout. Consumed by Task 2 (version.yml), Task 4 (guard), and Task 6 (skill).

**Line endings:** this repo has `core.autocrlf=true`, so without a rule, `.sh` files check out as CRLF on Windows and break when run via git-bash (the ship skill runs `bash scripts/next-version.sh` locally). A `.gitattributes` pinning `*.sh` to LF is required (Step 0).

- [ ] **Step 0: Create `.gitattributes` (pin shell scripts to LF)**

Create `.gitattributes` at the repo root with exactly:

```gitattributes
# Shell scripts must stay LF so they run under git-bash on Windows
# (this repo has core.autocrlf=true).
*.sh text eol=lf
```

- [ ] **Step 1: Write the failing test (run the not-yet-existing script)**

Run: `bash scripts/next-version.sh`
Expected: FAIL — `bash: scripts/next-version.sh: No such file or directory`.

- [ ] **Step 2: Create the script**

Create `scripts/next-version.sh` with exactly:

```bash
#!/usr/bin/env bash
# Prints the next SemVer build version (e.g. 1.1.6) this repo will tag on the next
# merge to main. Single source of truth shared by:
#   - .github/workflows/version.yml   (tag/release workflow)
#   - .github/workflows/ci.yml        ("Changelog Version" PR guard)
#   - .claude/skills/ship/SKILL.md    (the ship skill)
#
# floor = package.json "version" (x.y.z: the major/minor line and the build floor)
# build = highest existing v<major>.<minor>.<int> tag + 1, never below the floor's
#         build; if no matching tag exists, build = the floor's build.
# Legacy 4-part tags (v1.0.0.1 …) are ignored: their stripped suffix ("0.1") fails
# the single-integer filter below.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
pkg="${root}/package.json"

version="$(grep -m1 '"version"' "$pkg" \
  | sed -E 's/.*"version"[[:space:]]*:[[:space:]]*"([^"]+)".*/\1/')"

if ! printf '%s' "$version" | grep -Eq '^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$'; then
  echo "next-version: package.json version '$version' must be plain SemVer x.y.z" >&2
  exit 1
fi

IFS=. read -r major minor requested_build <<< "$version"

last_build="$(
  git tag --list "v${major}.${minor}.*" \
    | sed -E "s/^v${major}\.${minor}\.//" \
    | grep -E '^(0|[1-9][0-9]*)$' \
    | sort -n \
    | tail -1 || true
)"

if [ -z "$last_build" ]; then
  build="$requested_build"
else
  build=$(( last_build + 1 ))
  if [ "$build" -lt "$requested_build" ]; then
    build="$requested_build"
  fi
fi

printf '%s.%s.%s\n' "$major" "$minor" "$build"
```

Note: the `|| true` guards the pipeline so a no-matching-tag case (grep exits 1 under `pipefail`) yields an empty `last_build` instead of aborting — this is what makes the "new major/minor line" path work.

- [ ] **Step 3: Run it and verify the acceptance output**

Run: `bash scripts/next-version.sh`
Expected: PASS — prints exactly `1.1.6`.

- [ ] **Step 4: Verify legacy 4-part tags are ignored**

Run: `git tag --list "v1.1.*" | sed -E 's/^v1\.1\.//' | grep -E '^(0|[1-9][0-9]*)$' | sort -n | tail -1`
Expected: `5` (only the 3-part `v1.1.x` builds; `v1.0.0.x` never matches `v1.1.*`, and any non-integer suffix is filtered). Confirms next build = 6.

- [ ] **Step 5: Commit**

```bash
git add scripts/next-version.sh .gitattributes
git commit -m "feat: add next-version.sh, single source of truth for the build number"
```

---

### Task 2: Refactor `version.yml` to call the script

**Files:**

- Modify: `.github/workflows/version.yml` (the "Compute next SemVer build tag" step, currently lines ~42–81)

**Interfaces:**

- Consumes: `bash scripts/next-version.sh` from Task 1.
- Produces: unchanged step outputs `version`, `tag`, `build`, `requested_version`.

- [ ] **Step 1: Replace the compute step body**

In `.github/workflows/version.yml`, replace the entire `- name: Compute next SemVer build tag` step (the `id: version` step and its inline `run:` block) with:

```yaml
- name: Compute next SemVer build tag
  id: version
  run: |
    version=$(bash scripts/next-version.sh)
    tag="v${version}"

    if git rev-parse -q --verify "refs/tags/${tag}" >/dev/null; then
      echo "::error::Computed tag '${tag}' already exists."
      exit 1
    fi

    IFS=. read -r major minor build <<< "$version"
    requested_version=$(grep -m1 '"version"' package.json \
      | sed -E 's/.*"version"[[:space:]]*:[[:space:]]*"([^"]+)".*/\1/')

    {
      echo "version=${version}"
      echo "tag=${tag}"
      echo "build=${build}"
      echo "requested_version=${requested_version}"
    } >> "$GITHUB_OUTPUT"
```

Leave the `name: Version`, triggers, permissions, concurrency, checkout (with `fetch-depth: 0`), and the "Push tag and create release" step **unchanged**.

- [ ] **Step 2: Validate the workflow YAML parses**

Run: `node -e "const y=require('fs').readFileSync('.github/workflows/version.yml','utf8'); if(!y.includes('bash scripts/next-version.sh')) throw new Error('script call missing'); console.log('ok')"`
Expected: `ok`

- [ ] **Step 3: Simulate the compute step locally (behavior unchanged)**

Run:

```bash
version=$(bash scripts/next-version.sh); echo "tag=v${version}"; git rev-parse -q --verify "refs/tags/v${version}" >/dev/null && echo "EXISTS" || echo "free"
```

Expected: `tag=v1.1.6` then `free` (the tag does not yet exist, so the workflow would proceed to mint it).

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/version.yml
git commit -m "refactor: compute release build via next-version.sh"
```

---

### Task 3: Create and seed `CHANGELOG.md`

**Files:**

- Create: `CHANGELOG.md`

**Interfaces:**

- Produces: a `CHANGELOG.md` containing `## [Unreleased]` and `## [1.1.6]` (Task 4's guard greps for the `[1.1.6]` section).

- [ ] **Step 1: Gather backfill data for the `v1.1.x` line**

Run:

```bash
for t in v1.1.0 v1.1.1 v1.1.2 v1.1.3 v1.1.4 v1.1.5; do
  echo "=== $t ($(git log -1 --format=%ad --date=short "$t")) ==="
  git show --stat --format='%s' "$t" | head -20
done
```

Use the output to write factual one-line summaries per release in Step 2 (name packages/versions for dependabot bumps; describe the change otherwise).

- [ ] **Step 2: Write `CHANGELOG.md`**

Create `CHANGELOG.md`. The header, `[Unreleased]`, and `[1.1.6]` sections are fixed text (below). The `[1.1.5]`…`[1.1.0]` sections use the dates and factual summaries gathered in Step 1 — one appropriate Keep-a-Changelog heading per section (most are `### Changed` dependency bumps).

```markdown
# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

No unreleased changes.

## [1.1.6] - 2026-07-16

### Added

- `ship` skill (`.claude/skills/ship/SKILL.md`) that refreshes docs, computes the version the merge will mint, writes the CHANGELOG entry, runs fast checks, and opens or updates the PR.
- `scripts/next-version.sh` — single source of truth for the next SemVer build, shared by the version workflow, the changelog CI guard, and the ship skill.
- `Changelog Version` CI job that fails a PR whose `CHANGELOG.md` does not name the version the merge will mint (dependabot PRs exempt).
- This `CHANGELOG.md`, seeded with the `v1.1.x` release history.
- `.gitattributes` pinning shell scripts to LF so `scripts/next-version.sh` runs under git-bash on Windows.

### Changed

- `.github/workflows/version.yml` now computes the build number via `scripts/next-version.sh` instead of an inline script.

### Removed

- The docs-freshness `Stop` hook in `.claude/settings.json`; docs are now refreshed at ship time by the ship skill instead of after every response turn.

## [1.1.5] - <date>

### Changed

- <factual summary from git for v1.1.5>

## [1.1.4] - <date>

### Changed

- <factual summary from git for v1.1.4>

## [1.1.3] - <date>

### Changed

- <factual summary from git for v1.1.3>

## [1.1.2] - <date>

### Changed

- <factual summary from git for v1.1.2>

## [1.1.1] - <date>

### Changed

- <factual summary from git for v1.1.1>

## [1.1.0] - <date>

### Added

- <factual summary from git for v1.1.0>
```

Replace every `<date>` and `<factual summary …>` with real values from Step 1. No angle-bracket placeholders may remain.

- [ ] **Step 3: Verify the guard's target section exists**

Run: `grep -E '^## \[1\.1\.6\]' CHANGELOG.md && echo FOUND`
Expected: the matching line, then `FOUND`.

- [ ] **Step 4: Verify no placeholders remain**

Run: `grep -nE '<date>|<factual|TODO|TBD' CHANGELOG.md && echo "PLACEHOLDERS LEFT" || echo "clean"`
Expected: `clean`

- [ ] **Step 5: Format and verify prettier is satisfied**

Run: `npm run format` then `npx prettier --check CHANGELOG.md`
Expected: `All matched files use Prettier code style!` (or the single-file equivalent).

- [ ] **Step 6: Commit**

```bash
git add CHANGELOG.md
git commit -m "docs: add CHANGELOG.md seeded with v1.1.x history"
```

---

### Task 4: Add the `Changelog Version` guard job to `ci.yml`

**Files:**

- Modify: `.github/workflows/ci.yml` (append a new job under `jobs:`)

**Interfaces:**

- Consumes: `bash scripts/next-version.sh` (Task 1) and `CHANGELOG.md` (Task 3).

- [ ] **Step 1: Add the job**

Append this job to the `jobs:` map in `.github/workflows/ci.yml` (same indentation level as `format:`, `coverage:`, `build:`, `test:`):

```yaml
changelog:
  name: Changelog Version
  runs-on: ubuntu-latest
  # PRs only: on push to main the "next" version has no entry yet, which would
  # false-fail. Branch protection gates the PR, so a PR-only check is sufficient.
  if: github.event_name == 'pull_request'

  steps:
    - name: Checkout repository
      uses: actions/checkout@v7
      with:
        fetch-depth: 0 # full history + tags, needed by next-version.sh

    - name: Verify CHANGELOG names the target version
      env:
        PR_ACTOR: ${{ github.actor }}
      run: |
        # Dependabot does not write changelog entries; the ship skill backfills
        # them on the next human ship. Exempt bot PRs so they are not blocked.
        if [ "$PR_ACTOR" = "dependabot[bot]" ]; then
          echo "Dependabot PR — changelog guard exempt."
          exit 0
        fi

        version=$(bash scripts/next-version.sh)
        version_re=$(printf '%s' "$version" | sed 's/\./\\./g')

        if ! grep -Eq "^## \[${version_re}\]" CHANGELOG.md; then
          echo "::error::CHANGELOG.md has no '## [${version}]' section for the version this merge will mint. Run /ship to write it."
          exit 1
        fi
        echo "CHANGELOG.md has an entry for ${version}."
```

- [ ] **Step 2: Validate the YAML and the job name**

Run: `node -e "const y=require('fs').readFileSync('.github/workflows/ci.yml','utf8'); if(!y.includes('name: Changelog Version')) throw new Error('job missing'); if(!y.includes(\"github.actor }} \") && !y.includes('dependabot[bot]')) throw new Error('exemption missing'); console.log('ok')"`
Expected: `ok`

- [ ] **Step 3: Reproduce the guard locally — passing path**

Run:

```bash
version=$(bash scripts/next-version.sh); version_re=$(printf '%s' "$version" | sed 's/\./\\./g'); grep -Eq "^## \[${version_re}\]" CHANGELOG.md && echo "GUARD PASS" || echo "GUARD FAIL"
```

Expected: `GUARD PASS` (the `[1.1.6]` section from Task 3 exists).

- [ ] **Step 4: Reproduce the guard locally — failing path (sanity)**

Run: `grep -Eq "^## \[9\.9\.9\]" CHANGELOG.md && echo "GUARD PASS" || echo "GUARD FAIL (expected)"`
Expected: `GUARD FAIL (expected)` — confirms the guard would fail when the section is absent.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add Changelog Version guard (PR-only, dependabot-exempt)"
```

---

### Task 5: Remove the `Stop` hook from `.claude/settings.json`

**Files:**

- Modify: `.claude/settings.json`

- [ ] **Step 1: Replace the file contents**

Overwrite `.claude/settings.json` with (the `hooks` block is removed; three allow-entries are added so ship runs with fewer prompts):

```json
{
  "permissions": {
    "allow": [
      "Bash(npm run:*)",
      "Bash(npm test:*)",
      "Bash(npm install:*)",
      "Bash(npx playwright test:*)",
      "Bash(npx tsc --noEmit)",
      "Bash(git status:*)",
      "Bash(git diff:*)",
      "Bash(git log:*)",
      "Bash(git tag -l:*)",
      "Bash(git merge-base:*)",
      "Bash(git branch --show-current)",
      "Bash(git fetch --tags -q origin)",
      "Bash(gh auth status)",
      "Bash(gh pr list:*)",
      "Bash(gh pr view:*)",
      "Bash(bash scripts/next-version.sh)"
    ]
  }
}
```

Each rule is the narrowest form that still covers what ship runs, because a glob one level
too wide silently grants the thing the skill forbids: `Bash(gh pr:*)` would allow
`gh pr merge`, `Bash(git tag:*)` would allow `git tag -d`/`-f`, and
`Bash(git branch:*)` would allow `git branch -D`. Hence `gh pr list`/`gh pr view`,
`git tag -l`, and an exact `git branch --show-current`.

The fetch entry is an **exact match**, not `Bash(git fetch:*)`. A `git fetch:*` glob would
also match `git fetch --upload-pack='<any shell command>' .`, which git executes through a
shell on the local transport — i.e. unprompted arbitrary code execution from a rule that
reads as a harmless network fetch. (Verified against git 2.55.0: the payload runs and the
fetch still succeeds.) The same glob would also permit `git fetch . +refs/heads/x:refs/heads/y`
to clobber local refs and `git fetch <arbitrary-url>` to reach any host. The skill only ever
runs one fetch — `git fetch --tags -q origin` — so exact-match costs nothing and closes the
whole class.

- [ ] **Step 2: Verify valid JSON and the hook is gone**

Run: `node -e "const s=JSON.parse(require('fs').readFileSync('.claude/settings.json','utf8')); if(s.hooks) throw new Error('hooks still present'); console.log('ok, no hooks')"`
Expected: `ok, no hooks`

- [ ] **Step 3: Commit**

```bash
git add .claude/settings.json
git commit -m "chore: remove docs-freshness Stop hook (superseded by ship skill)"
```

---

### Task 6: Create the `ship` skill

**Files:**

- Create: `.claude/skills/ship/SKILL.md`

- [ ] **Step 1: Write the skill**

Create `.claude/skills/ship/SKILL.md` with exactly:

````markdown
---
name: ship
description: Ship the current branch — refresh docs, write the CHANGELOG entry for the version this merge will mint, run fast checks, push, and open or update the PR. Use when a feature branch is ready for review, or when the user says "ship it", "open a PR", or "push this".
---

# Ship

Take the current branch from "code is done" to "PR is open and green-able", and make
sure the changelog names the version this merge will actually create.

**Announce at start:** "I'm using the ship skill to open a PR for this branch."

## Why this exists

Every merge to `main` is auto-tagged `v<major>.<minor>.<build>` by
`.github/workflows/version.yml`, where `build` auto-increments. So a branch's changelog
entry must be written for **the version its merge will mint** — an `[Unreleased]`
section is always wrong the moment it lands. Ship computes that version and writes the
entry, and the `Changelog Version` CI job verifies the prediction still holds at merge
time.

All git / gh / script commands in this skill run via the **Bash** tool (git-bash on
this Windows machine), not PowerShell.

## Steps

### 1. Preconditions — stop if any fail

- **Not on `main`.** `main` is protected; work must be on a branch. If on `main`, stop
  and offer to create one (`git checkout -b agent/<topic>`).
- **Clean working tree.** Run `git status --porcelain`. If anything is uncommitted,
  stop and ask the user whether to commit it — do not commit silently.
- **`gh` authenticated.** `gh auth status` must succeed.

### 2. Backfill any undocumented released versions

Compare git tags against `CHANGELOG.md`:

```bash
git fetch --tags -q origin
git tag -l "v*" --sort=v:refname | tail -8
sed -nE 's/^## \[([0-9]+\.[0-9]+\.[0-9]+)\].*/\1/p' CHANGELOG.md | head -8
```

Any 3-part `v<x>.<y>.<z>` tag with **no** matching `## [x.y.z]` section is a released
version with no entry — in practice a merged dependabot PR, which the CI guard exempts.
Backfill it now: read what that tag changed (`git show --stat <tag>`, and the
`package.json` diff for dependency bumps) and add a dated section for it in the right
position. Keep it factual — name the packages and versions. (Legacy 4-part `v1.0.0.x`
tags predate the changelog and are not backfilled.)

This is what makes the bot exemption safe. Skipping it lets the changelog silently lose
versions.

### 3. Compute the target version

```bash
bash scripts/next-version.sh
```

This prints a bare SemVer (e.g. `1.1.6`) — no `v` prefix. It is the single source of
truth; the tag workflow and the CI guard call the same script. Do not compute this
yourself.

### 4. Refresh the docs

Invoke the `docs-updater` subagent, scoped to **this branch's diff only** — not a full
audit:

```bash
git diff $(git merge-base main HEAD)..HEAD --stat
```

Tell it exactly what changed and let it update the docs it owns (CLAUDE.md and
README.md). **You** write the changelog section in step 5 — tell it to leave
`CHANGELOG.md` alone so you don't fight over the file.

### 5. Write the CHANGELOG entry

Insert a section for the target version immediately below `## [Unreleased]`:

```markdown
## [Unreleased]

No unreleased changes.

## [1.1.6] - 2026-07-16

### Added

- ...
```

Rules:

- `## [Unreleased]` **stays**, with the `No unreleased changes.` placeholder.
- Date is today, `YYYY-MM-DD`.
- Group under Keep a Changelog headings — `Added`, `Changed`, `Fixed`, `Removed`,
  `Security`. Use **one** heading of each kind per section.
- Describe user-visible behavior and its consequences, derived from the branch diff. Not
  a commit log.
- **Idempotent:** if you already wrote a section for this version on a previous ship of
  this branch, **rewrite it in place** — never stack a second one. If the target version
  changed since last time (someone merged first), renumber the existing section rather
  than adding a new one.

### 6. Fast checks — refuse to push if any fail

Tests, coverage, the production build, and Playwright are **not** run here; CI owns
them. These are the cheap gates that catch most mistakes in seconds:

```bash
npm run format:check
npm run lint
npx tsc --noEmit
```

`npm run format:check` is `prettier --check .` at the repo root, so it already covers
`CHANGELOG.md`, the docs, and the source — there is no separate markdown run. Fix
formatting with `npm run format`. If any check is red, stop and report — do not push.

### 7. Commit the docs and changelog

Only if `git status --porcelain` is non-empty:

```bash
git add -A
git commit -m "docs: update docs and changelog for v<version>"
```

### 8. Push and open or update the PR

```bash
git push -u origin "$(git branch --show-current)"
```

Then check whether a PR already exists for this branch:

```bash
gh pr list --head "$(git branch --show-current)" --state open --json number -q '.[0].number'
```

- **No PR** → `gh pr create --base main` with a title and a body derived from the
  changelog section you just wrote.
- **PR exists** → `gh pr edit <number>` to refresh the body. Do not open a second PR.

### 9. Report

Give the user: the PR URL, the version this merge will mint, and anything the fast
checks or backfill surfaced. State plainly that the build, coverage (80% gate), and
Playwright suites run in CI, not locally — do not imply the branch is verified beyond
the fast checks.

## Do not

- Merge the PR. This repo does not self-merge; ship stops at "PR open".
- Push to `main`.
- Run the build, coverage, or Playwright suites — that is CI's job and it makes this
  skill slow.
- Invent the version number. Always call `bash scripts/next-version.sh`.
````

- [ ] **Step 2: Verify the skill has the load-bearing pieces**

Run:

```bash
for s in "name: ship" "I'm using the ship skill" "bash scripts/next-version.sh" "npm run format:check" "npx tsc --noEmit" "leave" "Do not"; do grep -qF "$s" .claude/skills/ship/SKILL.md && echo "ok: $s" || echo "MISSING: $s"; done
```

Expected: every line prefixed `ok:` (no `MISSING:`).

- [ ] **Step 3: Verify prettier accepts the skill file**

Run: `npx prettier --check .claude/skills/ship/SKILL.md`
Expected: Prettier is satisfied (fix with `npx prettier --write` if not, then re-check).

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/ship/SKILL.md
git commit -m "feat: add ship skill for opening PRs with docs + changelog"
```

---

### Task 7: Update `CLAUDE.md`

**Files:**

- Modify: `CLAUDE.md` ("CI/CD" section and "Agents & docs automation" section)

- [ ] **Step 1: Update the `ci.yml` bullet in the CI/CD section**

Replace the bullet that begins "**Validation — [.github/workflows/ci.yml]**" (currently says "**four** jobs") with:

```markdown
- **Validation — [.github/workflows/ci.yml](.github/workflows/ci.yml)** — runs on push/PR to `main` with **five** jobs: `Format Check` (`npm run format:check`), `Coverage` (`npm run coverage` — **fails below the 80% thresholds** and uploads a `coverage-report` artifact), `Build & Lint` (`npm run lint` + `npm run build`, uploads the `static-site` artifact), `Playwright Tests` (needs Build & Lint; installs Chromium and runs `npm run test:e2e -- --project=chromium`), and `Changelog Version` (PRs only; computes the next version via [scripts/next-version.sh](scripts/next-version.sh) and fails if [CHANGELOG.md](CHANGELOG.md) has no `## [x.y.z]` section for it — dependabot PRs are exempt). **A PR fails CI if formatting drifts — run `npm run format` before committing.**
```

- [ ] **Step 2: Update the versioning bullet**

Replace the bullet that begins "**Versioning — [.github/workflows/version.yml]**" with:

```markdown
- **Versioning — [.github/workflows/version.yml](.github/workflows/version.yml)** — on every merge (push) to `main`, tags the merge commit and creates a GitHub Release using standard SemVer `v<major>.<minor>.<build>` (e.g. `v1.2.7`). It computes the build number with [scripts/next-version.sh](scripts/next-version.sh) — the same script the `Changelog Version` guard and the `ship` skill use, so the tag minted always matches the version the changelog was written for. The `package.json` `version` is the major/minor/build floor; for an existing major/minor line the build increments from the highest matching tag, and a new `x.y.0` line is tagged `v<x.y>.0` when that tag does not already exist.
```

- [ ] **Step 3: Replace the "Agents & docs automation" section**

Replace the entire body under `## Agents & docs automation` with:

```markdown
The `docs-updater` subagent (`.claude/agents/docs-updater.md`) keeps CLAUDE.md and README.md in
sync with the code. Docs are refreshed when you **ship a branch**: the `ship` skill
(`.claude/skills/ship/SKILL.md`) invokes `docs-updater` (scoped to the branch diff) as part of
opening a PR — alongside computing the version the merge will mint via
[scripts/next-version.sh](scripts/next-version.sh), writing the [CHANGELOG.md](CHANGELOG.md) entry
for it, running the fast checks (`format:check`, `lint`, `tsc --noEmit`), and pushing. Say
"ship it" when a branch is ready for review. The `Changelog Version` CI job then verifies the
changelog names the version the merge will actually mint.
```

- [ ] **Step 4: Verify the edits landed and old text is gone**

Run:

```bash
grep -qF "**five** jobs" CLAUDE.md && grep -qF "Changelog Version" CLAUDE.md && grep -qF "ship it" CLAUDE.md && ! grep -qF "Stop hook in \`.claude/settings.json\`" CLAUDE.md && echo "docs ok" || echo "DOC EDIT INCOMPLETE"
```

Expected: `docs ok`

- [ ] **Step 5: Verify prettier accepts the docs**

Run: `npx prettier --check CLAUDE.md`
Expected: Prettier is satisfied (fix with `npm run format` if not).

- [ ] **Step 6: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: document ship skill and Changelog Version job in CLAUDE.md"
```

---

### Task 8: Branch-wide verification and open the PR (dogfood the skill)

**Files:** none (verification + PR).

- [ ] **Step 1: Run the full fast-check suite over the branch**

Run: `npm run format:check && npm run lint && npx tsc --noEmit`
Expected: all three pass. Fix formatting with `npm run format` and re-run if `format:check` fails.

- [ ] **Step 2: Confirm the guard would be green for this branch**

Run:

```bash
version=$(bash scripts/next-version.sh); version_re=$(printf '%s' "$version" | sed 's/\./\\./g'); grep -Eq "^## \[${version_re}\]" CHANGELOG.md && echo "guard green for $version" || echo "GUARD RED"
```

Expected: `guard green for 1.1.6`.

- [ ] **Step 3: Open the PR by invoking the new `ship` skill**

Invoke `/ship` (or the ship skill) to dogfood it end-to-end. Because the docs and changelog are already written and committed, ship's backfill/changelog/commit steps should be near no-ops (its commit step is guarded on `git status --porcelain`); it will run the fast checks, push `agent/ship-skill`, and open the PR to `main`.

If ship surfaces a problem, fall back to manual:

```bash
git push -u origin agent/ship-skill
gh pr create --base main --title "Add ship skill + enforced changelog" --body "See CHANGELOG.md [1.1.6]. Replaces the docs-freshness Stop hook with the ship skill; adds scripts/next-version.sh, the Changelog Version guard, and CHANGELOG.md."
```

- [ ] **Step 4: Report + out-of-band follow-up**

Report the PR URL and the version the merge will mint (`v1.1.6`). Then tell the user: to make `Changelog Version` actually **block** merges, it must be added to the "No Push to Main" ruleset's required checks (currently 5). Offer to do it via `gh api` or let them add it in GitHub Settings. Until then the guard runs and shows red/green on PRs but does not block.

---

## Self-Review

**1. Spec coverage:**

- next-version.sh (script, no jq, legacy filter, acceptance 1.1.6) → Task 1 ✓
- version.yml refactor to shared script → Task 2 ✓
- Changelog Version guard job in ci.yml, PR-only, dependabot-exempt → Task 4 ✓
- CHANGELOG.md seeded ([Unreleased] + [1.1.6] + v1.1.x backfill) → Task 3 ✓
- ship SKILL.md (all 9 steps, lightweight checks, do-not, Bash-tool note) → Task 6 ✓
- Remove Stop hook + allow-entries → Task 5 ✓
- Docs (CLAUDE.md two sections; README needs none) → Task 7 ✓
- Version report + ruleset caveat → Task 8 ✓
- main protection / land via PR → Global Constraints + Task 8 ✓

**2. Placeholder scan:** The only `<...>` tokens are in Task 3's CHANGELOG backfill (dates/summaries), which Step 1 gathers from git and Step 4 asserts are all replaced (grep returns `clean`). No other placeholders.

**3. Type/name consistency:** `bash scripts/next-version.sh` (bare-SemVer stdout) is used identically in Tasks 2, 4, 6, 8. Job name `Changelog Version` matches between Task 4, Task 7's docs, and Task 8's ruleset note. Section anchor `## [1.1.6]` is written in Task 3 and grepped in Tasks 3, 4, 8.
