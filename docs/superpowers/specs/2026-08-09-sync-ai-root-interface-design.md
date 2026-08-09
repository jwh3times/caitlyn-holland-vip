# Sync AI Root Interface Design

**Issue:** [#88](https://github.com/jwh3times/caitlyn-holland-vip/issues/88)

## Goal

Make AI configuration discovery, mirroring, and pruning testable without touching the real repository by passing the repository root through one deep module interface.

## Interface

`scripts/sync-ai.mjs` exports one function:

```js
syncAll({ root, write = true })
```

The interface returns the existing array of generated `{ dest, content }` results. `root` is required so every caller states which filesystem tree the operation owns. `write: false` performs discovery and transformation but does not create, update, prune, or remove anything.

All other functions are implementation details, including discovery, recursive listing, transformation, parsing, and pruning. Tests and production callers cross the same `syncAll` seam.

## Adapters and Data Flow

Two root adapters justify the seam:

- `main()` computes the repository root from `import.meta.url` and calls `syncAll({ root })`.
- Vitest creates an isolated temporary fixture tree and calls `syncAll({ root: fixtureRoot, write })`.

Within `syncAll`, the implementation:

1. Discovers `.claude/agents/*.md` and valid `.agents/skills/<name>/**` sources under `root`.
2. Skips skill directories without `SKILL.md`.
3. Transforms agent definitions and supported skill files into their mirrored forms.
4. Returns every generated destination and content pair.
5. When `write` is true, writes generated files and prunes orphaned skill mirrors under the same `root`.

Production paths, generated contents, logging, and the `npm run sync:ai` command remain unchanged.

## Filesystem and Error Behavior

The module continues to use Node's real filesystem implementation. Tests use real temporary directories rather than mocks, so recursive discovery and destructive pruning execute through the same code paths as production while remaining isolated.

Filesystem read, write, parse, and transformation errors propagate to the caller unchanged. This refactor introduces no new error types or recovery behavior.

Pruning remains limited to `.claude/skills/` beneath the supplied root. It removes mirror files not present in the generated destination set and removes a skill mirror directory after it becomes empty.

## Testing

`test/scripts/sync-ai.test.ts` will test only the exported `syncAll` interface. Each test creates and removes its own temporary root. The suite will cover:

- a directory without `SKILL.md` is skipped and not mirrored;
- auxiliary files such as `agents/openai.yaml` and `scripts/*.sh` mirror alongside `SKILL.md`;
- `.claude/agents/*.md` generates `.codex/agents/*.toml`;
- an orphaned mirror is deleted after its source disappears;
- an empty orphan mirror directory is removed;
- `write: false` returns generated results without changing the fixture tree.

Existing transformation guarantees remain covered through representative source files passed through `syncAll`, including generated provenance banners, frontmatter conversion, YAML handling, shell-script shebang preservation, newline normalization, TOML escaping, and invalid agent content.

`vitest.config.ts` will add `scripts/**/*.mjs` to coverage inclusion. The existing 80% statement, branch, function, and line thresholds remain unchanged; coverage must pass with the script included.

## Scope

This change is limited to `scripts/sync-ai.mjs`, `test/scripts/sync-ai.test.ts`, and `vitest.config.ts`. It does not alter source-of-truth direction, generated file formats, package scripts, CI workflows, or documentation outside this design and the eventual changelog produced when the branch is shipped.
