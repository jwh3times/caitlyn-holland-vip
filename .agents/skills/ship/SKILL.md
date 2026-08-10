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
`.github/workflows/version.yml`. Existing release lines auto-increment `build`; a higher
floor in `package.json` starts a new major or minor line. Ship classifies the branch's
SemVer impact, adjusts that floor when a new line is warranted, computes **the version
its merge will mint**, and writes the changelog entry for it. An `[Unreleased]` section
is always wrong the moment it lands. The `Changelog Version` CI job re-checks the
prediction **when the PR runs**.

That check is PR-time, not merge-time: it does not re-run when a _different_ PR merges
ahead of yours. If that happens your entry is numbered for a version someone else took,
and the guard may still be showing green from its earlier run. Re-run ship to renumber
(step 6).

All git / gh / script commands in this skill run in a bash/POSIX shell (git-bash on
this Windows machine), not PowerShell.

## Steps

### 1. Preconditions — stop if any fail

- **Not on `main`.** `main` is protected; work must be on a branch. If on `main`, stop
  and offer to create one (`git checkout -b agent/<topic>`).
- **Clean working tree.** Run `git status --porcelain`. If anything is uncommitted, stop
  and ask the user whether to commit it — do not commit silently. Once they answer, act
  on it and restart from this step, so the rest of the skill runs against a clean tree.
- **`gh` authenticated.** `gh auth status` must succeed.

### 2. Backfill any undocumented released versions

List released versions that have no changelog section. Run this exactly — do **not**
eyeball two raw lists, because tags print as `v1.1.5` while changelog sections parse as
`1.1.5`, so an unnormalized comparison reports every tag as missing:

```bash
git fetch --tags -q origin
comm -23 \
  <(git tag -l "v*" | sed -nE 's/^v([0-9]+\.[0-9]+\.[0-9]+)$/\1/p' | sort) \
  <(sed -nE 's/^## \[([0-9]+\.[0-9]+\.[0-9]+)\].*/\1/p' CHANGELOG.md | sort)
```

**Empty output means nothing to backfill — skip to step 3.** The `sed` strips the `v` and
drops the legacy 4-part `v1.0.0.x` tags (they predate the changelog and are never
backfilled).

Anything listed is a released version with no entry — in practice a merged dependabot PR,
which the CI guard exempts. Backfill it now: read what that tag changed and add a dated
section in the right position, newest first. Use the merge's **second parent** (`^2`) — the
branch that was merged — because the tag itself is the merge commit:

```bash
git log -1 --format='%cs' "v<version>"                 # date for the section heading
git log --format='%s%n%b' "v<version>^1..v<version>^2"  # what actually landed
git diff "v<version>^1" "v<version>" -- package.json    # dependency bumps
```

Keep it factual — name the packages and versions. A lockfile-only bump (empty
`package.json` diff) is a transitive dependency; say so rather than implying a direct one.

Attribute to dependabot **only** if the merged branch's commits are the bot's:

```bash
git log -1 --format=%an "v<version>^2"    # → dependabot[bot] for a bot PR
```

Check `^2`, **not** `git log -1 --format=%an v<version>` — that reads the merge commit,
whose author is always the human who clicked Merge, so it never reports `dependabot[bot]`
and would misclassify every bot PR as human. If the tag is not a merge commit (`^2` fails),
fall back to the tag's own author. A human commit that merely edits dependabot config is
not a bot PR.

This is what makes the bot exemption safe. Skipping it lets the changelog silently lose
versions.

### 3. Evaluate the release level

Review the whole branch against current `main`, not just its latest commit:

```bash
base="$(git merge-base origin/main HEAD)"
git diff --stat "$base"..HEAD
git diff --name-status "$base"..HEAD
git log --format='%s%n%b' "$base"..HEAD
git tag -l "v*" | sed -nE 's/^v([0-9]+\.[0-9]+\.[0-9]+)$/\1/p' | sort -V | tail -1
git show origin/main:package.json | sed -nE 's/.*"version"[[:space:]]*:[[:space:]]*"([^"]+)".*/\1/p' | head -1
node -p "require('./package.json').version"
```

The summary, file list, and commits are an index: read the actual diff and relevant
tests or docs before deciding. Classify the impact to **this project** as exactly one:

- **Major** — an existing public behavior, URL, persisted-data shape, command/config
  contract, or deployment/operational contract becomes incompatible and its consumers
  must migrate.
- **Minor** — a backwards-compatible capability or materially new behavior is added, or
  an intentional platform/toolchain generation change raises the project's supported
  operating baseline without breaking its public behavior.
- **Build** — backwards-compatible fixes, routine dependency updates, documentation,
  tests, refactors, or internal tooling changes add no capability and do not raise a
  support baseline.

Judge the project's compatibility and significance, not the version printed on a
dependency. A dependency's major upgrade does not by itself make this project's release
major; an internal rewrite does not either when the project's contracts remain intact.
When changes span categories, choose the highest applicable level.

Record the decision as `Release level: <major|minor|build> — <one-sentence rationale>`;
step 9 puts that exact line in the PR and step 10 reports it to the user.

Use the higher of the latest released version and the `package.json` floor on
`origin/main` as the release baseline. The final command above prints the branch's
current floor separately. Apply the decision:

- **Build:** the manifest and lockfile version fields stay at the `origin/main` floor;
  the release script increments that line's build number.
- **Minor:** advance the baseline to its next minor line with build zero.
- **Major:** advance the baseline to its next major line with minor and build zero.

For a major or minor decision, update both manifest and lockfile with:

```bash
npm version <new-floor> --no-git-tag-version
```

If the branch already contains the calculated floor, keep it — a re-run must not advance
the line twice. A build-level branch that changes the floor without separate release
intent must restore the `origin/main` floor. Never lower the `origin/main` floor or reuse
a released line. If the compatibility promise itself is genuinely ambiguous, show the
evidence and ask the user before changing the floor. This step is complete only when the
classification has a concrete rationale and the manifest/lockfile floor matches it.

### 4. Compute the target version

```bash
bash scripts/next-version.sh
```

This prints a bare SemVer (e.g. `1.1.6`) — no `v` prefix. Run it after applying any
major/minor floor change. It is the single source of truth for the exact tag; the tag
workflow and the CI guard call the same script. The release-level evaluation selects the
line, but this script selects the final build. Do not compute that final version
yourself.

### 5. Refresh the docs

Invoke the `docs-updater` subagent, scoped to **this branch's diff only** — not a full
audit:

```bash
git diff $(git merge-base origin/main HEAD)..HEAD --stat
```

Use `origin/main`, not local `main` — step 2 fetched, so `origin/main` is current while a
stale local `main` would silently widen the diff to include work already merged.

Tell it exactly what changed and let it update the docs it owns (AGENTS.md and
README.md). **You** write the changelog section in step 6 — tell it to leave
`CHANGELOG.md` alone so you don't fight over the file.

`docs-updater` owns `AGENTS.md` and `README.md`. `CLAUDE.md` is a thin `@AGENTS.md`
import plus Claude-specific notes and rarely needs edits. The mirrors under
`.claude/skills/` and `.codex/` are generated: after `docs-updater` runs — and after any
skill edit under `.agents/skills/` or agent edit under `.claude/agents/` on this branch —
run `npm run sync:ai` and commit the regenerated files in step 8 so the
`AI Config Parity` gate stays green.

### 6. Write the CHANGELOG entry

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
- **Idempotent.** Before writing, list what is already there:

  ```bash
  git diff origin/main...HEAD -- CHANGELOG.md | grep '^+## \['
  ```

  That prints only the sections **this branch added**, which is what distinguishes your
  entry from a legitimately released one. If it names the target version, **rewrite that
  section in place** — never stack a second one. If it names a different (now stale)
  version because someone merged ahead of you, **renumber that same section** to the
  target rather than adding a new one.

- **If you renumbered, sync with `main` before pushing.** Someone merging first means
  their changelog section is also sitting directly under `## [Unreleased]` — the same
  spot as yours — so the merge will conflict there. Handle it now, not in the PR:

  ```bash
  git merge origin/main
  ```

  Resolve `CHANGELOG.md` by keeping **both** sections, theirs above yours, ordered newest
  version first. Then re-run step 4: their merge minted a tag, so the target version has
  moved again.

### 7. Fast checks — refuse to push if any fail

Tests, coverage, the production build, and Playwright are **not** run here; CI owns
them. These are the cheap gates that catch most mistakes in seconds:

```bash
npm run format:check
npm run lint
npx tsc --noEmit
npm run sync:ai && git status --porcelain -- .codex .claude/skills .agents
```

`npm run format:check` is `prettier --check .` at the repo root, so it already covers
`CHANGELOG.md`, the docs, and the source — there is no separate markdown run. Fix
formatting with `npm run format`. The `sync:ai` line regenerates the mirrors and must
print **nothing**; any output means a source edit wasn't synced — commit the regenerated
`.claude/skills/` / `.codex/` files before pushing. If any check is red, stop and report —
do not push.

### 8. Commit the release preparation

Only if `git status --porcelain` is non-empty (on a re-ship with nothing to change, this
step is a no-op — do not create an empty commit):

```bash
git add -A
git commit -m "chore: prepare release v1.1.6"
```

Substitute the real version from step 4 into the message — do not commit the literal
string `v<version>`.

`git add -A` is safe here only because step 1 proved the tree was clean, so everything
staged was created during this ship run. If you skipped or overrode step 1, stage
explicitly instead.

### 9. Push and open or update the PR

```bash
git push -u origin "$(git branch --show-current)"
```

If the push is **rejected** (non-fast-forward), stop and report. Do not force-push: the
remote has commits you do not, and overwriting them destroys someone's work.

Then check whether a PR already exists for this branch:

```bash
gh pr list --head "$(git branch --show-current)" --state open --json number -q '.[0].number'
```

- **No PR** → `gh pr create --base main` with a title and a body derived from the
  changelog section you just wrote. Include the exact `Release level: ...` decision from
  step 3.
- **PR exists** → `gh pr edit <number>` to refresh the body, including the release-level
  decision. Do not open a second PR.

### 10. Report

Give the user: the PR URL; the major/minor/build evaluation and its rationale; the
version this merge will mint; and anything the fast checks or backfill surfaced. State
plainly that the build, coverage (80% gate), and Playwright suites run in CI, not locally
— do not imply the branch is verified beyond the fast checks.

If `Changelog Version` is not yet in the "No Push to Main" ruleset's required checks, it
reports red/green but does not block a merge. Do not describe the changelog as _enforced_
until it is.

## Do not

- Merge the PR. This repo does not self-merge; ship stops at "PR open".
- Push to `main`.
- Force-push anything, ever. If a push is rejected, stop and report.
- Run the build, coverage, or Playwright suites — that is CI's job and it makes this
  skill slow.
- Invent the final version number. Evaluate the release line, then call
  `bash scripts/next-version.sh` for the exact tag.
