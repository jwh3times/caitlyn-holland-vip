# AI tool config: single source of truth + parity gate

- **Date:** 2026-07-23
- **Status:** Approved (design) — ready for implementation planning
- **Author:** Jerry Holland (with Claude)

## Context

The repo carries per-AI-tool configuration for two coding assistants:

- **Claude Code** — reads `CLAUDE.md`; agents in `.claude/agents/*.md` (YAML
  frontmatter + markdown); skills in `.claude/skills/*/SKILL.md`.
- **Codex** — reads `AGENTS.md`; agents in `.codex/agents/*.toml` (TOML with a
  `developer_instructions` string); skills in `.agents/skills/*/SKILL.md`; MCP
  config in `.codex/config.toml`.

The Codex files were generated to mirror the Claude ones, producing **two hand-maintained
copies of the same content**. This has already drifted:

- `.agents/skills/ship/SKILL.md` carries an **older** step‑2 backfill (missing the `^2`
  second‑parent logic present in the Claude copy).
- It contains a copy‑paste **bug**: "`AGENTS.md` mirrors AGENTS.md" (should read "mirrors
  `CLAUDE.md`").

We want one place to make each change, with the other tool's files derived automatically,
and a CI gate that fails when the derived files drift from their source.

## Goals

1. **One source per concern.** Editing a fact happens in exactly one file.
2. **Deterministic derivation.** A script regenerates every derived file from its source.
3. **A CI parity gate.** CI fails if the committed derived files don't match what the
   script would produce.
4. **Cross-platform.** Runs identically on Windows (dev) and Linux (CI).
5. **No new runtime dependencies.** Keep the dependency-review surface flat.

## Non-goals

- Syncing `.codex/config.toml` (Codex-only MCP config; no Claude twin). Hand-maintained,
  out of scope.
- Generating human prose variants. Derived files are mechanical transforms, not reworded.
- Supporting additional AI tools now. The mapping is data-driven so a third tool can be
  added later, but only Claude↔Codex is in scope.

## Source-of-truth model

| Concern                 | Single source (authored)        | Derived / secondary                       | Kept in sync by                |
| ----------------------- | ------------------------------- | ----------------------------------------- | ------------------------------ |
| Shared project guidance | **`AGENTS.md`**                 | `CLAUDE.md` (imports it via `@AGENTS.md`) | Claude's native import         |
| Agent definitions       | **`.claude/agents/*.md`**       | `.codex/agents/*.toml`                    | `scripts/sync-ai.mjs`          |
| Skill definitions       | **`.claude/skills/*/SKILL.md`** | `.agents/skills/*/SKILL.md`               | `scripts/sync-ai.mjs`          |
| Codex MCP config        | `.codex/config.toml`            | — (no twin)                               | hand-maintained (out of scope) |

The only files a human edits are **`AGENTS.md`** and the **`.claude/`** sources.

## Detailed design

### 1. Root-doc restructure (no script)

Confirmed against Claude Code docs: Claude Code reads **only** `CLAUDE.md` (and
`CLAUDE.local.md`), **not** `AGENTS.md`. `CLAUDE.md` may import another file with
`@path/to/file`, which inlines that file's content into context exactly once at launch
(max import depth 4; imports inside code blocks/spans are ignored; paths resolve relative
to the importing file). So:

- Move the full **shared, tool-neutral** guidance into **`AGENTS.md`**. Word it neutrally
  ("coding agents", "the project instructions") — no `CLAUDE.md`-specific references, no
  Claude-only or Codex-only file paths in the shared body.
- Shrink **`CLAUDE.md`** to an import plus a Claude-only section:

  ```markdown
  # CLAUDE.md

  @AGENTS.md

  ## Claude-specific

  The docs-updater subagent lives at `.claude/agents/docs-updater.md`; the ship skill at
  `.claude/skills/ship/SKILL.md`. …
  ```

- Codex loads its own agents/skills by directory convention, so `AGENTS.md` does **not**
  need to enumerate Codex file paths. Tool-specific automation pointers live with their
  tool: Claude paths under `CLAUDE.md`'s "Claude-specific" section; Codex needs none in
  the doc.

Because `CLAUDE.md` no longer duplicates the shared content, **there is nothing to
parity-check for the root doc** — the import guarantees a single source.

### 2. The sync generator — `scripts/sync-ai.mjs`

Node ESM, **zero new npm dependencies**. Uses only stable `node:fs` / `node:path` APIs
(`readdirSync`, `readFileSync`, `writeFileSync`). Node version per `.nvmrc`.

**Discovery (convention over configuration).** The script auto-discovers sources so adding
a new agent/skill requires no edit to a mapping list:

- Agents: every `.claude/agents/*.md` → `.codex/agents/<name>.toml`
- Skills: every `.claude/skills/<name>/SKILL.md` → `.agents/skills/<name>/SKILL.md`

A small config block at the top holds the **swap map** and any explicit exceptions.

**Agent transform (`.md` → `.toml`):**

- Parse the flat YAML frontmatter (`name`, `description`, `tools`, `model`) and the
  markdown body. Frontmatter here is simple `key: value` lines — a minimal purpose-built
  parser is sufficient (no YAML dependency).
- Emit deterministic TOML with a fixed key order:

  ```toml
  # AUTO-GENERATED from .claude/agents/<name>.md by scripts/sync-ai.mjs — do not edit.
  # Edit the source and run `npm run sync:ai`.
  name = "<name>"
  description = "<description, swap-mapped>"
  developer_instructions = '''
  <body, swap-mapped>
  '''
  ```

- **Drop** `tools` and `model` (no Codex equivalent).
- Use a TOML **multi-line literal string** (`'''…'''`) for `developer_instructions`, not a
  basic string (`"""`). Literal strings perform **no** escape processing, so arbitrary
  markdown/regex/backslashes in the body embed safely. The generator **asserts the body
  contains no `'''`** and fails loudly if it ever does (the one sequence a literal string
  can't hold). (Note: this intentionally differs from the current hand-generated
  `.codex/agents/docs-updater.toml`, which used `"""`; regeneration replaces it.)
- The single-line `description` is emitted as a basic string with `"`/`\` escaped, or a
  literal `'…'` string if it contains a `"`.

**Skill transform (`.md` → `.md`):**

- Preserve the YAML frontmatter verbatim (Codex skills use the same `SKILL.md` frontmatter
  shape).
- Insert a generated marker immediately after the closing frontmatter `---`:

  ```markdown
  <!-- AUTO-GENERATED from .claude/skills/<name>/SKILL.md by scripts/sync-ai.mjs — do not edit. Edit the source and run `npm run sync:ai`. -->
  ```

- Apply the swap map to the body.

**Swap map.** A small, ordered, curated list of exact-string replacements applied to
derived content — the escape hatch for genuinely tool-specific tokens (e.g. a
`.claude/…`→`.codex/…`/`.agents/…` cross-reference, or tool-name wording that can't be
neutralized). **We minimize it by neutralizing the sources** (§4), so it may be empty or
near-empty at first. Its presence is deliberate: it's the seam a future third tool or an
unavoidable per-tool token plugs into.

**CLI / testability:**

- Export pure functions: `agentMarkdownToToml(raw)`, `skillTransform(raw)`,
  `applySwapMap(text)`, plus a `syncAll()` that walks the tree and writes files.
- Guard the entry point (`if (import.meta.url === pathToFileURL(process.argv[1]).href) main()`)
  so importing the module in a test does not run the generator.
- `main()` supports a `--check` flag (generate in memory, compare to disk, exit non-zero on
  mismatch) in addition to the default write mode. The CI gate can use either `--check` or
  the regenerate-and-diff pattern in §3; regenerate-and-diff is the primary.

**npm script:**

```jsonc
"sync:ai": "node scripts/sync-ai.mjs && prettier --write \".agents/**/*.md\""
```

Running the generator then `prettier --write` on the generated markdown keeps committed
output prettier-clean so it never fights `format:check`. `.toml` is not a format prettier
recognizes, so it is skipped (and `prettier --check .` does not error on it) — the TOML
generator must therefore emit already-final bytes.

### 3. Parity CI gate

A new job in `.github/workflows/ci.yml`, matching the existing checkout → setup-node →
`npm ci` shape:

```yaml
ai-parity:
  name: AI Config Parity
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v7
    - uses: actions/setup-node@v7
      with:
        node-version-file: ".nvmrc"
        cache: "npm"
    - run: npm ci
    - run: npm run sync:ai
    - name: Verify generated AI configs are committed
      run: |
        if [ -n "$(git status --porcelain -- .codex .agents)" ]; then
          echo "::error::Generated AI tool configs are out of date. Run 'npm run sync:ai' and commit the result."
          git --no-pager diff -- .codex .agents
          git status --porcelain -- .codex .agents
          exit 1
        fi
```

- `git status --porcelain` (not just `git diff`) catches **both** modified tracked files
  **and** new untracked derived files (a source added without its twin committed).
- Scoping to `-- .codex .agents` means the hand-maintained `.codex/config.toml` is
  untouched by sync and stays clean, so it never trips the gate.
- ⚠️ **Branch protection:** `main`'s "No Push to Main" ruleset requires a fixed set of
  status checks. This job reports pass/fail but **will not block merges until it is added
  to that ruleset** in GitHub — the same caveat the ship skill documents for
  `Changelog Version`. The spec notes it; enabling enforcement is a manual ruleset edit.

### 4. Neutralize + retarget the `.claude/` sources

Because the doc source moved to `AGENTS.md`, the automation content itself changes. These
edits also shrink the swap map toward empty.

**`.claude/agents/docs-updater.md`:**

- Retarget the docs it maintains from `CLAUDE.md` to **`AGENTS.md`** (the "Documents you
  maintain" table, "How to detect drift", "What NOT to change").
- Neutralize the audience wording (e.g. "AI coding agents (every session)") so the Claude
  and Codex variants share an identical body — the only remaining difference becomes
  frontmatter format + the dropped `tools`/`model` fields.

**`.claude/skills/ship/SKILL.md`:**

- Change "docs it owns (CLAUDE.md and README.md)" → "(AGENTS.md and README.md)".
- Rewrite/remove the now-obsolete "`AGENTS.md` mirrors CLAUDE.md but is not owned by
  docs-updater" paragraph — under the new model `AGENTS.md` **is** the source docs-updater
  owns, and `CLAUDE.md` is a thin import that rarely changes.
- Neutralize "the **Bash** tool (git-bash on this Windows machine)" → "a bash/POSIX shell
  (git-bash on this Windows machine)".
- **Add a step:** after docs-updater refreshes `AGENTS.md`/`README.md` and after any
  agent/skill edits, run **`npm run sync:ai`** and include the regenerated `.codex/` /
  `.agents/` files in the commit — so a shipped branch never trips the parity gate. The
  gate is the backstop; ship keeping the tree synced is the happy path.

The stale, buggy uncommitted Codex files are simply **overwritten by the first
`npm run sync:ai`**, regenerated correctly from the (now neutralized) `.claude/` sources.

### 5. Generated-file hygiene (optional)

Add `.codex/agents/*.toml` and `.agents/skills/**` to `.gitattributes` as
`linguist-generated=true` so GitHub collapses them in diffs and excludes them from language
stats. Nice-to-have, not required.

## Complete file change list

**New:**

- `scripts/sync-ai.mjs` — the generator.
- `tests/unit/scripts/sync-ai.test.ts` — unit tests for the transforms.
- `docs/superpowers/specs/2026-07-23-ai-config-parity-design.md` — this spec.

**Modified:**

- `AGENTS.md` — becomes the canonical, tool-neutral shared doc.
- `CLAUDE.md` — reduced to `@AGENTS.md` + a "Claude-specific" section.
- `.claude/agents/docs-updater.md` — retargeted to `AGENTS.md`, neutralized.
- `.claude/skills/ship/SKILL.md` — retargeted, neutralized, gains the `sync:ai` step.
- `package.json` — add the `sync:ai` script.
- `.github/workflows/ci.yml` — add the `AI Config Parity` job.
- `CHANGELOG.md` — entry for the version this merge mints (via ship).
- `.gitattributes` — optional generated-file marking.

**Regenerated (by `npm run sync:ai`, committed):**

- `.codex/agents/docs-updater.toml`
- `.agents/skills/ship/SKILL.md`

**Untouched (out of scope):**

- `.codex/config.toml`

## Testing & verification

- **Unit (`tests/unit/scripts/sync-ai.test.ts`, Vitest):** cover the pure transforms —
  - `agentMarkdownToToml`: correct key order + values; `tools`/`model` dropped; body
    embedded in a `'''` literal string; the no-`'''`-in-body guard throws when violated;
    generated header present.
  - `skillTransform`: frontmatter preserved; marker inserted after frontmatter; swaps
    applied.
  - `applySwapMap`: replacements applied in order.
  - **Idempotency:** transforming already-transformed-shaped input is stable; running
    `syncAll` twice yields no diff.
  - **Parity self-check:** regenerate from the real `.claude/` sources in-memory and assert
    it equals the committed `.codex/` / `.agents/` files (a local mirror of the CI gate).
  - The script lives in `scripts/`, outside the coverage `include` globs
    (`app`/`components`/`lib`), so these tests **do not** affect the 80% coverage gate.
- **Manual:** run `npm run sync:ai`; confirm the regenerated files match expectations and
  the stale/buggy Codex copies are corrected. Run `npm run format:check` and
  `npx tsc --noEmit`.
- **CI:** the `AI Config Parity` job proves derived files are committed and current.

## Rollout order

1. Restructure root docs (`AGENTS.md` canonical; `CLAUDE.md` imports it).
2. Neutralize + retarget `.claude/` sources; add the `sync:ai` step to ship.
3. Write `scripts/sync-ai.mjs` + the `sync:ai` npm script.
4. Run `npm run sync:ai`; commit the regenerated `.codex/` / `.agents/` files.
5. Add `tests/unit/scripts/sync-ai.test.ts`.
6. Add the `AI Config Parity` CI job (+ optional `.gitattributes`).
7. Ship: changelog entry; note the manual ruleset addition to make the gate blocking.

## Assumptions (confirmed in brainstorming)

- **Codex target paths:** agents → `.codex/agents/`, skills → `.agents/skills/` (mirroring
  what Codex generated). If Codex actually reads skills from a different directory, the
  discovery convention in §2 is the one place to change.
- **`.codex/config.toml`** stays hand-maintained and out of scope.
- **Agents flow Claude→Codex** (Claude's format is the richer superset; generating Codex
  drops unused fields, whereas the reverse would fabricate `tools`/`model`).

## Open questions

- None blocking. If a future agent/skill body legitimately needs `'''`, revisit the TOML
  string strategy (switch to escaped `"""` for that field).
