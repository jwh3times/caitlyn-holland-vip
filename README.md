# Caitlyn Holland — Personal Website

Personal website for Caitlyn Holland, live at **[caitlyn.holland.vip](https://caitlyn.holland.vip)**.

A single-page site (Hero → About → Contact) built as a fully static export — no backend, no API routes, no server components at runtime. Everything is pre-rendered to HTML and served from the edge.

## Tech stack

- **[Next.js 16](https://nextjs.org/)** (App Router, `output: "export"` static export)
- **[React 19](https://react.dev/)** + **TypeScript 7** (`strict`)
- **[Tailwind CSS v4](https://tailwindcss.com/)** with CSS custom-property theme tokens
- **[next-themes](https://github.com/pacocoursey/next-themes)** for dark/light mode (system default)
- **[lucide-react](https://lucide.dev/)** icons
- Tooling: **Oxlint** (native React/TypeScript rules plus one Next.js compatibility bridge) · **Prettier** · **Vitest** (unit) · **Playwright** (e2e)
- Hosting: **Cloudflare Pages**

## Getting started

Requires **Node 24** (see [`.nvmrc`](.nvmrc)).

```bash
nvm use          # or install Node 24
npm ci           # install exact dependencies
npm run dev      # start the dev server at http://localhost:3000
```

## Commands

| Command                | Description                                       |
| ---------------------- | ------------------------------------------------- |
| `npm run dev`          | Start the dev server at <http://localhost:3000>   |
| `npm run build`        | Production build → static export in `./out`       |
| `npm run lint`         | Oxlint                                            |
| `npm run lint:fix`     | Oxlint with safe autofixes                        |
| `npm run format`       | Prettier write                                    |
| `npm run format:check` | Prettier check (used in CI)                       |
| `npm run sync:ai`      | Regenerate the AI-tool config mirrors             |
| `npm run test:unit`    | Vitest unit/component tests                       |
| `npm run coverage`     | Vitest with coverage (fails below 80%)            |
| `npm test`             | Playwright e2e tests (auto-starts the dev server) |
| `npm run test:ui`      | Playwright interactive UI                         |

Run a single e2e file or a single browser project:

```bash
npx playwright test tests/homepage.spec.ts
npx playwright test --project=chromium
```

## Project structure

```text
app/          App Router: layout, page, globals.css, error / loading / not-found
components/   Navigation, Footer, mode-toggle, theme-provider
  sections/   HeroSection, AboutSection, ContactSection
  ui/         button and CTA link primitives
lib/          shared profile facts, utils (cn helper)
public/       _headers, manifest, robots, icons
test/         Vitest unit/component tests (mirrors the source tree)
tests/        Playwright end-to-end specs
```

## Testing

Two disjoint suites:

- **Unit / component** — Vitest + Testing Library + jsdom in [`test/`](test/). An **80% coverage gate** (lines/functions/branches/statements) is enforced and blocks merges.
- **End-to-end** — Playwright in [`tests/`](tests/), covering homepage rendering, navigation, theme toggle, mobile menu, and SEO metadata. CI runs Chromium; locally all five browser/device projects run.

## Deployment

Cloudflare Pages builds from the repo on every push to `main` (build command `npm run build`, output dir `out`, Node version from `.nvmrc`). Security headers are served from [`public/_headers`](public/_headers). CI ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) validates format, coverage, build/lint, e2e, and AI-tool config parity on every PR, plus (PR-only) that [`CHANGELOG.md`](CHANGELOG.md) names the version the merge will mint.

Every merge to `main` is also tagged and published as a GitHub Release by
[`version.yml`](.github/workflows/version.yml) using `v<major>.<minor>.<build>`
SemVer tags. Build values auto-increment per major/minor line, and a new line
starts at whatever build the `package.json` floor names.

## Contributing

Bug reports, accessibility fixes, and small improvements are welcome — see
[CONTRIBUTING.md](CONTRIBUTING.md) for the workflow and local checks. By participating you agree to
the [Code of Conduct](CODE_OF_CONDUCT.md). Report vulnerabilities privately per
[SECURITY.md](SECURITY.md). Developer conventions live in [AGENTS.md](AGENTS.md) (Claude Code reads them via an `@AGENTS.md` import in [CLAUDE.md](CLAUDE.md)).

## License

[MIT](LICENSE) © Caitlyn Holland
