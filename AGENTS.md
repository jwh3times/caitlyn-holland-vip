# AGENTS.md

This file provides guidance to AI coding agents (Claude Code, Codex, and others) working in this repository.

## Project Overview

Personal website for Caitlyn Holland built with Next.js 16 (App Router), React 19, TypeScript, and Tailwind CSS v4. The site is configured for **static export** (`output: "export"` in [next.config.ts](next.config.ts)): it builds to `./out/` and deploys to **Cloudflare Pages** at caitlyn.holland.vip, with security headers served from [public/\_headers](public/_headers). There is no backend, no API routes, and no server-side rendering — everything is client-side or statically rendered.

Tailwind v4 is loaded via `@import "tailwindcss"` in [app/globals.css](app/globals.css) and configured entirely in CSS (custom properties + utility classes) — there is no `tailwind.config.ts`.

## Commands

### Development

```bash
npm run dev          # Start dev server at http://localhost:3000
npm run build        # Build for production (outputs to ./out as static export)
npm run lint         # ESLint
npm run format       # Prettier write
npm run format:check # Prettier check (the CI "Format Check" job runs this)
```

Node version is pinned in [.nvmrc](.nvmrc) — run `nvm use` to match CI and Cloudflare.

### Testing

There are two test layers: **Vitest + Testing Library** for fast unit/component tests, and **Playwright** for end-to-end browser tests.

#### Unit tests (Vitest)

Vitest tests live in [test/](test/) (note: singular — `tests/` holds the Playwright specs), mirroring the tested source areas (`test/app/`, `test/components/`, `test/lib/`, `test/scripts/`). They run in jsdom with [vitest.setup.ts](vitest.setup.ts). Coverage is collected with V8 across `app/`, `components/`, `lib/`, and `scripts/**/*.mjs`, and is **gated at 80%** (statements/branches/functions/lines) in [vitest.config.ts](vitest.config.ts); `app/layout.tsx` and the logic-free `components/sections/index.ts` barrel are excluded.

```bash
npm run test:unit        # Run unit tests once
npm run test:unit:watch  # Watch mode
npm run coverage         # Run with V8 coverage (enforces the 80% thresholds)
```

#### End-to-end (Playwright)

The dev server starts automatically — `playwright.config.ts` defines a `webServer` that runs `npm run dev` on `localhost:3000`.

```bash
npm test              # Run all Playwright tests (alias: npm run test:e2e)
npm run test:ui       # Playwright with interactive UI
npm run test:headed   # Run tests in headed browser
npm run test:debug    # Debug Playwright tests

# Run a single file / test / project
npx playwright test tests/homepage.spec.ts
npx playwright test --project=chromium
```

E2E specs in [tests/](tests/) cover homepage rendering, navigation, theme toggling, the mobile menu, and SEO metadata. Locally all five browser/device projects run; **CI runs Chromium only**.

## CI/CD

- **Validation — [.github/workflows/ci.yml](.github/workflows/ci.yml)** — runs on push/PR to `main` with **five** jobs: `Format Check` (`npm run format:check`), `Coverage` (`npm run coverage` — **fails below the 80% thresholds** and uploads a `coverage-report` artifact), `Build & Lint` (`npm run lint` + `npm run build`, uploads the `static-site` artifact), `Playwright Tests` (needs Build & Lint; installs Chromium and runs `npm run test:e2e -- --project=chromium`), and `Changelog Version` (PRs only; computes the next version via [scripts/next-version.sh](scripts/next-version.sh) and fails if [CHANGELOG.md](CHANGELOG.md) has no `## [x.y.z]` section for it — dependabot PRs are exempt). **A PR fails CI if formatting drifts — run `npm run format` before committing.**
- **Dependency review — [.github/workflows/dependency-review.yml](.github/workflows/dependency-review.yml)** — on PRs, fails on vulnerable dependency changes.
- **Versioning — [.github/workflows/version.yml](.github/workflows/version.yml)** — on every merge (push) to `main`, tags the merge commit and creates a GitHub Release using standard SemVer `v<major>.<minor>.<build>` (e.g. `v1.2.7`). It computes the build number with [scripts/next-version.sh](scripts/next-version.sh) — the same script the `Changelog Version` guard and the `ship` skill use, so the tag minted always matches the version the changelog was written for. The `package.json` `version` is the major/minor/build floor; for an existing major/minor line the build increments from the highest matching tag, and a new `x.y.0` line is tagged `v<x.y>.0` when that tag does not already exist.
- **Deployment — Cloudflare Pages** — builds directly from the repo on push to `main` (build command `npm run build`, output dir `out`, Node version from [.nvmrc](.nvmrc)). There is no deploy workflow in the repo — CI is a parallel quality gate, not a deploy gate.

## Architecture

**Single-page layout:** `app/page.tsx` composes the full page from three sections (`HeroSection` → `AboutSection` → `ContactSection`) wrapped by `Navigation` and `Footer`. All sections are in [components/sections/](components/sections/) and exported via [components/sections/index.ts](components/sections/index.ts). Sections use `id` anchors (`#about`, `#contact`) that match the navigation links in [components/navigation.tsx](components/navigation.tsx).

**Static-export constraints:** no API routes or `getServerSideProps`; images are `unoptimized` ([next.config.ts](next.config.ts)); all routes must be known at build time; no runtime environment variables. Security headers live only in [public/\_headers](public/_headers) — `next.config.ts` has no `headers()` block (ignored by static export anyway).

**Theme system:** `next-themes` drives dark/light mode behind the public interface in [components/theme-provider.tsx](components/theme-provider.tsx). Its children-only `Theme` provider owns the fixed `next-themes` configuration and wraps the app in [app/layout.tsx](app/layout.tsx) (with `suppressHydrationWarning` on `<html>`); theme-aware controls consume `useThemeToggle()` instead of importing `next-themes` directly. The hook centralizes the `useSyncExternalStore` mounted guard and returns `{ mounted, isDark, toggle }` — consumers must render server-matching fallback UI until `mounted` is true because `next-themes` reads `localStorage` client-side only. CSS variables in [app/globals.css](app/globals.css) define all color tokens for both themes — use the utility classes (`text-heading`, `text-muted`, `text-label`, `card-bg-blue`, etc.) rather than raw Tailwind color classes so dark mode works automatically.

**Styling conventions:**

- Tailwind v4 (`@import "tailwindcss"` syntax, not the v3 `@tailwind` directives)
- Custom CSS utilities defined in `globals.css` for themed colors, gradients (`.gradient-text`, `.gradient-text-blue`), glassmorphism (`.glass`), section backgrounds (`.section-surface`, `.section-surface-contrast`), and an entrance animation (`.animate-fadeInUp`). A `@media (prefers-reduced-motion: reduce)` block neutralizes animations/transitions.
- Always compose class names with the `cn()` helper from [lib/utils.ts](lib/utils.ts) (`clsx` + `tailwind-merge`) — no raw string concatenation.
- Icons: `lucide-react` for UI icons.

## Development Patterns

- New reusable primitives go in `components/ui/`; new page sections go in `components/sections/` and are re-exported from the index barrel.
- Use `"use client"` only where client interactivity is needed.
- Use the semantic CSS-variable classes — never hardcode colors.
- Unit-test coverage is gated at 80% in CI, so new components generally need a matching test under `test/` (mirroring the source path).
- Site metadata lives in the [app/layout.tsx](app/layout.tsx) `Metadata` export; the SEO Playwright spec asserts it.

## Agent configuration & docs automation

This repo supports multiple AI coding tools from a **single source of truth**, so each fact
is edited once:

- **Shared project guidance** lives in this file, `AGENTS.md`. Claude Code reads it through an
  `@AGENTS.md` import in [CLAUDE.md](CLAUDE.md); other tools read `AGENTS.md` directly.
- **Skills** are authored under **`.agents/skills/<name>/`** and mirrored to
  `.claude/skills/<name>/` by `npm run sync:ai`. The **whole skill directory** is mirrored —
  `SKILL.md` plus every auxiliary file (`agents/openai.yaml`, `scripts/*.sh`, reference
  docs) — so all of it is covered by drift detection. Most skills are vendored from
  [`mattpocock/skills`](https://github.com/mattpocock/skills), fetched into `.agents/` by the
  skills installer and pinned by content hash in [skills-lock.json](skills-lock.json).
- **Agents** go the other way: authored under **`.claude/agents/*.md`** and generated into
  `.codex/agents/*.toml` by the same command. This direction is `.claude`-first because it is
  a format conversion (markdown + YAML frontmatter → TOML), not a copy.

Never edit a generated file — that means anything under **`.claude/skills/`** or **`.codex/`**.
Edit the source and re-run `npm run sync:ai`. Generated markdown and YAML carry an
`AUTO-GENERATED` banner naming their source; shell scripts are copied verbatim so their
shebang stays on line 1, and are drift-checked by content instead. The sync also **prunes**
mirrors whose source is gone, so deleting a skill from `.agents/` removes its `.claude/` copy.
The `AI Config Parity` CI job regenerates everything and fails if the result differs from what
is committed.

The `docs-updater` subagent keeps `AGENTS.md` and `README.md` in sync with the code. Docs are
refreshed when you **ship a branch**: the `ship` skill invokes `docs-updater` (scoped to the
branch diff) as part of opening a PR — alongside computing the version the merge will mint via
[scripts/next-version.sh](scripts/next-version.sh), writing the [CHANGELOG.md](CHANGELOG.md)
entry for it, running `npm run sync:ai`, running the fast checks (`format:check`, `lint`,
`tsc --noEmit`), and pushing. Say "ship it" when a branch is ready for review. The
`Changelog Version` CI job then verifies the changelog names the version the merge will actually
mint.

## Agent skills

### Issue tracker

Issues live in this repo's GitHub Issues (uses the `gh` CLI). See `docs/agents/issue-tracker.md`.

### Triage labels

Default label vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context — one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
