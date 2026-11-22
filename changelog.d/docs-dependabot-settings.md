### Added

- `docs/agents/dependabot.md` holds what the shared `dependabot` skill reads to review this
  repository's Dependabot PRs: the Node 26 and npm 11 or 12 install CI runs, where the dependencies
  are used, the facts a review must not get wrong (static export, the `@types/node` and `.nvmrc`
  pairing of ADR-0007, the Tailwind and Vitest packages that move together), and the gates and
  known fixes for each kind of bump, among them the Tailwind range alignment that unblocked #265
  and #269. The Doc map lists it. No site behavior changes.
