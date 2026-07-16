# AGENTS.md

This file provides guidance to coding agents working in this repository.

## Project Overview

This is a personal website for Caitlyn Holland built with Next.js 16 App Router,
React 19, TypeScript, and Tailwind CSS v4. The site is configured for static
export with `output: "export"` in `next.config.ts`: production builds output to
`./out/` and deploy to Cloudflare Pages at `caitlyn.holland.vip`.

There is no backend, no API routes, and no server-side rendering. Everything is
client-side or statically rendered. Security headers are served from
`public/_headers`.

Tailwind v4 is loaded via `@import "tailwindcss"` in `app/globals.css` and is
configured entirely in CSS through custom properties and utility classes. There
is no `tailwind.config.ts`.

## Commands

Use the Node version pinned in `.nvmrc`; run `nvm use` when your environment
supports it.

### Development

```bash
npm run dev          # Start dev server at http://localhost:3000
npm run build        # Build production static export into ./out
npm run lint         # ESLint
npm run format       # Prettier write
npm run format:check # Prettier check; CI runs this
```

### Unit Tests

Unit and component tests use Vitest + Testing Library. They live in `test/`
singular, mirroring the source tree (`test/app/`, `test/components/`,
`test/lib/`). Vitest runs in jsdom with `vitest.setup.ts`.

Coverage uses V8 and is gated at 80% for statements, branches, functions, and
lines in `vitest.config.ts`. `app/layout.tsx` and
`components/sections/index.ts` are excluded because Playwright covers them.

```bash
npm run test:unit        # Run unit tests once
npm run test:unit:watch  # Watch mode
npm run coverage         # Run with V8 coverage and enforce thresholds
```

### End-to-End Tests

Playwright specs live in `tests/` plural. `playwright.config.ts` starts the dev
server automatically by running `npm run dev` on `localhost:3000`.

```bash
npm test              # Run all Playwright tests; alias for npm run test:e2e
npm run test:ui       # Playwright interactive UI
npm run test:headed   # Headed browser
npm run test:debug    # Debug Playwright tests

npx playwright test tests/homepage.spec.ts
npx playwright test --project=chromium
```

E2E coverage includes homepage rendering, navigation, theme toggling, the mobile
menu, and SEO metadata. Local runs cover all configured browser/device projects;
CI runs Chromium only.

## CI/CD

- `.github/workflows/ci.yml` runs on push and PR to `main` with five jobs:
  `Format Check`, `Coverage`, `Build & Lint`, `Playwright Tests`, and
  `Changelog Version`.
- `Format Check` runs `npm run format:check`; formatting drift fails CI.
- `Coverage` runs `npm run coverage`, enforces the 80% thresholds, and uploads a
  `coverage-report` artifact.
- `Build & Lint` runs `npm run lint` and `npm run build`, then uploads the
  `static-site` artifact.
- `Playwright Tests` depends on `Build & Lint`, installs Chromium, and runs
  `npm run test:e2e -- --project=chromium`.
- `Changelog Version` runs on pull requests only. It computes the version the
  merge will mint via `scripts/next-version.sh` and fails if `CHANGELOG.md` has
  no `## [x.y.z]` section for it. Dependabot PRs are exempt; the `ship` skill
  backfills their entries on the next human ship.
- `.github/workflows/dependency-review.yml` runs on PRs and fails on vulnerable
  dependency changes.
- `.github/workflows/version.yml` tags every merge to `main` and creates a
  GitHub Release using standard SemVer `v<major>.<minor>.<build>`, such as
  `v1.2.7`. It computes the build number with `scripts/next-version.sh` — the
  same script the `Changelog Version` guard and the `ship` skill use, so the tag
  minted always matches the version the changelog was written for. The
  `package.json` `version` is the major/minor/build floor. For an existing
  major/minor line, the workflow increments from the highest matching tag. For a
  new major/minor line, `x.y.0` is valid and is tagged as `v<x.y>.0` when that
  tag does not already exist.
- Cloudflare Pages deploys directly from the repo on push to `main` with build
  command `npm run build`, output directory `out`, and Node version from
  `.nvmrc`. There is no deploy workflow in this repo.

Run `npm run format` before committing changes.

## Architecture

`app/page.tsx` composes the single-page layout from `Navigation`, `HeroSection`,
`AboutSection`, `ContactSection`, and `Footer`. Page sections live in
`components/sections/` and are re-exported from
`components/sections/index.ts`. Section `id` anchors (`#about`, `#contact`)
must match navigation links in `components/navigation.tsx`.

Static export constraints:

- Do not add API routes or server-only behavior.
- Do not use `getServerSideProps`.
- Keep images compatible with static export; `next.config.ts` sets images to
  `unoptimized`.
- All routes must be known at build time.
- Do not depend on runtime environment variables.
- Keep security headers in `public/_headers`; `headers()` in `next.config.ts`
  is ignored by static export.

## Theme System

`next-themes` drives dark and light mode. `ThemeProvider` wraps the app in
`app/layout.tsx`, and `<html>` uses `suppressHydrationWarning`.

The theme toggle lives in `components/mode-toggle.tsx` and uses a
`useSyncExternalStore` mounted guard. Any component that reads `useTheme()` must
render server-matching fallback UI until mounted because `next-themes` reads
`localStorage` on the client.

CSS variables in `app/globals.css` define color tokens for both themes. Use
semantic utility classes such as `text-heading`, `text-muted`, `text-label`,
`card-bg-blue`, and related project utilities instead of raw Tailwind color
classes so dark mode works automatically.

## Styling Conventions

- Use Tailwind v4 syntax with `@import "tailwindcss"`, not v3 `@tailwind`
  directives.
- Prefer the custom utilities in `app/globals.css` for themed colors,
  gradients, glass effects, section surfaces, and the fade-in animation.
- Preserve the `prefers-reduced-motion: reduce` behavior that neutralizes
  animations and transitions.
- Compose class names with `cn()` from `lib/utils.ts` (`clsx` +
  `tailwind-merge`). Do not use raw string concatenation for conditional class
  composition.
- Use `lucide-react` for UI icons.

## Development Patterns

- Put new reusable primitives in `components/ui/`.
- Put new page sections in `components/sections/` and re-export them from the
  index barrel.
- Add `"use client"` only where client interactivity is required.
- Use semantic CSS-variable classes; do not hardcode colors.
- New components generally need matching tests under `test/`, mirroring the
  source path, because CI gates unit coverage at 80%.
- Site metadata lives in the `Metadata` export in `app/layout.tsx`; Playwright
  asserts SEO metadata.

## Docs Automation

The Claude docs-updater subagent is configured at
`.claude/agents/docs-updater.md` to keep `CLAUDE.md` and `README.md` in sync
with code changes. It is invoked by the `ship` skill
(`.claude/skills/ship/SKILL.md`) when a branch is shipped, scoped to that
branch's diff — docs are refreshed at ship time rather than after every response
turn. Say "ship it" when a branch is ready for review.

When changing behavior, commands, architecture, CI, or docs automation, update
`CLAUDE.md`, `AGENTS.md`, and `README.md` as appropriate so agent instructions
do not diverge.
