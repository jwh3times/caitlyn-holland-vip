Closes #

<!-- Keep the issue link as the first line: `Closes #<n>` when this PR finishes the issue,
`Part of #<n>` for one slice of a spec that stays open, or `Flow waived by the user: <reason>`.
Delete it only for exempt dependency or docs-only work. See docs/agents/dev-flow.md. -->

## Summary

<!-- What does this PR change, and why? -->

## Type of change

- [ ] Content / copy
- [ ] UI / styling
- [ ] Feature
- [ ] Bug fix
- [ ] Refactor / chore
- [ ] Dependency update
- [ ] CI / tooling

## Checklist

- [ ] `npm run format:check` passes (or `npm run format` was run)
- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds (static export)
- [ ] `npm run coverage` passes (≥ 80% gate)
- [ ] `npm test` (Playwright e2e) passes
- [ ] `npm run sync:agents:check` and `npm run lint:agents` pass (for skill or agent edits)
- [ ] [`CHANGELOG.md`](../CHANGELOG.md) has a `## [x.y.z]` section for the version this merge will mint —
      run `node scripts/next-version.mjs` for the number, or say "ship it" to Claude Code (dependabot PRs are exempt)
- [ ] Verified in both light and dark mode (for UI changes)
- [ ] Checked responsive / mobile layout (for UI changes)

## Notes

<!-- Screenshots for UI changes, follow-ups, or anything reviewers should know. -->
