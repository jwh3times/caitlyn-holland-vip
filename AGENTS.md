# AGENTS.md

This file provides guidance to AI coding agents (Claude Code, Codex, and others) working in this repository.

## Project Overview

Personal website for Caitlyn Holland built with Next.js 16 (App Router), React 19, TypeScript 7, and Tailwind CSS v4. The site is configured for **static export** (`output: "export"` in [next.config.ts](next.config.ts)): it builds to `./out/` and deploys to **Cloudflare Pages** at caitlyn.holland.vip, with security headers served from [public/\_headers](public/_headers). There is no backend, no API routes, and no server-side rendering — everything is client-side or statically rendered.

Tailwind v4 is loaded via `@import "tailwindcss"` in [app/globals.css](app/globals.css), where theme tokens and custom utilities are configured; there is no `tailwind.config.ts`. Next.js compiles CSS through `@tailwindcss/webpack` using the Turbopack `*.css` rule in [next.config.ts](next.config.ts), with no PostCSS configuration.

## Commands

### Development

```bash
npm run dev          # Start dev server at http://localhost:3000
npm run build        # Build for production (outputs to ./out as static export)
npm run preview      # Serve a completed ./out export locally
npm run lint         # Oxlint
npm run lint:fix     # Oxlint safe autofixes
npx tsc --noEmit     # TypeScript 7 native CLI type-check
npm run format       # Prettier write
npm run format:check # Prettier check (the CI "Format Check" job runs this)
npm run bootstrap:private # Clone the optional private companion into ignored private/
npm run sync:main    # Update clean public/private checkouts to origin/main (missing private is skipped)
```

Run `npm run build` before `npm run preview`; the preview command serves the completed static
export rather than building it. It serves content only and does not apply Cloudflare's
`public/_headers`; deployed-header validation remains the responsibility of the post-deploy smoke
workflow.

Lint rules live in [.oxlintrc.json](.oxlintrc.json). Oxlint owns the core, TypeScript, React, React Compiler, and React Hooks checks natively; one unsupported Next.js navigation rule still runs through `@next/eslint-plugin-next` (no native `nextjs/no-location-assign-relative-destination` rule exists yet — see [the Oxlint research](docs/research/oxlint-native-location-assign-rule.md)). ESLint is only a transitive compatibility dependency of that plugin, not the lint runner. Next.js 16.3 defaults production type-checking to the project-local TypeScript 7 CLI; keep `useTypeScriptCli` unset unless a future Next.js upgrade changes that default. See [the compatibility research](docs/research/nextjs-typescript-cli-stability.md).

Node version is pinned in [.nvmrc](.nvmrc) — run `nvm use` to match CI and Cloudflare. The pin
is **Node 26**, currently a _Current_ (pre-LTS) release rather than Active LTS; `@types/node` is
held on the matching `26.x` typings line so the compiler cannot promise APIs the runtime lacks.
The `devEngines` policy in [package.json](package.json) rejects `npm install`, `npm ci`, and
`npm run` before they start when the active Node/npm major does not match the pinned Node 26/npm
11 toolchain; switch runtimes before dependency work rather than accepting lockfile churn.
See [ADR-0007](docs/adr/0007-node-runtime-pin-tracks-types-node.md) — the pin and the typings move
together, in either direction.

### Testing

There are two test layers: **Vitest + Testing Library** for fast unit/component tests, and **Playwright** for end-to-end browser tests.

#### Unit tests (Vitest)

Vitest tests live in [tests/unit/](tests/unit/), mirroring the tested source areas (`tests/unit/app/`, `tests/unit/components/`, `tests/unit/lib/`, `tests/unit/scripts/`); a test for a repo-root file such as [next.config.ts](next.config.ts) sits at `tests/unit/` root too (e.g. `tests/unit/next-config.test.ts`), not in one of those subdirectories. They run in jsdom with [vitest.setup.ts](vitest.setup.ts). Coverage is collected with V8 across `app/`, `components/`, `lib/`, and `scripts/**/*.mjs`, and is **gated at 80%** (statements/branches/functions/lines) in [vitest.config.ts](vitest.config.ts); `app/layout.tsx` and the logic-free `components/sections/index.ts` barrel are excluded.

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
npx playwright test tests/e2e/homepage.spec.ts
npx playwright test --project=chromium
```

E2E specs in [tests/e2e/](tests/e2e/) cover homepage rendering, navigation, theme toggling and persistence across reloads, the mobile menu, SEO metadata and Person JSON-LD, and WCAG 2.1 A/AA accessibility audits for the default page, open mobile disclosure, and dark theme. Theme tests emulate a light system color scheme so stored user choices and accessible toggle state are deterministic. Locally all five browser/device projects run; **CI runs the desktop Chromium and Mobile Chrome (Pixel 5) projects with one worker**.

## CI/CD

- **Validation — [.github/workflows/ci.yml](.github/workflows/ci.yml)** — runs on push/PR to `main` with **six** jobs: `Format Check` (`npm run format:check`), `Coverage` (`npm run coverage` — **fails below the 80% thresholds** and uploads a `coverage-report` artifact), `Build & Lint` (`npm run lint` + `npm run build`, uploads the `static-site` artifact), `Playwright Tests` (needs Build & Lint; installs Chromium and runs the desktop Chromium and Mobile Chrome projects with one CI worker), `AI Config Parity` (runs `npm run sync:ai` and fails if `.codex`, `.claude/skills`, or `.agents` is dirty afterwards — it covers the **sources** too, because the sync reformats them, so an unformatted `.agents/` edit fails here rather than in `Format Check`), and `Changelog Version` (PRs only; computes the next version via [scripts/next-version.sh](scripts/next-version.sh) and fails if [CHANGELOG.md](CHANGELOG.md) has no `## [x.y.z]` section for it — dependabot PRs are exempt). **A PR fails CI if formatting drifts — run `npm run format` before committing.**
- **Dependency review — [.github/workflows/dependency-review.yml](.github/workflows/dependency-review.yml)** — on PRs, fails on vulnerable dependency changes.
- **Code scanning — CodeQL default setup** — configured repository-side (Settings → Code security), scanning JavaScript/TypeScript and Actions. There is **no `codeql.yml` on purpose**: an advanced-config workflow conflicts with default setup, so do not add one. Its `CodeQL` check is required to merge even though nothing in the repo declares it.
- **Versioning — [.github/workflows/version.yml](.github/workflows/version.yml)** — on every merge (push) to `main`, tags the merge commit and creates a GitHub Release using standard SemVer `v<major>.<minor>.<build>` (e.g. `v1.2.7`). It computes the build number with [scripts/next-version.sh](scripts/next-version.sh) — the same script the `Changelog Version` guard and the `ship` skill use, so the tag minted always matches the version the changelog was written for. The `package.json` `version` is the major/minor/build floor; for an existing major/minor line the build increments from the highest matching tag, and a new line starts at the floor's own build — bump the floor to `1.2.3` with no `v1.2.*` tags and the first tag on that line is `v1.2.3`, not `v1.2.0`. The floor is a lower bound only, never a record of the current release, so it legitimately sits far behind the latest tag.
- **Deployment — Cloudflare Pages** — builds directly from the repo on push to `main` (build command `npm run build`, output dir `out`, Node version from [.nvmrc](.nvmrc)). There is no deploy workflow in the repo — CI is a parallel quality gate, not a deploy gate. Its `Cloudflare Pages` check reports on the PR.
- **Post-deploy smoke — [.github/workflows/smoke.yml](.github/workflows/smoke.yml)** — runs daily and on manual dispatch with no checkout or dependency install. It verifies the live homepage and content marker, the presence of six security headers, and HTTP 200 responses from the deployed sitemap and robots file.
- **Required checks** — the `No Push to Main` ruleset requires eight: the six `ci.yml` jobs above,
  `CodeQL`, and `Dependency Review`. `main` is protected; never push to it directly.

## Architecture

**Single-page layout:** `app/page.tsx` composes the full page from five sections (`HeroSection` → `AboutSection` → `SkillsSection` → `ExperienceSection` → `ContactSection`) wrapped by `Navigation` and `Footer`. All sections are in [components/sections/](components/sections/) and exported via [components/sections/index.ts](components/sections/index.ts). The About section owns the biography, education, and certifications; skills and work history have dedicated server components. Sections use `id` anchors (`#about`, `#skills`, `#experience`, `#contact`) that match the navigation links in [components/navigation.tsx](components/navigation.tsx).

**Static-export constraints:** no API routes or `getServerSideProps`; images are `unoptimized` ([next.config.ts](next.config.ts)); all routes must be known at build time; no runtime environment variables. Security headers live only in [public/\_headers](public/_headers) — `next.config.ts` has no `headers()` block (ignored by static export anyway). The CSP intentionally permits inline scripts because `next-themes` injects a pre-paint theme script; this static deployment cannot provide a per-request nonce.

**Theme system:** `next-themes` drives dark/light mode behind the public interface in [components/theme-provider.tsx](components/theme-provider.tsx). Its children-only `Theme` provider owns the fixed `next-themes` configuration and wraps the app in [app/layout.tsx](app/layout.tsx) (with `suppressHydrationWarning` on `<html>`); theme-aware controls consume `useThemeToggle()` instead of importing `next-themes` directly. The hook centralizes the `useSyncExternalStore` mounted guard and returns `{ mounted, isDark, toggle }` — consumers must render server-matching fallback UI until `mounted` is true because `next-themes` reads `localStorage` client-side only. CSS variables in [app/globals.css](app/globals.css) define all color tokens for both themes — use the utility classes (`text-heading`, `text-muted`, `text-label`, `card-bg-blue`, etc.) rather than raw Tailwind color classes so dark mode works automatically.

**Styling conventions:**

- Tailwind v4 (`@import "tailwindcss"` syntax, not the v3 `@tailwind` directives)
- Tailwind's `dark` variant is class-based via `@custom-variant` in `globals.css`, matching the
  `.dark` class managed by `next-themes`; keep theme and utility configuration in CSS.
- **Tailwind integration changes:** read the compatibility analysis, benchmark method, and recorded
  results in [docs/research/tailwind-webpack-nextjs-benchmark.md](docs/research/tailwind-webpack-nextjs-benchmark.md), then retain the regression coverage in [tests/unit/tailwind-config.test.ts](tests/unit/tailwind-config.test.ts).
- Custom CSS utilities defined in `globals.css` for semantic accents, borders, rings, badges, and hover surfaces (`text-accent`, `bg-accent`, `border-accent`, `ring-accent`, `text-badge-blue`, `border-subtle`, `border-subtle-50`, `bg-surface-hover`); themed colors; gradients (`.gradient-text`, `.gradient-text-blue`); glassmorphism (`.glass`); section backgrounds (`.section-surface`, `.section-surface-contrast`); and an entrance animation (`.animate-fadeInUp`). The semantic utilities retain the established Tailwind palette values across light and dark themes, so use them instead of raw palette classes. A `@media (prefers-reduced-motion: reduce)` block neutralizes animations/transitions.
- Always compose class names with the `cn()` helper from [lib/utils.ts](lib/utils.ts) (`clsx` + `tailwind-merge`) — no raw string concatenation.
- Icons: `lucide-react` for UI icons.

## Development Patterns

- New reusable primitives go in `components/ui/`; new page sections go in `components/sections/` and are re-exported from the index barrel.
- Use [components/ui/button.tsx](components/ui/button.tsx) `CtaLink` for CTA navigation (`tone`: `primary`/`secondary`; `size`: `md`/`lg`) and `Button` for button actions. The variant composer is internal; gradient `Button` variants must be paired with `cta`/`ctaLg` sizes.
- Use `"use client"` only where client interactivity is needed.
- Use the semantic CSS-variable classes — never hardcode colors.
- Unit-test coverage is gated at 80% in CI, so new components generally need a matching test under `tests/unit/` (mirroring the source path).
- Shared profile facts (`name`, `siteUrl`, `description`, `bio`) live in [lib/profile.ts](lib/profile.ts) and feed metadata, the sitemap, and repeated page copy; experience, skills, email, and LinkedIn stay local to their owning sections. [public/manifest.json](public/manifest.json) remains static, with its duplicated profile fields kept aligned by [tests/unit/lib/profile.test.ts](tests/unit/lib/profile.test.ts).
- Site metadata lives in the [app/layout.tsx](app/layout.tsx) `Metadata` export. The layout also
  embeds the static, script-safe Person JSON-LD serialized by
  [lib/structured-data.ts](lib/structured-data.ts); its professional facts must stay aligned with
  the published page copy. Unit tests cover the serializer, and the SEO Playwright spec asserts
  the rendered metadata and structured-data script.

## Agent configuration & docs automation

This repo supports multiple AI coding tools from a **single source of truth**, so each fact
is edited once:

- **Shared project guidance** lives in this file, `AGENTS.md`. Claude Code reads it through an
  `@AGENTS.md` import in [CLAUDE.md](CLAUDE.md); other tools read `AGENTS.md` directly.
- **Skills** are authored under **`.agents/skills/<name>/`** and mirrored to
  `.claude/skills/<name>/` by `npm run sync:ai`. The **whole skill directory** is mirrored —
  `SKILL.md` plus every auxiliary file (`agents/openai.yaml`, `scripts/*.sh`, reference
  docs) — so all of it is covered by drift detection. Of the 16 skills, 14 originated in
  [`mattpocock/skills`](https://github.com/mattpocock/skills) but are now forked and owned
  locally — edited in place rather than tracked upstream — per
  [ADR-0006](docs/adr/0006-vendored-skill-policy.md). [skills-lock.json](skills-lock.json)
  records provenance only (nothing reads it): the `computedHash` per skill is what was
  originally fetched, not current content, and `localized: true` flags skills that have
  since diverged from that upstream source. The two written here rather than fetched —
  [`ship`](.agents/skills/ship/SKILL.md) and
  [`end-session`](.agents/skills/end-session/SKILL.md) — have no lockfile entry, which is how
  you tell them apart; authoring one is just adding the directory under `.agents/skills/` and
  re-running the sync.
- **Agents** go the other way: authored under **`.claude/agents/*.md`** and generated into
  `.codex/agents/*.toml` by the same command. This direction is `.claude`-first because it is
  a format conversion (markdown + YAML frontmatter → TOML), not a copy.

Never edit a generated file — that means anything under **`.claude/skills/`** or
**`.codex/agents/`**. Edit the source and re-run `npm run sync:ai`. Generated markdown and YAML
carry an `AUTO-GENERATED` banner naming their source; shell scripts are copied verbatim so their
shebang stays on line 1, and are drift-checked by content instead. The sync also **prunes**
mirrors whose source is gone, so deleting a skill from `.agents/` removes its `.claude/` copy.
The one exception is [.codex/config.toml](.codex/config.toml) — hand-authored Codex
configuration with no generating source, safe to edit directly. The `AI Config Parity` CI job
regenerates everything and fails if the result differs from what is committed.

### Next.js agent rules — auto-generation is off

`next dev` on Next.js 16.3+ appends a managed block — delimited by HTML comments named
`BEGIN:nextjs-agent-rules` / `END:nextjs-agent-rules` — to `AGENTS.md` whenever it detects a
coding agent in the environment. **This repo opts out** with
`agentRules: false` in [next.config.ts](next.config.ts) — see
[ADR-0008](docs/adr/0008-nextjs-agent-rules-opt-out.md). `AGENTS.md` stays entirely
hand-authored, so no tool writes into it and no unrelated diff picks up a dirty `AGENTS.md`.
Do not remove the flag, and do not commit the block if you see it — restore the flag instead.
[tests/unit/next-config.test.ts](tests/unit/next-config.test.ts) guards both halves of that.

Note what the opt-out does **not** touch: `npm run sync:ai` and the `AI Config Parity` CI job
only regenerate `.agents/`, `.claude/skills/`, and `.codex/agents/`. Neither reads or writes
`AGENTS.md`, so the block was never a parity failure — only a dirty working tree.

The block's actual advice is worth keeping, so it lives here by hand instead:

> **Next.js 16 differs from most training data.** Before writing Next.js code, read the relevant
> guide under `node_modules/next/dist/docs/` (mirrors the structure of nextjs.org/docs, and is
> version-matched to the installed `next`). Heed deprecation notices. Appending `.md` to any
> nextjs.org/docs URL returns the same content over the network.

The `docs-updater` subagent keeps `AGENTS.md` and `README.md` in sync with the code. Docs are
refreshed when you **ship a branch**: the `ship` skill invokes `docs-updater` (scoped to the
branch diff) as part of opening a PR — alongside evaluating whether the changes warrant a major,
minor, or standard build-number release, adjusting the package-version floor when needed,
computing the exact version via [scripts/next-version.sh](scripts/next-version.sh), writing the
[CHANGELOG.md](CHANGELOG.md) entry for it, running `npm run sync:ai`, running the fast checks
(`format:check`, `lint`, `tsc --noEmit`), and pushing. Say "ship it" when a branch is ready for review. The
`Changelog Version` CI job then verifies the changelog names the version the merge will actually
mint. Both `ship` and `end-session` use GitHub MCP operations when `gh` is unavailable, so remote
agents follow the same workflow and completion criteria rather than skipping GitHub work.

## Agent skills

### Private workspace and cross-device recovery

When handling private working documents, ignored project knowledge, credential recovery, or
cross-device setup, read [docs/agents/private-workspace.md](docs/agents/private-workspace.md).
`private/` is a separate private Git repository; keep its contents out of public outputs and the
outer repository's history. The reasoning is [ADR-0010](docs/adr/0010-private-workspace-is-a-separate-repository.md).

### Ending a session

`/end-session` is the close-out counterpart to `/ship`: it flushes what a session learned into
the per-project memory files, the private companion repository at `private/`, and GitHub issues, then
tidies the local workspace — files and artifacts, and, once the checkout is clean, the branches
themselves: returning to an up-to-date `main` (a `--ff-only` pull) and deleting local branches
already merged there, leaving pushed-but-unmerged branches alone. It records and tidies only —
it never commits, pushes, or opens a PR, and that fast-forward is the only history it moves, so
a finished branch still goes through `ship`. Source:
[.agents/skills/end-session/SKILL.md](.agents/skills/end-session/SKILL.md).

### Issue tracker

GitHub is the only tracker: this repo's Issues, the private
[project board](https://github.com/users/jwh3times/projects/9) that views them and the private
companion's issues together, and draft security advisories for unpublished vulnerabilities. Each
live action has exactly one canonical issue, and **no Markdown file in either repository is a
backlog, a roadmap, or a status report** — anything that would need editing to stay true as work
progresses belongs on an issue. `docs/research/` is for standing research that backs a live
decision, never an assessment of what work remains.

Work them through the `gh` CLI (or the GitHub MCP tools where `gh` is unavailable). The
destination table, the board's Status/Gate/Area fields, the conventions, the triage label vocabulary
(`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`), and the
sub-issue/blocking mechanics are all in `docs/agents/issue-tracker.md`.

### Domain docs

Single-context — one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
