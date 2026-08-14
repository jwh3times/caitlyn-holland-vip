# Oxlint native `no-location-assign-relative-destination` status

_Researched 2026-08-12 for issue #119._

## Decision

**No-go. Do not remove `@next/eslint-plugin-next` yet.** The repository has Oxlint 1.78.0
installed, which is also the latest official release checked (released 2026-08-10). It provides
no native equivalent of
`@next/next/no-location-assign-relative-destination`. The Oxc project's CI-maintained
[@next/eslint-plugin-next tracker](https://github.com/oxc-project/oxc/issues/1929) reports that
one of 22 recommended rules remains TODO, and the only row without an implemented marker is
`nextjs/no-location-assign-relative-destination`. The rule is also absent from the
[official Oxlint rule table](https://oxc.rs/docs/guide/usage/linter/rules.html), the
[1.78.0 release notes](https://github.com/oxc-project/oxc/releases/tag/apps_v1.78.0), and the
[1.78.0 `nextjs` rule source directory](https://github.com/oxc-project/oxc/tree/c42d6397eab5b2d5bb2bd6746c57bc2a9cad21bd/crates/oxc_linter/src/rules/nextjs).
The installed version is recorded in this repository's
[`package-lock.json`](../../package-lock.json).

Consequently, there is no supported native rule configuration to enable and no native
implementation whose behavior can be shown to match Next.js. Issue #119's replacement and
parity criteria are not met.

## Expected native name and configuration

Oxc's tracker reserves the native rule name
`nextjs/no-location-assign-relative-destination`. Oxlint's
[`plugins` configuration](https://oxc.rs/docs/guide/usage/linter/config-file-reference#plugins)
uses the built-in plugin name as the rule prefix, so the eventual configuration is expected to
be:

```json
{
  "plugins": ["typescript", "react", "nextjs"],
  "rules": {
    "nextjs/no-location-assign-relative-destination": "warn"
  }
}
```

This is the expected syntax **after Oxc implements the rule**, not a working configuration
today. The current configuration correctly uses a JavaScript-plugin alias:
`nextjs-js/no-location-assign-relative-destination`. Oxlint's
[`jsPlugins` reference](https://oxc.rs/docs/guide/usage/linter/config-file-reference#jsplugins)
documents JavaScript-plugin support as alpha and requires an alias here because `nextjs` is
reserved for the built-in Rust plugin.

When the native rule becomes available, the configuration cleanup should:

1. Replace the `nextjs-js/...` rule key with the native `nextjs/...` key.
2. Retain `nextjs` in `plugins`.
3. Delete the entire `jsPlugins` entry for `@next/eslint-plugin-next`.

## Behavior that a native replacement must match

Next.js 16.3.0's
[`no-location-assign-relative-destination` implementation](https://github.com/vercel/next.js/blob/d73f5622e226358dcef8cf7a8a373333ff265ae7/packages/eslint-plugin-next/src/rules/no-location-assign-relative-destination.ts#L1-L160)
is the parity baseline. It has no options or fixer and reports these two navigation forms when
the destination has a statically determinable relative prefix:

- `location.assign(destination)` and `location.href = destination`;
- the same accesses rooted at global `window`, `globalThis`, `document`, or `self`;
- dot properties and computed string properties such as `location["assign"]`;
- constant strings and resolvable constants, a template literal's static leading segment, the
  left side of string concatenation, and an identifier's latest preceding write.

It does not report a shadowed local binding, a first argument that is a spread, a destination
whose prefix cannot be inferred, a scheme URL such as `https:`, or a protocol-relative URL
beginning with `//`. These details follow directly from the rule's global-reference check,
property matcher, static-prefix evaluator, and absolute-URL expression in the pinned source.

Because Oxlint has no native implementation, behavior does not currently match: there is
nothing to compare or run. Before removing the JavaScript fallback, a future implementation
should be tested against this complete baseline rather than accepted solely because the rule
name appears in the rules table.

## Dependency and lockfile cleanup after a future replacement

The direct manifest change will be removal of `@next/eslint-plugin-next` from `devDependencies`.
The plugin's
[pinned Next.js manifest](https://github.com/vercel/next.js/blob/d73f5622e226358dcef8cf7a8a373333ff265ae7/packages/eslint-plugin-next/package.json#L14-L21)
shows two runtime dependencies: `@eslint-community/eslint-utils@4.9.1` and
`fast-glob@3.3.1`. In this repository those dependencies bring in ESLint and its support tree,
plus fast-glob's glob-matching tree; they are not otherwise needed by the root manifest.

A read-only run of
`npm uninstall --save-dev @next/eslint-plugin-next --dry-run --json` against the current lockfile
predicted removal of exactly **84 installed package records**. That set includes:

- `@next/eslint-plugin-next`, `@eslint-community/eslint-utils`, and `fast-glob`;
- the auto-installed ESLint 10.8.0 peer and its `@eslint/*`, `@humanfs/*`,
  `@humanwhocodes/*`, parser, scope, and cache support packages;
- fast-glob's `@nodelib/*`, glob, micromatch, and related utility packages.

The actual implementation should use npm to update both files rather than hand-edit the lock:
remove the root dependency from `package.json`, remove its root lockfile entry, and allow npm to
prune the now-unreachable package records from `package-lock.json`. The count is a snapshot of
the 2026-08-12 dependency graph and should be rechecked when the native rule lands.

## Revisit trigger

Reopen the implementation when all three are true:

1. The Oxc tracker marks `nextjs/no-location-assign-relative-destination` implemented.
2. The rule appears in an Oxlint release and in the official rule table/source tree.
3. Targeted fixtures demonstrate parity with the pinned Next.js behavior above.
