# Implementation Plan — Derived Backlog

- **Date:** 2026-07-03
- **Branch:** `claude/roadmap-implementation-plans-o9740c`
- **Status of source material:** **This repository has no roadmap or TODO document** (no
  `ROADMAP.md`, no `TODO.md`, no `private/` planning docs, no open GitHub issues referenced in the
  repo). The backlog below is therefore **derived entirely from code inspection** on this date —
  every item traces to something observable in the repo (a missing standard artifact, a CI gap
  versus the sibling `holland-vip` repo's documented workflow set, thin content/metadata, or a
  convention drift). Nothing here is an invented product feature; treat this file as a proposal,
  not an authoritative plan of record.

---

## 1. Latent-TODO inventory

A sweep for `TODO`, `FIXME`, `HACK`, and `XXX` across `app/`, `components/`, `lib/`, `test/`,
`tests/`, and `.github/` found **zero matches**. There are no latent work-item markers anywhere in
the codebase.

Observations that function as latent work items (with citations):

| # | Observation | Evidence |
| - | ----------- | -------- |
| O1 | No automated accessibility audit exists. E2E specs cover homepage, mobile nav, SEO, theme ([tests/homepage.spec.ts](../tests/homepage.spec.ts), [tests/mobile-navigation.spec.ts](../tests/mobile-navigation.spec.ts), [tests/seo.spec.ts](../tests/seo.spec.ts), [tests/theme.spec.ts](../tests/theme.spec.ts)) but there is no `a11y`/axe spec. The sibling `holland-vip` repo's test suite includes accessibility specs. The code has real a11y investment worth locking in — skip link ([app/layout.tsx](../app/layout.tsx) L75–80), mobile-menu focus trap + Escape handling ([components/navigation.tsx](../components/navigation.tsx) L22–52), `prefers-reduced-motion` block ([app/globals.css](../app/globals.css) L133–142). |
| O2 | No post-deploy check. `.github/workflows/` contains only `ci.yml`, `dependency-review.yml`, `version.yml`. The sibling `holland-vip` repo additionally runs a daily **smoke** workflow curling the live site (HTTP 200 + content + security headers). Nothing in this repo ever exercises the deployed `caitlyn.holland.vip`. |
| O3 | Site metadata is thin: `description: "Personal website for Caitlyn Holland."` and `keywords: ["Caitlyn Holland"]` ([app/layout.tsx](../app/layout.tsx) L13–14), and there is no JSON-LD structured data anywhere (no `application/ld+json` in the repo). |
| O4 | The About section carries four distinct content blocks — an `experience` array (4 roles), a 14-item `skills` array, Education, and Certifications — inside one component ([components/sections/AboutSection.tsx](../components/sections/AboutSection.tsx) L1–43, L60–115), while navigation exposes only two anchors (`#about`, `#contact` — [components/navigation.tsx](../components/navigation.tsx) L7–10). The content for dedicated Experience/Skills sections already exists in code; only the sectioning does not. |
| O5 | Raw Tailwind palette classes contradict the repo's own convention ("Use the semantic CSS-variable classes — never hardcode colors", [CLAUDE.md](../CLAUDE.md)): `border-blue-500 dark:border-blue-400` and `text-blue-700 dark:text-blue-300` in [components/sections/AboutSection.tsx](../components/sections/AboutSection.tsx) (L71, L85, L96, L108); `hover:text-blue-600 dark:hover:text-blue-400`, `border-gray-200/50 dark:border-gray-800/50`, `hover:bg-gray-100 dark:hover:bg-gray-800` in [components/navigation.tsx](../components/navigation.tsx) (L55, L68, L82, L97, L105); `focus:bg-blue-600` on the skip link in [app/layout.tsx](../app/layout.tsx) (L77); `border-gray-200 dark:border-gray-800` in [components/footer.tsx](../components/footer.tsx). The token set in [app/globals.css](../app/globals.css) currently defines only four text tokens + `--card-blue` — there are no accent/link/border tokens to migrate to. |
| O6 | CI runs the desktop `chromium` project only ([.github/workflows/ci.yml](../.github/workflows/ci.yml) L136). The sibling `holland-vip` CI runs `chromium` **and** `Mobile Chrome`. Mobile behavior is partially covered because [tests/mobile-navigation.spec.ts](../tests/mobile-navigation.spec.ts) forces a 375×812 viewport (L4), but no spec runs under real mobile-device emulation (touch, mobile UA) in CI. |
| O7 | `package.json` has `"start": "next start"`, which does **not** serve a static export (`output: "export"`), and there is no preview script for the built `out/` directory. The sibling `holland-vip` repo documents `npm run preview` (`npx serve out`) for exactly this reason. README's command table ([README.md](../README.md) L29–39) omits `start`, implicitly acknowledging it is misleading. |
| O8 | No CodeQL scanning is documented or configured. The sibling `holland-vip` repo documents CodeQL **default setup** (settings-side, deliberately no workflow file). This repo's CLAUDE.md/README mention no code scanning at all; whether default setup is enabled cannot be verified from the repo contents. |
| O9 | The CSP in [public/\_headers](../public/_headers) (L10) keeps `'unsafe-inline'` in `script-src` without a rationale comment. The sibling repo documents why (`next-themes` + Next inline scripts; no nonces on a static export). Same technical constraint applies here, but the reasoning is undocumented, inviting a well-meaning "tightening" that would break theming. |

---

## 2. Prioritized derived backlog

| Priority | Item | Traces to | Size |
| -------- | ---- | --------- | ---- |
| P1 | Add an automated accessibility audit (axe-core Playwright spec) | O1 | M |
| P2 | Add a post-deploy smoke workflow for the live site | O2 | S |
| P3 | Deepen SEO: richer description/keywords + JSON-LD `Person` structured data | O3 | S |
| P4 | Split Experience and Skills out of About into dedicated sections with nav anchors | O4 | M |
| P5 | Introduce accent/border color tokens and migrate raw palette classes | O5 | M |
| P6 | Run the `Mobile Chrome` Playwright project in CI (parity with sibling repo) | O6 | S |
| P7 | Add a static-export preview script and remove/neutralize the misleading `start` | O7 | S |
| P8 | Enable + document CodeQL default setup | O8 | S |
| P9 | Document the CSP `'unsafe-inline'` rationale in `_headers` | O9 | S |

Items P1–P7 get full plans below; P8–P9 get short outlines.

---

## 3. Detailed plans (top items)

### P1 — Automated accessibility audit (axe-core in Playwright)

**Objective & rationale.** Lock in the existing accessibility investment (skip link, focus trap,
`aria-expanded`/`aria-controls`/`aria-label` on the menu button, reduced-motion support) with an
automated WCAG 2.1 A/AA gate, so regressions fail CI instead of shipping. Evidence: O1 — the
groundwork exists but nothing asserts it holistically; the sibling repo's suite covers
accessibility and this one's does not.

**Current state.** E2E specs: [tests/homepage.spec.ts](../tests/homepage.spec.ts),
[tests/mobile-navigation.spec.ts](../tests/mobile-navigation.spec.ts),
[tests/seo.spec.ts](../tests/seo.spec.ts), [tests/theme.spec.ts](../tests/theme.spec.ts). No axe
dependency in [package.json](../package.json). Individual a11y features exist piecemeal in
[app/layout.tsx](../app/layout.tsx) and [components/navigation.tsx](../components/navigation.tsx).

**Design/approach.** Pure e2e concern — no app code changes, so all static-export constraints are
untouched. Use `@axe-core/playwright` (dev dependency; runs in the browser page, no runtime
dependency shipped). One new spec `tests/a11y.spec.ts` that, for the single page:

1. scans the default (light-resolved or system) render for WCAG 2.1 A/AA violations
   (`withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])`), asserting zero violations;
2. scans again with the mobile menu open (375×812 viewport, after clicking the menu button);
3. scans in dark mode (toggle via the existing mode-toggle button, as
   [tests/theme.spec.ts](../tests/theme.spec.ts) already does) — dark-theme contrast is the likely
   place a token tweak silently fails contrast.

Playwright specs live in `tests/` (not `test/` — that is the Vitest tree), so the Vitest 80%
coverage gate is unaffected.

**Step-by-step tasks.**
1. `npm i -D @axe-core/playwright` (updates [package.json](../package.json) +
   [package-lock.json](../package-lock.json); `dependency-review.yml` will vet it on the PR).
2. Create `tests/a11y.spec.ts` with the three scans above; follow the locator style of the
   existing specs (e.g. `button[aria-label="Open menu"]` from
   [tests/mobile-navigation.spec.ts](../tests/mobile-navigation.spec.ts)).
3. Fix any violations the first run surfaces (expected candidates: color-contrast on
   `text-muted`/gradient text — fix in [app/globals.css](../app/globals.css) tokens, never with
   raw colors).
4. Run `npm run format` (the Format Check job gates Prettier drift).

**Testing plan.** `npm run test:e2e -- --project=chromium tests/a11y.spec.ts` locally, then the
full local matrix (`npm test`) since WebKit/Firefox render differences can change contrast results.
CI needs no changes — the new spec is picked up by the existing Playwright job. Vitest coverage
unaffected (no source changes unless step 3 touches CSS, which is outside coverage collection).

**Docs updates.** CLAUDE.md "End-to-end (Playwright)" paragraph and README "Testing" section: add
accessibility to the list of covered areas.

**Risks.** Axe may flag pre-existing violations (notably `.gradient-text` contrast with
`-webkit-text-fill-color: transparent`, or `text-muted` at 46% lightness on `--muted` surfaces);
fixing them may require token adjustments that subtly change the visual design — review renders in
both themes. Axe versions can add rules over time, making the gate flaky-by-upgrade; pin the
dependency and upgrade deliberately.

**Size: M** (spec is small; remediation of first-run findings is the unknown).

---

### P2 — Post-deploy smoke workflow

**Objective & rationale.** Nothing currently verifies the *deployed* site — CI validates the build,
Cloudflare deploys independently, and a bad deploy (missing `_headers`, DNS/cert issue, blank page)
would go unnoticed. Evidence: O2 — workflow inventory is `ci.yml`, `dependency-review.yml`,
`version.yml` only; the sibling repo runs a daily `smoke.yml` against its live domain, and this
repo's CLAUDE.md explicitly notes "CI is a parallel quality gate, not a deploy gate."

**Current state.** [.github/workflows/](../.github/workflows/) has no workflow that touches
`https://caitlyn.holland.vip`. Security headers are defined in
[public/\_headers](../public/_headers) but never asserted post-deploy.

**Design/approach.** New `.github/workflows/smoke.yml`, modeled on the sibling repo: `on:
schedule` (daily cron, e.g. `17 8 * * *` — offset minutes to avoid top-of-hour congestion) +
`workflow_dispatch`. Single job, `permissions: contents: read`, no checkout needed beyond nothing
(pure `curl`). Steps assert, against `https://caitlyn.holland.vip`:

1. HTTP 200 on `/`;
2. expected content marker (e.g. `Caitlyn Holland` in the body — matches what
   [tests/homepage.spec.ts](../tests/homepage.spec.ts) asserts pre-deploy);
3. each security header from [public/\_headers](../public/_headers) is present
   (`strict-transport-security`, `content-security-policy`, `x-content-type-options`,
   `x-frame-options`, `referrer-policy`, `permissions-policy`) — this is the only place the
   `_headers` → Cloudflare delivery path can be verified;
4. `/sitemap.xml` and `/robots.txt` return 200 (they are build outputs of
   [app/sitemap.ts](../app/sitemap.ts) and [public/robots.txt](../public/robots.txt)).

Keep it `curl | grep -i` based — no npm install, so the workflow is fast and dependency-free.

**Step-by-step tasks.**
1. Create `.github/workflows/smoke.yml` with the cron + dispatch triggers and the four assertion
   steps (fail the job on any miss with a clear message).
2. Trigger once manually via `workflow_dispatch` to validate against the real site.

**Testing plan.** No Vitest/Playwright surface — validation is the manual `workflow_dispatch` run.
Run `npm run format` (Prettier formats YAML; the Format Check job runs `prettier --check .`).

**Docs updates.** CLAUDE.md CI/CD section: add a "Post-deploy smoke" bullet (mirroring the
sibling's phrasing: the only check that exercises the deployed site). README "Deployment"
paragraph: one sentence.

**Risks.** Scheduled workflows are disabled by GitHub after 60 days of repo inactivity — accept, or
note in the workflow comment. A Cloudflare transient could fail a daily run; add one retry
(`curl --retry 3`) to avoid noise. Header assertions must be case-insensitive.

**Size: S.**

---

### P3 — SEO depth: real description, keywords, and JSON-LD `Person`

**Objective & rationale.** The page has strong metadata *plumbing* (OpenGraph, Twitter card,
robots, sitemap, manifest, canonical-capable `metadataBase`) but placeholder-grade *content*:
`description: "Personal website for Caitlyn Holland."` and a single keyword. There is no structured
data at all. For a personal/professional site, a `Person` JSON-LD block and a descriptive snippet
are the highest-leverage SEO items available. Evidence: O3; the page itself already contains the
richer facts (role, employer, focus) in [components/sections/HeroSection.tsx](../components/sections/HeroSection.tsx) L14–22.

**Current state.** [app/layout.tsx](../app/layout.tsx) L7–55 holds the `Metadata` export; L13/L23/L36
repeat the thin description. No `application/ld+json` anywhere.
[tests/seo.spec.ts](../tests/seo.spec.ts) asserts the current metadata (per CLAUDE.md, "the SEO
Playwright spec asserts it") and must be updated in lockstep.

**Design/approach.** All build-time, fully compatible with static export:

- **Description** (used in `description`, `openGraph.description`, `twitter.description` — extract
  a `const siteDescription` to keep the three in sync): one sentence derived from the hero copy,
  e.g. "Caitlyn Holland — Software Engineering Manager at SAS, leading Platform Products DevOps
  and Integrated Quality." Content should be confirmed with the site owner (low-stakes default:
  proceed with hero-derived copy).
- **Keywords**: expand from the on-page skills/role facts (e.g. "Software Engineering Manager",
  "SAS", "Test Automation", "DevOps") — only terms already on the page.
- **JSON-LD**: a `Person` object (`name`, `url`, `jobTitle`, `worksFor` → `Organization` "SAS",
  `alumniOf` → Meredith College, `sameAs` → the LinkedIn URL already in
  [components/sections/ContactSection.tsx](../components/sections/ContactSection.tsx) L20) rendered
  in the root layout via `<script type="application/ld+json" dangerouslySetInnerHTML=…>` with a
  serialized constant. CSP compatibility: `script-src 'unsafe-inline'` in
  [public/\_headers](../public/_headers) already permits inline scripts (and JSON-LD is inert
  data regardless). Note [vitest.config.ts](../vitest.config.ts) excludes `app/layout.tsx` from
  coverage — if the JSON-LD object is defined in a small helper (e.g. `lib/structured-data.ts`)
  it becomes unit-testable and keeps layout.tsx thin; prefer that.

**Step-by-step tasks.**
1. Create `lib/structured-data.ts` exporting the typed `Person` object and a
   `personJsonLd()` serializer.
2. Edit [app/layout.tsx](../app/layout.tsx): extract `siteDescription`, apply to the three
   description fields; expand `keywords`; render the JSON-LD `<script>` in `<head>` (Next places
   `metadata` head content automatically; the script tag can sit at the top of `<body>` or via the
   layout JSX — Google parses either).
3. Add `test/lib/structured-data.test.ts` (mirrors source path per convention): assert shape,
   `@context`/`@type`, URL, and that serialization is valid JSON.
4. Update [tests/seo.spec.ts](../tests/seo.spec.ts): new description assertions + a check that
   `script[type="application/ld+json"]` exists and parses with `@type: "Person"`.
5. `npm run format`.

**Testing plan.** `npm run coverage` (new `lib/` file needs its unit test to hold the 80% gate);
`npx playwright test tests/seo.spec.ts` for the updated spec; validate the emitted JSON-LD with
Google's Rich Results test after deploy (manual, post-merge).

**Docs updates.** CLAUDE.md "Site metadata lives in…" bullet: mention the JSON-LD helper in
`lib/structured-data.ts`. README project-structure block: `lib/` line gains the helper.

**Risks.** Personal-fact accuracy (job title, employer) must match reality — source only from
on-page copy and confirm with the owner. Keep description ≤ ~160 chars for snippet display.
`dangerouslySetInnerHTML` with a build-time constant is safe (no user input), but serialize with
`JSON.stringify` and avoid `</script>` sequences.

**Size: S.**

---

### P4 — Split Experience and Skills into dedicated sections

**Objective & rationale.** The About section currently carries four content blocks (bio,
4-role experience timeline, education + certifications, 14 skills) in one dense two-column
component, while the nav offers only About/Contact. Splitting Experience and Skills into their own
sections improves scannability, gives the nav meaningful anchors, and mirrors the proven structure
of the sibling site (Hero → About → Skills → Experience → … → Contact). Evidence: O4 — the data
arrays already exist in [components/sections/AboutSection.tsx](../components/sections/AboutSection.tsx)
L1–43; this is re-sectioning existing content, not inventing product features.

**Current state.** Sections: `HeroSection`, `AboutSection`, `ContactSection` in
[components/sections/](../components/sections/), barrel [components/sections/index.ts](../components/sections/index.ts),
composed in [app/page.tsx](../app/page.tsx) L11–13. Nav links in
[components/navigation.tsx](../components/navigation.tsx) L7–10. Section backgrounds alternate via
`.section-surface` (About) and `.section-surface-contrast` (Contact) per
[app/globals.css](../app/globals.css) L70–82. Unit tests exist per component under
[test/components/sections/](../test/components/sections/); e2e specs assert section presence and
nav behavior.

**Design/approach.** Honors all repo constraints — server components (no `"use client"` needed;
these are static), semantic classes only, `cn()` for any conditional classes, barrel re-export:

- New `components/sections/ExperienceSection.tsx` (`id="experience"`): move the `experience`
  array + the timeline markup (the `border-l-2` timeline style — see P5 for tokenizing the border
  color; if P5 lands first, use the new token class).
- New `components/sections/SkillsSection.tsx` (`id="skills"`): move the `skills` array + pill
  markup (`card-bg-blue` pills).
- `AboutSection` keeps the bio paragraph plus Education & Certifications (or move those to
  Experience — default: keep in About to preserve a balanced section length; low-stakes, state and
  proceed).
- Render order in [app/page.tsx](../app/page.tsx): Hero → About → Skills → Experience → Contact
  (sibling-site order). Re-alternate `section-surface` / `section-surface-contrast` so adjacent
  sections still alternate (About `surface`, Skills `surface-contrast`, Experience `surface`,
  Contact `surface-contrast` — Contact keeps its current class).
- Nav: add `{ href: "#skills", label: "Skills" }` and `{ href: "#experience", label: "Experience" }`
  to `navLinks` — both desktop and mobile menus render from that array, so one edit covers both.

**Step-by-step tasks.**
1. Create `components/sections/ExperienceSection.tsx` and `components/sections/SkillsSection.tsx`
   (content lifted verbatim from AboutSection; each gets an `h2` and section `id`).
2. Slim [components/sections/AboutSection.tsx](../components/sections/AboutSection.tsx) to bio +
   Education/Certifications; fix its grid to a single centered column or two-column
   Education/Certifications split.
3. Re-export both from [components/sections/index.ts](../components/sections/index.ts).
4. Update [app/page.tsx](../app/page.tsx) composition and section-surface alternation.
5. Update `navLinks` in [components/navigation.tsx](../components/navigation.tsx).
6. Add `test/components/sections/ExperienceSection.test.tsx` and `SkillsSection.test.tsx`
   (mirroring existing section tests: renders heading, renders each role/skill, correct `id`);
   update `AboutSection.test.tsx` and `test/app/page.test.tsx` (section composition) and
   `test/components/navigation.test.tsx` (link count/labels).
7. Update e2e: [tests/homepage.spec.ts](../tests/homepage.spec.ts) (section visibility/order) and
   [tests/mobile-navigation.spec.ts](../tests/mobile-navigation.spec.ts) if it asserts link counts.
8. `npm run format`.

**Testing plan.** `npm run coverage` — two new components must carry tests to hold 80% on
statements/branches/functions/lines (the barrel stays excluded per
[vitest.config.ts](../vitest.config.ts)). Full local Playwright run (`npm test`) because anchor
scrolling and the sticky glass nav are viewport-sensitive; CI covers chromium.

**Docs updates.** CLAUDE.md "Single-page layout" paragraph (section list + anchors) and README
line 5 ("Hero → About → Contact") + project-structure block. The docs-updater Stop hook will flag
these if missed.

**Risks.** Purely presentational, but anchor renames/additions affect the SEO/homepage specs and
any external deep links (`#about` and `#contact` are preserved — only additions). Section-surface
alternation is easy to get visually wrong in dark mode — check both themes.

**Size: M.**

---

### P5 — Accent/border color tokens; migrate raw palette classes

**Objective & rationale.** The repo's stated convention is "use the semantic CSS-variable classes —
never hardcode colors," yet interactive accents and borders are raw Tailwind palette classes with
manual `dark:` variants scattered across five files (O5). Every future theme adjustment must chase
those call sites; a token migration makes dark mode automatic and removes per-call-site `dark:`
noise, matching how the four existing text tokens already work.

**Current state.** Token set in [app/globals.css](../app/globals.css): `--heading-text`,
`--subheading-text`, `--label-text`, `--muted-text`, `--card-blue`, plus surfaces. Raw-color call
sites: [components/navigation.tsx](../components/navigation.tsx) (hover blues, gray borders, gray
hover backgrounds — L55, L68, L82, L97, L105), [components/sections/AboutSection.tsx](../components/sections/AboutSection.tsx)
(timeline `border-blue-500 dark:border-blue-400` ×3, pill text `text-blue-700 dark:text-blue-300`),
[app/layout.tsx](../app/layout.tsx) skip link (`focus:bg-blue-600`, `focus:ring-blue-400`),
[components/footer.tsx](../components/footer.tsx) (`border-gray-200 dark:border-gray-800`).

**Design/approach.** Extend the existing pattern in [app/globals.css](../app/globals.css) —
HSL triplet variables in `:root`/`.dark`, utility classes in `@layer utilities`:

- `--accent` (light: blue-600-ish `221 83% 53%`; dark: blue-400-ish `213 94% 68%`) →
  `.text-accent`, `.bg-accent`, `.border-accent`, and a `.hover:text-accent` companion (Tailwind
  v4 variants work on custom utilities: `hover:text-accent` composes automatically since the
  utility is a plain class — define just `.text-accent` and use `hover:text-accent` via
  `@utility` if needed; verify against Tailwind v4 docs during implementation).
- `--badge-blue-text` (light: blue-700; dark: blue-300) → `.text-badge-blue` — this deliberately
  adopts the sibling repo's naming (`--badge-blue-text` / `.text-badge-blue`), keeping the two
  codebases' vocabularies aligned.
- `--border-subtle` (light: gray-200; dark: gray-800) → `.border-subtle`; the nav's `/50` alpha
  variant can be a second token or `color-mix()`/`hsl(var(--border-subtle) / 0.5)` usage.
- `--surface-hover` (light: gray-100; dark: gray-800) → `.bg-surface-hover` for the nav hover
  backgrounds.

Then migrate the call sites, dropping the `dark:` duplicates. Keep `cn()` composition untouched.
No behavior change intended — this is a refactor with pixel-identical output in both themes.

**Step-by-step tasks.**
1. Add the variables + utilities to [app/globals.css](../app/globals.css) (both `:root` and
   `.dark` blocks).
2. Migrate [components/sections/AboutSection.tsx](../components/sections/AboutSection.tsx)
   (timeline borders → `border-accent` or `border-subtle` per design intent; pill text →
   `text-badge-blue`).
3. Migrate [components/navigation.tsx](../components/navigation.tsx) (hover text → accent token;
   borders → `border-subtle` w/ alpha; hover bg → `bg-surface-hover`).
4. Migrate [app/layout.tsx](../app/layout.tsx) skip link and
   [components/footer.tsx](../components/footer.tsx) border.
5. `npm run format`; visual pass in both themes (`npm run dev`).

**Testing plan.** Unit tests assert classes/behavior, not colors — most should pass unchanged;
update any test that asserts a literal class string (check
[test/components/navigation.test.tsx](../test/components/) and section tests). `npm run coverage`
must stay ≥80% (no new logic, so no new tests strictly required). Full Playwright run — the theme
spec ([tests/theme.spec.ts](../tests/theme.spec.ts)) is the main regression guard. If P1 (axe)
lands first, it also guards contrast through this migration — a good reason to sequence P1 before P5.

**Docs updates.** CLAUDE.md "Theme system" / styling bullets: extend the utility-class list
(`text-accent`, `text-badge-blue`, `border-subtle`, …). README unaffected.

**Risks.** Tailwind v4 variant composition over custom `@layer utilities` classes (e.g.
`hover:text-accent`) needs verification — if plain layered classes don't get variants, use the v4
`@utility` directive instead; confirm in Tailwind v4 docs before writing. Sub-pixel color drift
between palette classes and hand-picked HSL triplets — copy Tailwind's exact palette values.

**Size: M** (mechanical but touches five files + CSS + tests).

---

### P6 — Run `Mobile Chrome` in CI Playwright job

**Objective & rationale.** CI currently exercises only `--project=chromium` (desktop). The mobile
menu, sticky nav, and touch affordances are mobile-critical surfaces; the sibling repo's CI runs
`chromium` + `Mobile Chrome` for exactly this reason. Evidence: O6.

**Current state.** [.github/workflows/ci.yml](../.github/workflows/ci.yml) L136:
`npm run test:e2e -- --project=chromium`. [playwright.config.ts](../playwright.config.ts) already
defines a `Mobile Chrome` (Pixel 5) project — zero config work needed.
[tests/mobile-navigation.spec.ts](../tests/mobile-navigation.spec.ts) currently fakes mobile with
`test.use({ viewport })` on desktop Chrome.

**Design/approach.** Change the CI run line to
`npm run test:e2e -- --project=chromium --project="Mobile Chrome"` (both are Chromium-engine, so
the existing `npx playwright install … chromium` steps already cover the browser download — no new
browser installs, minimal CI-time cost). Audit specs for desktop assumptions: any spec that clicks
desktop-only nav links (hidden under `md:hidden`/`hidden md:flex` at mobile width) must branch on
viewport or scope selectors, and the mobile-navigation spec's forced viewport is harmless under
Mobile Chrome but its hamburger assertions must also pass on desktop-width chromium (they already
run there today via `test.use`).

**Step-by-step tasks.**
1. Edit [.github/workflows/ci.yml](../.github/workflows/ci.yml) L136 (quote `"Mobile Chrome"`).
2. Locally run `npx playwright test --project=chromium --project="Mobile Chrome"` and fix any
   spec that assumed a desktop viewport (likely candidates:
   [tests/homepage.spec.ts](../tests/homepage.spec.ts) nav-link visibility,
   [tests/theme.spec.ts](../tests/theme.spec.ts) toggle location — the toggle renders in both
   layouts per [components/navigation.tsx](../components/navigation.tsx) L73/L78, so probably fine).
3. `npm run format`.

**Testing plan.** The change *is* a testing change; validation is a green two-project local run +
green CI on the PR. No Vitest impact.

**Docs updates.** CLAUDE.md: two spots say "CI runs Chromium only" (Testing section and CI/CD
bullet) — update both. README "Testing" bullet likewise.

**Risks.** Doubles e2e wall-time in CI (single worker, `workers: 1` in CI per
[playwright.config.ts](../playwright.config.ts)) — acceptable for a suite this small; if slow,
raise CI workers to 2. Flaky viewport-dependent specs surface here rather than in production —
that's the point.

**Size: S.**

---

### P7 — Static-export preview script; neutralize `next start`

**Objective & rationale.** `npm start` runs `next start`, which errors (or serves wrongly) for a
static export — a footgun for contributors, and the reason the README's own command table omits it.
The sibling repo ships `npm run preview` (`npx serve out`) as the documented way to inspect the
production artifact. Evidence: O7.

**Current state.** [package.json](../package.json) scripts: `"start": "next start"`, no preview.
[README.md](../README.md) commands table (L29–39) documents `dev`/`build`/lint/format/tests only.

**Design/approach.** Add `"preview": "npx serve out"` (uses `npx`, so `serve` is not a permanent
dependency — matches the sibling's approach) and remove the `start` script entirely (nothing in
the repo, CI, or Cloudflare invokes it; Cloudflare Pages runs `npm run build` only). Removing
beats keeping a broken script.

**Step-by-step tasks.**
1. Edit [package.json](../package.json): delete `"start"`, add `"preview"`.
2. `npm run build && npm run preview` once locally to confirm `out/` serves (including `_headers`
   being inert locally — note `serve` does not apply Cloudflare `_headers`; preview is for content,
   not header testing).
3. Update README commands table + a one-line "Testing build output" note (mirroring the sibling's
   "no production preview server — `next start` does not serve the static export").
4. `npm run format`.

**Testing plan.** Manual preview check (step 2). No unit/e2e surface. Format gate as always.

**Docs updates.** README (step 3); CLAUDE.md Development commands block gains `npm run preview`.

**Risks.** `npx serve` fetches from the network on first use — fine for a dev convenience. None
otherwise.

**Size: S.**

---

## 4. Short outlines (remaining items)

### P8 — Enable + document CodeQL default setup

The sibling repo scans JS/TS + Actions via CodeQL **default setup** (repo *Settings → Code
security*), deliberately with no `codeql.yml` (advanced-config uploads conflict with default
setup). This repo documents no code scanning (O8). Action: verify in GitHub settings whether
default setup is already enabled (not visible from the repo contents); enable it if not; then add
a CLAUDE.md CI/CD bullet copying the sibling's wording, including the "no workflow file on
purpose" note so nobody adds one later. Settings-side change + docs-only commit. **Size: S.**

### P9 — Document the CSP `'unsafe-inline'` rationale in `_headers`

[public/\_headers](../public/_headers) keeps `'unsafe-inline'` in `script-src` (required: Next
emits inline bootstrap scripts and `next-themes` injects its no-flash inline script; a static
export has no server to mint nonces). The sibling repo carries an explanatory comment; this file
does not (O9), inviting a future "hardening" PR that would break theming. Action: add a 2–3 line
comment above the CSP line in `_headers` (comments are `#`-prefixed and stripped/ignored by
Cloudflare Pages) and, optionally, evaluate additions that cost nothing on this site:
`upgrade-insecure-requests`, `frame-ancestors 'none'` vs the current `'self'` (nothing embeds the
site), and `img-src` needs (currently `'self' data:` — the hero grid is a data: URI SVG in
[components/sections/HeroSection.tsx](../components/sections/HeroSection.tsx), so `data:` must
stay). Any CSP change should land together with P2's smoke workflow so the deployed header is
asserted. **Size: S.**

---

## 5. Suggested sequencing

1. **P2, P7, P9** — independent, small, zero app-code risk; can land as one or three tiny PRs.
2. **P1** — establish the axe gate *before* visual refactors.
3. **P3** — metadata + structured data (touches `tests/seo.spec.ts` only among specs).
4. **P5** — token migration under the protection of P1's contrast audit.
5. **P4** — section split (largest visual change; benefits from P5's tokens and P1's gate).
6. **P6** — flip CI to two Playwright projects once the suite is stable post-P4.
7. **P8** — settings-side; anytime.
