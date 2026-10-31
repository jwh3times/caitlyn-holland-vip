# Docs

## Doc map

- `AGENTS.md` — the canonical guide every coding agent reads: commands, testing layers, CI/CD,
  architecture, theme system, styling rules, agent configuration. It describes what is implemented.
  **When:**
  - a page section or the navigation changes (`components/sections/`,
    `components/navigation.tsx`): the single-page layout paragraph (section order, anchor ids) and
    Development Patterns;
  - a reusable primitive or theme-dependent component changes (`components/ui/`, anything using
    `useThemeToggle()`): the theme system and mounted-guard notes;
  - a CSS utility, color token or animation changes (`app/globals.css`): the styling conventions;
  - CI or test configuration changes (`.github/workflows/`, `vitest.config.ts`,
    `playwright.config.ts`): the CI/CD and Testing sections — the coverage threshold matching
    `vitest.config.ts`, the job count and names matching `ci.yml`;
  - agent config changes (`.agents/skills/`, `skills-lock.json`): "Agent configuration & docs
    automation";
  - metadata or headers change (`app/layout.tsx`, `public/_headers`): the metadata and
    security-headers notes;
  - an npm script or a `scripts/` file is added or removed: the Commands lists, the CI description,
    and the coverage exclusions in `vitest.config.ts`.
- `CLAUDE.md` — a thin entry point: the `@AGENTS.md` import plus Claude Code-only notes. **When:**
  only a Claude Code-specific note changes.
- `README.md` — overview and setup for human developers. **When:** a prerequisite, setup step or
  command changes.
- `CONTRIBUTING.md`, `SECURITY.md` — how to contribute, how to report a vulnerability. **When:** the
  development flow, PR template or security process changes.
- `CODE_OF_CONDUCT.md`, `LICENSE` — `owner-only`.
- `CHANGELOG.md` — release notes, Keep a Changelog, one dated section per merge. `ship-owned`.
- `CONTEXT.md`, `docs/adr/*.md` — the domain glossary and decisions, written by the `grilling` and
  `domain-modeling` skills. `frozen` for this skill: point at them, and report a contradiction
  between an accepted ADR and the code instead of editing either.
- `docs/research/*.md` — dated research behind a live decision, never a status report.
  `amend-only`. **When:** the decision it backs, or the evidence it cites, changes.
- `docs/agents/*.md` — conventions and settings the skills read. **When:** a convention or setting
  changes.
- `.agents/skills/*/**` — skills, mirrored to `.claude/skills/`. The skills ADR-0006 vendored from
  `mattpocock/skills` are forked and owned here: edit them in place, and update `ask-matt`'s routing
  when a skill is added or removed. `end-session`, `handoff`, `lets-go`, `ship` and `docs-updater`
  install from `jwh3times/skills` (ADR-0011): `frozen` here, fixed upstream. **When:** a skill is
  added, removed or replaced (`.agents/skills/`, `skills-lock.json`): `ask-matt`'s routing,
  `CLAUDE.md` and AGENTS.md's skill paragraph.
- `.github/pull_request_template.md` — the PR body's sections. **When:** the development flow's
  linking rule changes.
- `private/**/*.md` — durable private procedures in the companion; live status belongs in issues.
  **When:** a private procedure changes.

**Never in public docs:** private repository locators and private details, credentials and recovery
material, and unpublished vulnerability details (they stay in a draft advisory).

## Drift probes

- Sections that exist: `components/sections/*.tsx`
- Anchor ids: `id="` in `components/sections/`
- Coverage thresholds: `thresholds|statements|branches` in `vitest.config.ts`
- CI jobs: the keys under `jobs:` in `.github/workflows/ci.yml` (two-space indent, after the
  `jobs:` line), then each one's `name:` — never a bare `name:` grep, which counts steps too
- npm scripts: `scripts` in `package.json`
- Required status checks: `gh api repos/jwh3times/caitlyn-holland-vip/rules/branches/main`

## Docs validation

- `node scripts/check-docs.mjs`
- `npm run format:check` — Prettier covers the repository's Markdown.
