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

This repository currently imports Tailwind through `@tailwindcss/postcss` in [`postcss.config.mjs`](../../postcss.config.mjs), imports Tailwind from [`app/globals.css`](../../app/globals.css), uses Turbopack's project root in [`next.config.ts`](../../next.config.ts), and runs a default `next build` with `output: "export"`. A static export makes one HTML file per route and writes deployable HTML/CSS/JavaScript assets to `out`; therefore whole-command timing includes much more than Tailwind compilation. ([Next.js static export guide](https://nextjs.org/docs/app/guides/static-exports))

A credible local comparison should therefore:

- Compare the existing PostCSS integration with exactly one Tailwind integration at a time. Remove `@tailwindcss/postcss` from the experimental loader variant; leaving both enabled would not isolate the loader and could process the same input twice. This follows directly from the current [`postcss.config.mjs`](../../postcss.config.mjs) and the loader rule under test.
- Pin exact versions (`tailwindcss`, the integration package, and Next.js), retain the same Node version, sources, `NODE_ENV`, `base`, and Tailwind input, and verify equivalent emitted CSS and rendered pages before comparing time. Tailwind's published number does not disclose these controls. ([Tailwind CSS v4.3 announcement](https://tailwindcss.com/blog/tailwindcss-v4-3))
- Measure cold and warm builds separately. Next.js 16.3 enables Turbopack filesystem caching for `next build` by default and writes it under `.next/cache/turbopack`; deleting `.next` gives a cold build, while preserving it measures a warm build. ([Next.js `turbopackFileSystemCache` documentation](https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopackFileSystemCache))
- Use repeated alternating runs and report median plus spread, not one wall-clock observation. Keep `out` cleanup identical between variants because static export writes that directory, and do not mix `next dev` compilation latency with full `next build` latency. ([Next.js static export guide](https://nextjs.org/docs/app/guides/static-exports), [Next.js Turbopack API reference](https://nextjs.org/docs/app/api-reference/turbopack))
- Report both end-to-end `next build` time and, if instrumentation permits, CSS/Tailwind time. The site is a small single-page static export, whereas Tailwind qualifies its >2× observation as coming from large, complicated projects; fixed Next.js type-checking, bundling, prerendering, and export work can dominate here. ([Tailwind CSS v4.3 announcement](https://tailwindcss.com/blog/tailwindcss-v4-3), [Next.js static export guide](https://nextjs.org/docs/app/guides/static-exports))
- Keep the bundler constant for the primary comparison: PostCSS-on-Turbopack versus webpack-loader-on-Turbopack. A separate `next build --webpack` result changes both the Tailwind integration and the bundler and cannot attribute a difference to `@tailwindcss/webpack`. Next.js exposes `--webpack` specifically as an opt-out from its Turbopack default. ([Next.js 16 upgrade guide](https://nextjs.org/docs/app/guides/upgrading/version-16))

## Conclusion

Tailwind 4.3.3 provides a documented, configurable webpack loader and makes a concrete 2.17× Tailwind build-time claim from a Next.js/Turbopack test. Next.js 16.3 has the loader-rule and CSS-output-type primitives that suggest how to wire it in, but its own documentation simultaneously excludes stylesheet-returning loaders. For this static-export repository, adoption should begin as a controlled benchmark branch with output-equivalence checks; the official sources do not justify assuming either the 2.17× result or compatibility without that proof.
