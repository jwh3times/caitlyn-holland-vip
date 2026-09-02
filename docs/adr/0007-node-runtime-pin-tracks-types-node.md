# The Node runtime pin and `@types/node` move together

`.nvmrc` pinned Node 24 while `@types/node` had drifted to `26.x`, so the compiler advertised Node 26 APIs that neither CI nor the Cloudflare Pages build could execute. A type-check that passes on a runtime that would throw is worse than no type-check on the boundary it covers, and the drift arrives on its own — Dependabot bumps `@types/node` majors, and nothing bumps `.nvmrc`.

We closed the gap by moving the runtime to **Node 26** rather than pulling the typings back to `24.x`. The two are now treated as one decision: whichever moves, the other moves with it in the same change.

## Considered options

Holding `@types/node` at `24.x` was the alternative, and the conservative one — Node 24 is Active LTS, Node 26 is still a _Current_ release and does not enter LTS until late October 2026. It was rejected because this deployment does not actually take on LTS-shaped risk: the build is a static export ([ADR-0001](0001-static-export-cloudflare-pages.md)), so Node runs only in CI, on the Cloudflare Pages builder, and on developer machines — never in production serving traffic. Nothing user-facing depends on the runtime's support window. Meanwhile pinning typings to `24.x` needs a permanent `@types/node` version ceiling that a contributor or Dependabot config change will eventually lift by accident, and the direction is temporary anyway: Node 26 becomes the LTS line in a few months.

An `engines` field in `package.json` was considered as a second guard and left out — it is advisory
unless every environment enables `engine-strict`, and it does not prevent drift between `.nvmrc`
and `@types/node`. After an older npm was observed stripping npm 11's `libc` metadata from the
lockfile, we added npm's source-worktree-specific `devEngines` policy instead. It rejects
`install`, `ci`, and `run` before they start unless the active runtime is Node 26 and the package
manager is npm 11. Tests bind that policy to `.nvmrc` and the typings major, so all three move as
one toolchain decision.

## Consequences

- Until Node 26 reaches LTS, the toolchain runs on a Current release: a shorter patch window and less third-party soak time than the LTS line. No action is required when it graduates — the pin is already there.
- Cloudflare Pages resolves `.nvmrc` itself, so the deploy target follows the pin with no dashboard change. Cloudflare accepts a `NODE_VERSION` build variable as well and does not document which of the two wins; leaving it unset keeps `.nvmrc` the only answer.
- A future `@types/node` major from Dependabot is only mergeable alongside an `.nvmrc` bump. Reviewing one of those PRs means checking both.
- Contributors and remote agents must activate the pinned Node/npm line before any npm command.
  Ordinary setup uses `npm ci`; `npm install` is reserved for intentional dependency changes.
