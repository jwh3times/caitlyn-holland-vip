# Next.js 16.3 TypeScript CLI default

Research date: 2026-08-12. This note evaluates the versions installed in this repository: Next.js 16.3.0 and TypeScript 7.0.2, as selected by [`package.json`](../../package.json) and resolved by [`package-lock.json`](../../package-lock.json). External claims below use only first-party Next.js and TypeScript sources.

## Bottom line

**Go: remove `experimental.useTypeScriptCli: true` from `next.config.ts`.** Next.js 16.3.0 makes the project-local TypeScript CLI the default, so omitting the property preserves the current production-build behavior. The 16.3.0 documentation says that `next build` runs project-local `tsc` by default and requires no additional TypeScript 7 configuration; the tagged implementation sets `defaultConfig.experimental.useTypeScriptCli` to `true`. ([Next.js 16.3.0 `useTypeScriptCli` documentation](https://github.com/vercel/next.js/blob/v16.3.0/docs/01-app/03-api-reference/05-config/01-next-config-js/useTypeScriptCli.mdx), [Next.js 16.3.0 default configuration](https://github.com/vercel/next.js/blob/v16.3.0/packages/next/src/server/config-shared.ts#L2022-L2091))

This is a default-value cleanup, **not** a stability graduation. The documentation still labels `useTypeScriptCli` experimental and warns that its behavior may change. Keep treating Next.js upgrades as the point at which this default must be rechecked. ([Next.js 16.3.0 TypeScript guide](https://github.com/vercel/next.js/blob/v16.3.0/docs/01-app/03-api-reference/05-config/02-typescript.mdx#using-typescript-7))

Do not set the property to `false`: TypeScript 7.0 ships a `tsc` executable but no JavaScript compiler API, and Next.js documents that opting into its API checker with TypeScript 7 makes `next build` exit. ([TypeScript 7.0 announcement](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#running-side-by-side-with-typescript-60), [Next.js 16.3.0 `useTypeScriptCli` documentation](https://github.com/vercel/next.js/blob/v16.3.0/docs/01-app/03-api-reference/05-config/01-next-config-js/useTypeScriptCli.mdx))

## What changed in Next.js

Next.js first added `experimental.useTypeScriptCli` as an explicit opt-in: the July 10 implementation commit said the JavaScript API remained the default. On August 3, the follow-up changed the default from `false` to `true`, retained `false` as the API-checker opt-out, updated the production integration test to omit the property, and added a configuration test for both the default and opt-out. Both changes shipped in the repository's installed Next.js 16.3.0 release. ([initial CLI backend commit](https://github.com/vercel/next.js/commit/a249dcbcee7267c08ec3ab0705b9a47b4c4097dd), [default-enablement commit](https://github.com/vercel/next.js/commit/cbf0cef687c9914a2cf9aa6a1ad1d461895a9069), [Next.js 16.3.0 release](https://github.com/vercel/next.js/releases/tag/v16.3.0))

The option remains nested under `experimental` and its documentation frontmatter remains `version: experimental`. “Default” and “stable” are therefore separate findings here: the former is true in 16.3.0; the latter is not claimed by Next.js. ([tagged option documentation](https://github.com/vercel/next.js/blob/v16.3.0/docs/01-app/03-api-reference/05-config/01-next-config-js/useTypeScriptCli.mdx))

## Production build path

Removing the explicit property still follows this path in Next.js 16.3.0:

1. The merged Next.js configuration supplies `useTypeScriptCli: true` from `defaultConfig`. The build reads that resolved value and runs TypeScript unless `typescript.ignoreBuildErrors` is true. ([default configuration](https://github.com/vercel/next.js/blob/v16.3.0/packages/next/src/server/config-shared.ts#L2022-L2091), [build type-check orchestration](https://github.com/vercel/next.js/blob/v16.3.0/packages/next/src/build/type-check.ts))
2. Next.js resolves `typescript/package.json` from the project directory, reads that package's `bin.tsc`, and selects its resolved `tscPath`; for TypeScript 7's extensionless ESM wrapper it deliberately falls back to the same package's `lib/tsc.js`. This is project-local resolution, not a bundled or global compiler. ([TypeScript package and CLI resolution](https://github.com/vercel/next.js/blob/v16.3.0/packages/next/src/lib/typescript/runTypeScriptCli.ts#L16-L56))
3. The checker invokes that path through the current Node executable with `--project <configured tsconfig> --noEmit`; a nonzero compiler exit becomes a Next.js `CompileError`. ([CLI process invocation](https://github.com/vercel/next.js/blob/v16.3.0/packages/next/src/lib/typescript/runTypeScriptCli.ts#L82-L121), [build checker arguments and failure handling](https://github.com/vercel/next.js/blob/v16.3.0/packages/next/src/lib/typescript/runTypeCheckCli.ts#L25-L56))

The installed 16.3.0 build completed successfully on 2026-08-12 and printed `Running TypeScript` followed by `Finished TypeScript`. Source inspection establishes that the selected CLI is this repository's installed TypeScript 7.0.2; the console label by itself would not establish which checker ran.

## Failure proof after removing the property

Verify the follow-up change with a deliberate type error in a file included by this repository's `tsconfig.json`, for example:

```ts
export const invalidValue: number = "not a number";
```

Then run `npm run build` and require all of the following:

- the command exits nonzero;
- output names the injected file;
- output contains `error TS2322` and reports that `string` is not assignable to `number`;
- after deleting the temporary error, `npm run build` succeeds again.

This mirrors Next.js's own TypeScript 7 production test: its configuration omits `useTypeScriptCli`, it injects the same invalid assignment, and it asserts exit code 1 plus the raw TS2322 diagnostic. That test also confirms telemetry identifies the successful default path as `typescript-cli`; setting the option to `false` with TypeScript 7 instead fails with API-compatibility guidance. ([Next.js 16.3.0 TypeScript CLI production test](https://github.com/vercel/next.js/blob/v16.3.0/test/production/app-dir/typescript-cli/typescript-cli.test.ts))

The failure check is important regression coverage because a successful build alone cannot distinguish “the intended compiler checked cleanly” from “type checking was skipped.” Keep `typescript.ignoreBuildErrors` unset or false during this proof; Next.js documents that enabling it skips the CLI checker. ([Next.js 16.3.0 TypeScript configuration](https://github.com/vercel/next.js/blob/v16.3.0/docs/01-app/03-api-reference/05-config/02-typescript.mdx#disabling-typescript-errors-in-production))

## Decision

Remove only the redundant `experimental.useTypeScriptCli: true` line (and the empty `experimental` object if it has no other entries). Retain TypeScript 7.0.2, retain production type checking, and verify the removal with the invalid-type build failure above. Revisit the assumption whenever Next.js is upgraded because the backend is still explicitly experimental.
