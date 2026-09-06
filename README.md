# Caitlyn Holland — Personal Website

Personal website for Caitlyn Holland, live at **[caitlyn.holland.vip](https://caitlyn.holland.vip)**.

A single-page site (Hero → About → Skills → Experience → Contact) built as a fully static export — no backend, no API routes, no server components at runtime. Everything is pre-rendered to HTML and served from the edge.

## Tech stack

- **[Next.js 16](https://nextjs.org/)** (App Router, `output: "export"` static export)
- **[React 19](https://react.dev/)** + **TypeScript 7** (`strict`)
- **[Tailwind CSS v4](https://tailwindcss.com/)** with semantic CSS custom-property theme tokens and utilities, compiled through Next.js/Turbopack by `@tailwindcss/webpack`
- **[next-themes](https://github.com/pacocoursey/next-themes)** for dark/light mode (system default)
- **[lucide-react](https://lucide.dev/)** icons
- Tooling: **Oxlint** (native React/TypeScript rules plus one Next.js compatibility bridge) · **Prettier** · **Vitest** (unit) · **Playwright** (e2e)
- Hosting: **Cloudflare Pages**

## Getting started

Requires **Node 26** and **npm 11**. The repository's `devEngines` policy rejects npm commands
under a different major-version toolchain so an older npm cannot silently rewrite lockfile
metadata; see [`.nvmrc`](.nvmrc) and
[`package.json`](package.json).

```bash
nvm use          # or install Node 26 with npm 11
npm ci           # install exact dependencies
npm run dev      # start the dev server at http://localhost:3000
```

## Commands

| Command                                           | Description                                                                                                                       |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`                                     | Start the dev server at <http://localhost:3000>                                                                                   |
| `npm run build`                                   | Production build → static export in `./out`                                                                                       |
| `npm run preview`                                 | Serve a completed `./out` export locally (run `npm run build` first)                                                              |
| `npm run benchmark:tailwind -- --variant=<label>` | Measure Tailwind build/dev performance; see the [method and recorded results](docs/research/tailwind-webpack-nextjs-benchmark.md) |
| `npm run lint`                                    | Oxlint                                                                                                                            |
| `npm run lint:fix`                                | Oxlint with safe autofixes                                                                                                        |
| `npm run format`                                  | Prettier write                                                                                                                    |
| `npm run format:check`                            | Prettier check (used in CI)                                                                                                       |
| `npm run sync:ai`                                 | Regenerate the AI-tool config mirrors                                                                                             |
| `npm run sync:main`                               | Switch the public and optional private repositories to `main` and fast-forward from `origin/main`                                 |
| `npm run bootstrap:private`                       | Install the optional private companion; see the [owner recovery runbook](docs/agents/private-workspace.md)                        |
| `npm run test:unit`                               | Vitest unit/component tests                                                                                                       |
| `npm run coverage`                                | Vitest with coverage (fails below 80%)                                                                                            |
| `npm test`                                        | Playwright e2e tests (auto-starts the dev server)                                                                                 |
| `npm run test:ui`                                 | Playwright interactive UI                                                                                                         |

Run a single e2e file or a single browser project:

```bash
npx playwright test tests/e2e/homepage.spec.ts
npx playwright test --project=chromium
```

To inspect the production export locally, run `npm run build` and then `npm run preview`.
Preview uses the local `serve` dependency installed by `npm ci` from the lockfile. The
preview server serves static content only; it does not apply Cloudflare's [`public/_headers`](public/_headers).
The post-deploy smoke workflow remains the source of truth for deployed-header validation.

To evaluate a hash-based script policy against a completed export, run `npm run benchmark:csp`
after building. It tests Chromium, Firefox, and WebKit with candidate HTTP headers without changing
production policy; see the [CSP measurements and hosting constraints](docs/research/static-export-hash-csp.md).

## Project structure

```text
app/          App Router: layout, page, globals.css, error / loading / not-found
components/   Navigation, Footer, mode-toggle, theme-provider
  sections/   HeroSection, AboutSection, SkillsSection, ExperienceSection, ContactSection
  ui/         button and CTA link primitives
lib/          shared profile facts, Person structured data, utils (cn helper)
public/       _headers, manifest, robots, icons
tests/        Test suites
  unit/       Vitest unit/component tests (mirrors the source tree)
  e2e/        Playwright end-to-end specs
```

## Testing

Two disjoint suites:

- **Unit / component** — Vitest + Testing Library + jsdom in [`tests/unit/`](tests/unit/). An **80% coverage gate** (lines/functions/branches/statements) is enforced and blocks merges.
- **End-to-end** — Playwright in [`tests/e2e/`](tests/e2e/), covering homepage rendering, navigation, theme toggle and persistence across reloads, mobile menu, SEO metadata and Person JSON-LD, and WCAG 2.1 A/AA accessibility audits for the default page, open mobile disclosure, and dark theme. Theme tests use a deterministic light system color scheme and verify the restored theme and accessible toggle state. CI runs the desktop Chromium and Mobile Chrome (Pixel 5) projects with one worker; locally all five browser/device projects run.

## Deployment

Cloudflare Pages builds from the repo on every push to `main` (build command `npm run build`, output dir `out`, Node version from `.nvmrc`). Security headers are served from [`public/_headers`](public/_headers); its CSP intentionally allows inline scripts for `next-themes`' pre-paint theme script because a static export cannot issue per-request nonces. CI ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) validates format, coverage, build/lint, e2e, and AI-tool config parity on every PR, plus (PR-only) that [`CHANGELOG.md`](CHANGELOG.md) names the version the merge will mint. CodeQL scans JavaScript/TypeScript and Actions through GitHub's default setup, which is why there is no `codeql.yml` in the repo. A separate [post-deploy smoke workflow](.github/workflows/smoke.yml) validates the live homepage and a missing-page response, significant security-header values on both, and HTTP 200 responses from sitemap and robots. It runs daily and manually, and on pushes to `main` after the official Cloudflare Pages check succeeds for that commit. This monitors a completed deployment; it does not gate deployment.

The deployed-site checker can also be run directly with `node scripts/smoke.mjs`; it uses only
Node built-ins and requires no dependency install. When changing header policy or deployment
monitoring, keep the acceptance rules and fixtures in
[`tests/unit/scripts/smoke.test.ts`](tests/unit/scripts/smoke.test.ts) aligned.

Every merge to `main` is also tagged and published as a GitHub Release by
[`version.yml`](.github/workflows/version.yml) using `v<major>.<minor>.<build>`
SemVer tags. Build values auto-increment per major/minor line, and a new line
starts at whatever build the `package.json` floor names.

## Contributing

Bug reports, accessibility fixes, and small improvements are welcome — see
[CONTRIBUTING.md](CONTRIBUTING.md) for the workflow and local checks. By participating you agree to
the [Code of Conduct](CODE_OF_CONDUCT.md). Report vulnerabilities privately per
[SECURITY.md](SECURITY.md). Developer conventions live in [AGENTS.md](AGENTS.md) (Claude Code reads them via an `@AGENTS.md` import in [CLAUDE.md](CLAUDE.md)).

## Owner recovery

Authorized maintainers setting up another computer should follow the public-safe
[private workspace recovery runbook](docs/agents/private-workspace.md). Repository locators and
credentials are retrieved from 1Password and are not recorded here.

## License

[MIT](LICENSE) © Caitlyn Holland
