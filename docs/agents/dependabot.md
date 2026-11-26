# Dependabot

What reviewing a Dependabot pull request takes here, read by the shared `dependabot` skill. What CI
runs and what the ruleset requires are in `AGENTS.md` ("CI/CD"); merging is in
[`merging.md`](./merging.md).

## Stack

- A Next.js 16 (App Router) and React 19 site, built as a static export (`output: "export"` in
  `next.config.ts`) to `out/`, which Cloudflare Pages builds with `npm run build` and deploys
  (ADR-0001). There is no backend, API route, database, Dockerfile or container image.
- Tailwind CSS v4, CSS-first (`@import "tailwindcss"` in `app/globals.css`), compiled through the
  `@tailwindcss/webpack` loader in `next.config.ts`'s Turbopack `*.css` rule. There is no PostCSS
  configuration and no `tailwind.config.ts`.
- Oxlint lints (`.oxlintrc.json`), loading `@next/eslint-plugin-next` as a JS plugin; ESLint is
  only that plugin's transitive dependency. TypeScript 7; `next build` type-checks with the
  project-local TypeScript CLI.
- Tests: Vitest with Testing Library under `tests/unit/` (`npm run coverage`, 80% thresholds in
  `vitest.config.ts`), and Playwright under `tests/e2e/` (`npm run test:e2e`).
- `.github/dependabot.yml` updates npm and GitHub Actions at `/` only. npm majors travel in five
  groups: `next-ecosystem` (`next`, `@next/*`), `react` (`react`, `react-dom`, `@types/react`,
  `@types/react-dom`), `testing-library` (`@testing-library/*`), `vite-ecosystem` (`vite`,
  `vitest`, `@vitejs/plugin-react`, `@vitest/*`) and `lint-and-typescript` (`oxlint`,
  `typescript`); every other major arrives alone. Minor and patch bumps go to
  `npm-minor-and-patch`, and actions to `actions-minor-and-patch`.
- Required checks (`AGENTS.md`): the six `ci.yml` jobs (`Format Check`, `Coverage`,
  `Build & Lint`, `Playwright Tests`, `AI Config Parity`, `Changelog Version`), `CodeQL` and
  `Dependency Review`. The `Cloudflare Pages` check also reports on the PR.

## Resolution

```bash
nvm install "$(cat .nvmrc)" && nvm use "$(cat .nvmrc)"   # Node 26, the latest 26.x
npm --version                                            # must be 11.x or 12.x
npm ci
```

At the root, as every `ci.yml` job runs it after `actions/setup-node` with
`node-version-file: ".nvmrc"`. `.nvmrc` names only the major. `devEngines` in `package.json` fails
`npm ci` and `npm run` before they start unless Node is `26.x` and npm is `11.x || 12.x`; Node 26
bundles npm 11, which CI and Cloudflare Pages use, and both lines write the same lockfile
(ADR-0007).

## Where to look

- `.github/workflows/ci.yml` and `dependency-review.yml`, which run on PRs: the `with:` inputs of
  `actions/checkout`, `actions/setup-node`, `actions/upload-artifact`, `actions/cache` and
  `actions/dependency-review-action` (`fail-on-severity: high`). `version.yml` and `smoke.yml` run
  only on `main`, on a schedule or by hand; `actions/create-github-app-token` appears only in
  `version.yml`. Every action is pinned to a commit SHA with its version in a trailing comment.
- `next.config.ts`: `output: "export"`, `images.unoptimized`, `agentRules: false`, and the
  Turbopack rule that loads `@tailwindcss/webpack`.
- `app/globals.css`: the Tailwind `@import`, the class-based `@custom-variant dark`, and the
  `@layer` blocks of theme tokens and utilities.
- `.oxlintrc.json`: the rule set, and `jsPlugins` loading `@next/eslint-plugin-next` for
  `nextjs-js/no-location-assign-relative-destination`.
- `tests/unit/tailwind-config.test.ts` and `tests/unit/toolchain-config.test.ts`: unit tests that
  assert on `package.json` and, for Tailwind, `package-lock.json`, so a dependency change alone can
  fail `Coverage`.
- `public/_headers` and `scripts/validate-export-headers.mjs`, which `npm run build` runs after
  `next build`; `benchmarks/hash-csp.mjs` (`npm run benchmark:csp`), which drives Playwright's
  browsers and `jsdom`.
- `vitest.config.ts`, `vitest.setup.ts`, `playwright.config.ts`, `tsconfig.json`, `.prettierrc`.
- `package.json`: `devEngines`, and `overrides.compression`, which holds `serve`'s `compression` at
  `1.8.2` until a `serve` release depends on `compression >= 1.8.2` (`AGENTS.md`).
- Source: `app/`, `components/`, `lib/`.

## Grounding facts

- The site renders to static HTML at build time and no server runs in production (ADR-0001,
  `next.config.ts`). Server components exist, but render during `next build`. A break confined to
  the Next.js runtime server (server actions, middleware or proxy, route handlers, ISR and
  caching, the image optimization server, `headers()`) does not reach this repository. A Next.js or
  React major is NEEDS EFFORT only when a cited change reaches static export, build-time rendering,
  a client API the code imports, a `next.config.ts` option or the build itself.
- `@types/node` and the Node pin move together (ADR-0007). `tests/unit/toolchain-config.test.ts`
  requires the `@types/node` major to equal `.nvmrc`'s and `devEngines.runtime.version` to be
  `<that major>.x`, so an `@types/node` major on its own fails `Coverage`, and it is takeable only
  with a decision to move the runtime.
- `@tailwindcss/webpack` depends on `tailwindcss` at its own exact version (`package-lock.json`),
  and `tests/unit/tailwind-config.test.ts` requires the lockfile to resolve both to one version
  with no second, nested `tailwindcss`. Their `package.json` ranges may differ: a grouped bump
  that raises only the loader's range passes while the lockfile resolves both to its version.
  `.github/dependabot.yml` has no major group for them, so a Tailwind major arrives as two PRs,
  each red alone: either one by itself resolves the two to different majors and nests a second
  `tailwindcss`.
- `@vitest/coverage-v8` hard-peers on `vitest` at its exact version, and `@vitejs/plugin-react` on
  `vite` `^8.0.0` (`package-lock.json`).
- `next` hard-peers on `react` and `react-dom` `^18.2.0 || ^19.0.0`, as `next-themes`,
  `lucide-react` and `@testing-library/react` do on ranges ending at 19 (`package-lock.json`): a
  React major outside them is blocked until each widens.
- ESLint is not a direct dependency, so Dependabot opens no ESLint PR; a major of it reaches the
  tree only through `@next/eslint-plugin-next`.
- Every job runs on `ubuntu-latest`. A PR's CI never runs `version.yml` or `smoke.yml`.

## Playbook

- **`@types/node` major:** NEEDS EFFORT until the user decides to move the runtime. Taking it means
  `.nvmrc`, `devEngines.runtime.version` and `@types/node` in one change, then every gate,
  including Cloudflare Pages building on the new Node.
- **Next.js major** (`next-ecosystem` group): read the upgrade guide for each major crossed, then
  check `next.config.ts`'s options and static-export support, and that the
  `@next/eslint-plugin-next` rule `.oxlintrc.json` loads still exists. Gates: `npm run lint`,
  `npm run build` (type-checks, emits `out/`, and validates `out/_headers`), `npm run coverage`.
- **React major** (`react` group): the peers above first, then `npm run coverage` and
  `npm run build`.
- **Tailwind major:** review both PRs together, against `app/globals.css`, the `next.config.ts`
  loader rule and `docs/research/tailwind-webpack-nextjs-benchmark.md`. Gates: `npm run coverage`,
  `npm run build`.
- **`oxlint` or `typescript` major** (`lint-and-typescript` group): `npm run lint`,
  `npx tsc --noEmit`, `npm run build`.
- **Vitest or Vite major** (`vite-ecosystem` group): the peers above, then `npm run coverage`.
- **Playwright** (`@playwright/test`, `@axe-core/playwright`), as CI runs them:

  ```bash
  npm run build
  npx playwright install --with-deps chromium
  npm run benchmark:csp -- --policy=compatibility --browsers=chromium
  npm run test:e2e -- --project=chromium --project="Mobile Chrome"
  ```

  Where this machine cannot install the browser, CI's `Build & Lint` and `Playwright Tests` are
  the evidence.

- **GitHub Actions major:** CI is the gate for `ci.yml` and `dependency-review.yml`; read the
  inputs `version.yml` and `smoke.yml` use by hand. A Node-runtime or runner-version bump alone is
  not a break. NEEDS EFFORT only when a removed or renamed input, or a changed default, reaches a
  `with:` use; name the step.
