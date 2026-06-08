# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server at http://localhost:3000
npm run build        # Build for production (outputs to ./out as static export)
npm run lint         # ESLint
npm run format       # Prettier write
npm run format:check # Prettier check (used in CI)
npm test             # Run all Playwright e2e tests (auto-starts dev server)
npm run test:ui      # Playwright with interactive UI
npm run test:headed  # Run tests in headed browser
npm run test:debug   # Debug Playwright tests
```

Run a single test file:

```bash
npx playwright test tests/homepage.spec.ts
```

Run tests for a specific browser project:

```bash
npx playwright test --project=chromium
```

## Architecture

This is a **Next.js 16 static export** personal website (output: `"export"` in [next.config.ts](next.config.ts)). It builds to `./out/` and deploys to GitHub Pages. There is no backend, API routes, or server components — everything is client-side or statically rendered.

**Single-page layout:** `app/page.tsx` composes the full page from three sections (`HeroSection` → `AboutSection` → `ContactSection`) wrapped by `Navigation` and `Footer`. All sections are in [components/sections/](components/sections/) and exported via [components/sections/index.ts](components/sections/index.ts).

**Theme system:** `next-themes` drives dark/light mode. `ThemeProvider` wraps the app in [app/layout.tsx](app/layout.tsx). The toggle lives in `components/mode-toggle.tsx`. CSS variables in [app/globals.css](app/globals.css) define all color tokens for both themes — use these utility classes (`text-heading`, `text-muted`, `text-label`, `card-bg-blue`, etc.) rather than raw Tailwind color classes so dark mode works automatically.

**Styling conventions:**

- Tailwind v4 (`@import "tailwindcss"` syntax, not the v3 `@tailwind` directives)
- Custom CSS utilities defined in `globals.css` for themed colors, gradients (`.gradient-text`, `.gradient-text-blue`), glassmorphism (`.glass`), section backgrounds (`.section-surface`, `.section-surface-contrast`), and entrance animations (`.animate-fadeInUp`, `.animate-slideInLeft`, etc.)
- Icons: `lucide-react` for UI icons, `@tabler/icons-react` for social/brand icons

**Content placeholders:** `HeroSection` has `TODO` comments for tagline and bio — these are intentionally empty and need content filled in.

**CI/CD:** GitHub Actions runs lint + format check + build on every PR/push to main ([.github/workflows/ci.yml](.github/workflows/ci.yml)). Deploy to GitHub Pages triggers automatically after CI passes ([.github/workflows/deploy.yml](.github/workflows/deploy.yml)).

**Tests:** Playwright e2e tests in [tests/](tests/) cover homepage rendering, navigation, theme toggling, mobile menu, and SEO metadata. The `playwright.config.ts` auto-starts the dev server; tests run against `http://localhost:3000`. CI only runs Chromium; locally all five browser/device projects run.
