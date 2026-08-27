# Sync AI Root Interface Implementation Plan

> **For agentic workers:** Implement this plan task-by-task using strict red/green TDD. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve issue #88 by making `syncAll({ root, write })` the sole public interface for discovery, transformation, mirroring, and pruning.

**Architecture:** The sync module accepts a filesystem root at its single seam. Production supplies the repository root from `main()`; tests supply temporary directory adapters and observe returned results or filesystem effects without importing implementation helpers.

**Tech Stack:** Node.js filesystem APIs, ECMAScript modules, Vitest, TypeScript test files.

## Global Constraints

- Production paths, generated content, logging, and `npm run sync:ai` behavior remain unchanged.
- `write: false` must not create, update, prune, or remove files.
- Tests cross only the `syncAll({ root, write })` seam and use real temporary directories.
- Coverage continues to enforce 80% statements, branches, functions, and lines.

---

### Task 1: Route discovery and transformation through the root interface

**Files:**

- Modify: `tests/unit/scripts/sync-ai.test.ts`
- Modify: `scripts/sync-ai.mjs`

**Interfaces:**

- Produces: `syncAll({ root: string, write?: boolean }): Array<{ dest: string; content: string }>`

- [ ] **Step 1: Add a temporary-root test helper and a failing agent discovery test**

Create a fixture containing `.claude/agents/sample-agent.md`, call `syncAll({ root, write: false })`, and assert that the returned literal contains only `.codex/agents/sample-agent.toml` with the expected name, description, and body.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npx vitest run tests/unit/scripts/sync-ai.test.ts -t "discovers and transforms agents beneath the supplied root"`

Expected: FAIL because the existing implementation ignores `root` and discovers the real repository.

- [ ] **Step 3: Pass `root` through discovery and reads**

Remove the module-level `ROOT`, change internal discovery to accept `root`, join all source paths against it, and have `main()` compute the existing repository root before calling `syncAll({ root })`.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run the command from Step 2 and expect one passing test.

### Task 2: Exercise skill discovery and auxiliary mirroring through the seam

**Files:**

- Modify: `tests/unit/scripts/sync-ai.test.ts`
- Modify: `scripts/sync-ai.mjs`

- [ ] **Step 1: Add a failing test for valid and invalid skill directories**

Create one skill with `SKILL.md`, `agents/openai.yaml`, and `scripts/run.sh`, plus a directory containing only a stray file. Assert that `write: false` returns the three valid destinations, skips the stray directory, adds provenance to Markdown/YAML, and preserves the shell shebang.

- [ ] **Step 2: Run the focused test and verify RED if behavior is not reachable**

Run: `npx vitest run tests/unit/scripts/sync-ai.test.ts -t "mirrors complete skill trees and skips directories without SKILL.md"`

- [ ] **Step 3: Make only the root-routing changes required for GREEN**

Ensure recursive discovery receives paths beneath the supplied root and continues returning stable forward-slash destinations.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run the command from Step 2 and expect the test to pass.

### Task 3: Route writes and pruning through the supplied root

**Files:**

- Modify: `tests/unit/scripts/sync-ai.test.ts`
- Modify: `scripts/sync-ai.mjs`

- [ ] **Step 1: Add a failing orphan-pruning test**

Create a valid source skill, sync it with `write: true`, remove the source, sync again, and assert both the orphaned mirror file and its now-empty mirror directory are deleted.

- [ ] **Step 2: Run the pruning test and verify RED**

Run: `npx vitest run tests/unit/scripts/sync-ai.test.ts -t "deletes orphaned mirrors and removes empty skill directories"`

Expected: FAIL because pruning currently targets the real repository root.

- [ ] **Step 3: Pass `root` into internal pruning**

Resolve `.claude/skills`, orphan files, and empty directories beneath the supplied root. Keep pruning internal and invoke it only when `write` is true.

- [ ] **Step 4: Run the pruning test and verify GREEN**

Run the command from Step 2 and expect the test to pass.

- [ ] **Step 5: Add and run a `write: false` immutability test**

Snapshot the fixture tree, call `syncAll({ root, write: false })`, and assert no mirror is written and a pre-existing orphan remains untouched.

### Task 4: Collapse tests and exports onto the single interface

**Files:**

- Modify: `tests/unit/scripts/sync-ai.test.ts`
- Modify: `scripts/sync-ai.mjs`

- [ ] **Step 1: Migrate remaining transformation guarantees to fixture inputs**

Through `syncAll`, assert frontmatter conversion, TOML escaping, newline normalization, generated banners, YAML handling, verbatim unknown files, and rejection of an agent body containing `'''`.

- [ ] **Step 2: Run the script test suite while helpers are still exported**

Run: `npx vitest run tests/unit/scripts/sync-ai.test.ts`

Expected: PASS through the public seam.

- [ ] **Step 3: Remove helper exports and their implementation-coupled tests**

Leave `syncAll` as the only exported declaration. Keep transformation, parsing, discovery, and pruning functions internal.

- [ ] **Step 4: Run the script test suite and verify GREEN**

Run the command from Step 2 and expect all tests to pass.

### Task 5: Add script coverage and verify the repository

**Files:**

- Modify: `vitest.config.ts`

- [ ] **Step 1: Add `scripts/**/*.mjs` to coverage inclusion**

Extend the existing coverage `include` array without changing its thresholds or exclusions.

- [ ] **Step 2: Run focused and full verification**

Run:

```powershell
npx vitest run tests/unit/scripts/sync-ai.test.ts
npm run coverage
npm run format:check
npm run lint
npx tsc --noEmit
npm run build
npm run sync:ai
git diff --exit-code -- .claude .codex
```

Expected: every command exits zero, coverage remains at or above 80% in all categories, and generated mirrors have no drift.

- [ ] **Step 3: Review the branch diff against issue #88 and the approved design**

Confirm only the design/plan, `scripts/sync-ai.mjs`, `tests/unit/scripts/sync-ai.test.ts`, and `vitest.config.ts` changed, apart from generated formatting that `sync:ai` proves unchanged.
