### Added

- `docs/agents/guard.md` lists the commands and paths the shared `scripts/guard.mjs` guard stops in
  this repository on top of its shared rules: `npx skills update`, force-staging or submoduling the
  private companion, force-staging an ignored env file, printing the 1Password service-account
  token, and protected local paths (`private/`, env files, local Claude settings,
  `node_modules/`). The Doc map names it. No site behavior changes.
