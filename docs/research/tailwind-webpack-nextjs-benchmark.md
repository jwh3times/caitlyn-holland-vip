# Tailwind CSS 4.3 webpack loader and Next.js 16.3

Research date: 2026-08-11. This note evaluates Tailwind CSS 4.3.3 and Next.js 16.3.0, the versions currently selected by this repository's [`package.json`](../../package.json). External claims below are limited to first-party Tailwind Labs, Vercel/Next.js, and webpack sources.

## Bottom line

Tailwind officially describes `@tailwindcss/webpack` as a first-party **webpack loader** added in Tailwind CSS 4.2, not as a webpack plugin despite the v4.3 announcement's “First-class webpack plugin” heading. Tailwind says that bypassing the PostCSS detour made Tailwind “over 2x faster” in large, complicated webpack projects and publishes one Next.js/Turbopack result for the tailwindcss.com docs: 932 ms with `@tailwindcss/postcss` versus 429 ms with `@tailwindcss/webpack` (2.17×). Tailwind also explicitly says Turbopack can run the loader through its webpack-loader compatibility layer. These are Tailwind's claims; the post supplies no command, hardware, sample count, cache state, project commit, statistical spread, or exact package versions beyond the release context. ([Tailwind CSS v4.3 announcement, published 2026-05-08](https://tailwindcss.com/blog/tailwindcss-v4-3))

There is an unresolved official-documentation contradiction. Next.js 16.3 documents `turbopack.rules` as a way to run webpack loaders and, since 16.2, can explicitly mark loader output as `type: "css"`. On the same page, however, it still says only loaders returning JavaScript are supported and loaders that transform stylesheets are not supported. `@tailwindcss/webpack` returns CSS, so the Tailwind claim goes beyond what Next.js 16.3's loader documentation promises. Treat the integration as something to prove in this repository, not as a compatibility guarantee inferred from Next.js documentation. ([Next.js `turbopack` configuration, last updated 2026-02-27](https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack))

## What Tailwind 4.3 officially documents

The published package metadata for 4.3.3 calls `@tailwindcss/webpack` “A webpack loader for Tailwind CSS v4,” exports CommonJS and ESM entry points, and lists webpack 5 as an optional peer. ([Tailwind package metadata at v4.3.3](https://github.com/tailwindlabs/tailwindcss/blob/v4.3.3/packages/%40tailwindcss-webpack/package.json))

Tailwind's documented generic webpack setup is:

```js
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  plugins: [new MiniCssExtractPlugin()],
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, "css-loader", "@tailwindcss/webpack"],
      },
    ],
  },
};
```

The input stylesheet then uses `@import "tailwindcss"`. Tailwind documents two loader options: `base`, the candidate-scan base directory (default: current working directory), and `optimize`, a boolean or `{ minify?: boolean }` that defaults to enabled in production. ([`@tailwindcss/webpack` v4.3.3 README](https://github.com/tailwindlabs/tailwindcss/blob/v4.3.3/packages/%40tailwindcss-webpack/README.md))

The 4.3.3 implementation confirms that `base` defaults to `process.cwd()`, `optimize` defaults according to `NODE_ENV === "production"`, the loader scans candidate files, registers them as dependencies, caches compiler/scanner state, and returns generated CSS. It also bypasses files that contain no relevant Tailwind at-rules. ([loader source at v4.3.3](https://github.com/tailwindlabs/tailwindcss/blob/v4.3.3/packages/%40tailwindcss-webpack/src/index.ts))

The generic webpack snippet is not a Next.js configuration recipe. Next.js supplies its own CSS pipeline, and Next warns that custom `webpack` changes are not covered by semver. If benchmarking actual webpack rather than Turbopack, `next build --webpack` selects webpack in Next.js 16; a custom `webpack()` hook is a separate, framework-specific integration and should not blindly duplicate Next's existing CSS rules. ([Next.js 16 upgrade guide](https://nextjs.org/docs/app/guides/upgrading/version-16), [Next.js custom webpack documentation](https://nextjs.org/docs/app/api-reference/config/next-config-js/webpack))

## How Next.js 16.3/Turbopack could consume it

Next.js 16 made Turbopack the default for both `next dev` and `next build`; `--webpack` opts out. A custom `webpack()` configuration is not consumed by Turbopack, while webpack loaders can be configured separately under `turbopack.rules`. ([Next.js 16 upgrade guide](https://nextjs.org/docs/app/guides/upgrading/version-16), [Next.js Turbopack API reference, last updated 2026-02-27](https://nextjs.org/docs/app/api-reference/turbopack))

The configuration shape implied by the Tailwind loader's CSS output and Next.js 16.3's rule API is:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: [
          {
            loader: "@tailwindcss/webpack",
            options: {
              base: process.cwd(),
            },
          },
        ],
        type: "css",
      },
    },
  },
};

export default nextConfig;
```

This is a **testable synthesis**, not a configuration published by either project for Next.js. Next documents loader names/options under `turbopack.rules`, requires options to be JSON-serializable primitives/objects/arrays, evaluates matching rules in order, and documents `type: "css"` as “Process as CSS.” The `type` facility was added in Next.js 16.2. ([Next.js `turbopack` configuration](https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack))

Do not add `css-loader` or `MiniCssExtractPlugin` to that Turbopack rule: Next says Turbopack already has built-in CSS support and does not support webpack plugins, while the Tailwind loader itself is the transformation being tested. ([Next.js `turbopack` configuration](https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack), [Next.js Turbopack API reference](https://nextjs.org/docs/app/api-reference/turbopack))

Two cautions make a real build proof essential:

1. The Next.js page says Turbopack executes loaders with `loader-runner` and implements most, but not all, of the loader API. It lists missing APIs including `emitFile`, `loadModule`, and `importModule`, plus partial filesystem support. Tailwind's 4.3.3 source uses the supported-looking core context methods `async`, `getOptions`, and `addDependency`, but source inspection is not a compatibility contract. ([Next.js `turbopack` configuration](https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack), [Tailwind loader source at v4.3.3](https://github.com/tailwindlabs/tailwindcss/blob/v4.3.3/packages/%40tailwindcss-webpack/src/index.ts))
2. Next.js 16.3's explicit “JavaScript output only” limitation conflicts with its newer CSS module type and Tailwind's published successful result. The conservative interpretation is that Tailwind tested a path that Next's prose has not yet documented or guaranteed. A failed CSS-returning rule would be consistent with the Next.js caveat, even though it would contradict Tailwind's broad compatibility statement. ([Next.js `turbopack` configuration](https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack), [Tailwind CSS v4.3 announcement](https://tailwindcss.com/blog/tailwindcss-v4-3))

## Benchmark caveats for this repository

At the start of this benchmark, the repository imported Tailwind through `@tailwindcss/postcss` in `postcss.config.mjs`, imported Tailwind from [`app/globals.css`](../../app/globals.css), used Turbopack's project root in [`next.config.ts`](../../next.config.ts), and ran a default `next build` with `output: "export"`. A static export makes one HTML file per route and writes deployable HTML/CSS/JavaScript assets to `out`; therefore whole-command timing includes much more than Tailwind compilation. ([Next.js static export guide](https://nextjs.org/docs/app/guides/static-exports))

A credible local comparison should therefore:

- Compare the existing PostCSS integration with exactly one Tailwind integration at a time. Remove `@tailwindcss/postcss` from the experimental loader variant; leaving both enabled would not isolate the loader and could process the same input twice. This follows directly from the then-current `postcss.config.mjs` (removed when the loader was adopted) and the loader rule under test.
- Pin exact versions (`tailwindcss`, the integration package, and Next.js), retain the same Node version, sources, `NODE_ENV`, `base`, and Tailwind input, and verify equivalent emitted CSS and rendered pages before comparing time. Tailwind's published number does not disclose these controls. ([Tailwind CSS v4.3 announcement](https://tailwindcss.com/blog/tailwindcss-v4-3))
- Measure cold and warm builds separately. Next.js 16.3 enables Turbopack filesystem caching for `next build` by default and writes it under `.next/cache/turbopack`; deleting `.next` gives a cold build, while preserving it measures a warm build. ([Next.js `turbopackFileSystemCache` documentation](https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopackFileSystemCache))
- Use repeated alternating runs and report median plus spread, not one wall-clock observation. Keep `out` cleanup identical between variants because static export writes that directory, and do not mix `next dev` compilation latency with full `next build` latency. ([Next.js static export guide](https://nextjs.org/docs/app/guides/static-exports), [Next.js Turbopack API reference](https://nextjs.org/docs/app/api-reference/turbopack))
- Report both end-to-end `next build` time and, if instrumentation permits, CSS/Tailwind time. The site is a small single-page static export, whereas Tailwind qualifies its >2× observation as coming from large, complicated projects; fixed Next.js type-checking, bundling, prerendering, and export work can dominate here. ([Tailwind CSS v4.3 announcement](https://tailwindcss.com/blog/tailwindcss-v4-3), [Next.js static export guide](https://nextjs.org/docs/app/guides/static-exports))
- Keep the bundler constant for the primary comparison: PostCSS-on-Turbopack versus webpack-loader-on-Turbopack. A separate `next build --webpack` result changes both the Tailwind integration and the bundler and cannot attribute a difference to `@tailwindcss/webpack`. Next.js exposes `--webpack` specifically as an opt-out from its Turbopack default. ([Next.js 16 upgrade guide](https://nextjs.org/docs/app/guides/upgrading/version-16))

## Recorded benchmark

The measurements were collected on 2026-08-11 on Windows 10.0.26200 x64, an AMD Ryzen 7 5800X3D (16 logical CPUs), 31.9 GiB RAM, and Node.js 26.4.0. Both variants used Next.js 16.3.0, Tailwind CSS 4.3.3, Turbopack, and the same source tree. The baseline commit was `e3bb6d9`; the captured loader prototype is commit `96ce58c` on [`codex/prototype-117-tailwind-webpack`](https://github.com/jwh3times/caitlyn-holland-vip/tree/codex/prototype-117-tailwind-webpack).

The repeatable harness is [`benchmarks/tailwind-integration.mjs`](../../benchmarks/tailwind-integration.mjs). For each of three pairs it deletes only `.next` and `out`, measures a cold `next build`, immediately measures a warm `next build` with Turbopack's filesystem cache retained, starts a cold `next dev`, requests `/` through the first successful response, touches the `app/globals.css` timestamp, and measures a fresh warm request before restoring the timestamp. Run it with:

```bash
npm ci
npm run benchmark:tailwind -- --variant=postcss --runs=3
npm run benchmark:tailwind -- --variant=webpack-loader --runs=3
```

The variants were run sequentially on isolated branches rather than alternated after every pair. One PostCSS build pair was a large system-noise outlier, so the comparison uses medians and publishes every sample instead of presenting the arithmetic mean as precise.

| End-to-end operation                                       | PostCSS samples (ms) | Loader samples (ms) | Median change                               |
| ---------------------------------------------------------- | -------------------- | ------------------- | ------------------------------------------- |
| Cold production build                                      | 9,289; 23,963; 8,746 | 6,552; 9,284; 7,031 | 9,289 → 7,031 (24.3% faster; 2.258 s saved) |
| Warm production build                                      | 4,933; 14,773; 6,747 | 7,652; 4,903; 4,273 | 6,747 → 4,903 (27.3% faster; 1.844 s saved) |
| Cold development start + first page                        | 4,643; 4,348; 5,870  | 3,949; 3,714; 3,821 | 4,643 → 3,821 (17.7% faster; 822 ms saved)  |
| Warm development request after stylesheet timestamp change | 72; 103; 91          | 78; 91; 77          | 91 → 78 (14.3% faster; 13 ms saved)         |

The production export emitted one minified CSS asset for each variant. Both assets were 32,358 bytes with SHA-256 `2fc595f5a91452c1bf86b0dccc0b18451ce1140137b515b1ddf2c9b5e8339c94`, providing byte-for-byte output equivalence rather than only a visual approximation. The loader prototype also passed formatting, lint, TypeScript, all 51 coverage tests, the production static export, and all 11 Chromium Playwright tests, including the class-driven dark-mode toggle.

## Decision

**Keep the webpack-loader integration.** The measured improvement is smaller than Tailwind's 2.17× Tailwind-only claim, as expected for a small end-to-end static build, but every median improved by at least 14%, the two user-noticeable cold paths saved 2.258 seconds and 822 milliseconds, and the generated CSS was byte-for-byte identical. The production configuration is also smaller: one Turbopack rule replaces the custom PostCSS configuration and removes both `@tailwindcss/postcss` and the now-unused direct `postcss` dependency.

The remaining risk is maintainability rather than observed behavior: Next.js 16.3's prose still says stylesheet-returning loaders are unsupported. The explicit `type: "css"` API, successful production/dev builds, and full browser suite provide adequate evidence to adopt it here, but future Next.js upgrades should retain the configuration regression test and static-export/browser checks.
